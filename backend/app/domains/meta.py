"""Thin domain stubs — register presence until full modules land."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.deps import get_current_user
from app.domains import DOMAIN_IDS, DOMAIN_LABELS_FA
from app.domains.permissions import (
    domains_for_user,
    effective_roles,
    permissions_for_user,
    require_permission,
)
from app.models import User

meta_router = APIRouter(tags=["domains"])


@meta_router.get("/domains")
def list_domains(user: User = Depends(require_permission("governance.view"))):
    del user
    return [
        {"id": d, "label_fa": DOMAIN_LABELS_FA[d]}
        for d in DOMAIN_IDS
    ]


@meta_router.get("/domains/me")
def my_domains(user: Annotated[User, Depends(get_current_user)]):
    return {
        "role": user.role,
        "roles": sorted(effective_roles(user)),
        "domains": domains_for_user(user),
        "permissions": permissions_for_user(user),
    }
