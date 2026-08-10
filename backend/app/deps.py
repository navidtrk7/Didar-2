from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session, joinedload

from app.config import get_settings
from app.db import get_db
from app.models import User

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return pwd.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd.verify(password, password_hash)


def create_access_token(*, user_id: str, role: str, username: str) -> str:
    settings = get_settings()
    payload = {
        "sub": user_id,
        "role": role,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expire_hours),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def decode_token(token: str) -> dict:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(401, "توکن نامعتبر یا منقضی است") from exc


def get_current_user(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    if not creds:
        raise HTTPException(401, "احراز هویت لازم است")
    data = decode_token(creds.credentials)
    user = (
        db.query(User)
        .options(joinedload(User.organization), joinedload(User.role_grants))
        .filter(User.id == data.get("sub"))
        .first()
    )
    if not user or user.status != "active":
        raise HTTPException(401, "کاربر معتبر نیست")
    return user


def require_roles(*roles: str):
    def _dep(user: Annotated[User, Depends(get_current_user)]) -> User:
        from app.domains.permissions import effective_roles

        have = effective_roles(user)
        if "admin" in have or any(r in have for r in roles):
            return user
        raise HTTPException(403, "دسترسی مجاز نیست")

    return _dep
