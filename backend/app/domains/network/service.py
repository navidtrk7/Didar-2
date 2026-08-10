"""Network domain — parties, memberships, custom roles (Iran gold market)."""

from __future__ import annotations

import time
from typing import Any

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.domains.network.party_types import PARTY_TYPES, canonical_kind, type_meta
from app.models import CustomRole, Organization, PartyMembership, User, UserRoleGrant
from app.services.events import append_event, now_label

SYSTEM_ROLES = [
    ("admin", "ادمین", "دسترسی کامل حاکمیت و دامنه‌ها", True),
    ("producer", "تولیدکننده", "ورود محصول و ارسال به QC", True),
    ("qc", "کنترل کیفیت", "بازرسی و تأیید قطعه", True),
    ("warehouse", "انبار", "موجودی و custody فیزیکی", True),
    ("agent", "ایجنت", "پیش‌فاکتور و فروش میدانی", True),
    ("retailer", "خرده‌فروش / گالری", "سفارش و موجودی فروشگاه", True),
    ("pricing", "قیمت‌گذاری", "قوانین نرخ و شبیه‌ساز", True),
    ("finance", "مالی", "اعتبار، تسویه، دفترکل", True),
    ("customer", "مشتری", "گارانتی و پیگیری", True),
]


def _tid() -> str:
    return str(int(time.time() * 1000))


def list_party_types() -> list[dict[str, Any]]:
    return PARTY_TYPES


def list_parties(
    db: Session,
    *,
    kind: str | None = None,
    status: str | None = "active",
    include_archived: bool = False,
) -> list[Organization]:
    q = db.query(Organization).order_by(Organization.name)
    if kind:
        ck = canonical_kind(kind)
        aliases = [ck]
        meta = type_meta(ck)
        if meta:
            aliases.extend(meta.get("aliases") or [])
        # also match legacy if filtering by alias
        for t in PARTY_TYPES:
            if kind in (t.get("aliases") or []) or t["kind"] == kind:
                aliases.append(t["kind"])
                aliases.extend(t.get("aliases") or [])
        aliases = list({a for a in aliases if a})
        q = q.filter(Organization.kind.in_(aliases))
    if not include_archived:
        if status:
            q = q.filter(Organization.status == status)
        else:
            q = q.filter(Organization.status != "archived")
    elif status:
        q = q.filter(Organization.status == status)
    return q.all()


def party_member_count(db: Session, org_id: str) -> int:
    return (
        db.query(PartyMembership)
        .filter(PartyMembership.org_id == org_id, PartyMembership.status == "active")
        .count()
    )


def get_party(db: Session, party_id: str) -> Organization:
    row = db.get(Organization, party_id)
    if not row:
        raise HTTPException(404, "طرف شبکه یافت نشد")
    return row


def create_party(
    db: Session,
    *,
    name: str,
    kind: str,
    actor: str,
    city: str | None = None,
    address: str | None = None,
    phone: str | None = None,
    union_license: str | None = None,
    national_id: str | None = None,
    summary: str | None = None,
    profile: dict[str, Any] | None = None,
) -> Organization:
    ck = canonical_kind(kind)
    if not type_meta(ck):
        raise HTTPException(400, f"نوع طرف شبکه نامعتبر است: {kind}")
    name = name.strip()
    if not name:
        raise HTTPException(400, "نام الزامی است")
    if db.query(Organization).filter(Organization.name == name).first():
        raise HTTPException(409, "نام تکراری است")

    meta = type_meta(ck) or {}
    default_summary = summary or meta.get("what_they_do")
    prof = dict(profile or {})
    if "capabilities" not in prof:
        prof["capabilities"] = list(meta.get("capabilities") or [])

    row = Organization(
        id=f"org-{_tid()}",
        name=name,
        kind=ck,
        status="active",
        city=(city or "").strip() or None,
        address=(address or "").strip() or None,
        phone=(phone or "").strip() or None,
        union_license=(union_license or "").strip() or None,
        national_id=(national_id or "").strip() or None,
        summary=default_summary,
        profile=prof,
    )
    db.add(row)
    append_event(
        db,
        event_type="network.party_created",
        aggregate_type="organization",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role="admin",
        payload={"name": name, "kind": ck},
    )
    db.commit()
    db.refresh(row)
    return row


def update_party(
    db: Session,
    *,
    party_id: str,
    actor: str,
    **fields: Any,
) -> Organization:
    row = get_party(db, party_id)
    if row.status == "archived" and fields.get("status") != "active":
        raise HTTPException(409, "طرف بایگانی‌شده است — ابتدا فعال کنید")

    allowed = {
        "name",
        "city",
        "address",
        "phone",
        "union_license",
        "national_id",
        "summary",
        "profile",
        "kind",
    }
    for k, v in fields.items():
        if k not in allowed or v is None:
            continue
        if k == "kind":
            ck = canonical_kind(str(v))
            if not type_meta(ck):
                raise HTTPException(400, f"نوع نامعتبر: {v}")
            setattr(row, k, ck)
        elif k == "name":
            name = str(v).strip()
            if not name:
                raise HTTPException(400, "نام خالی نیست")
            clash = (
                db.query(Organization)
                .filter(Organization.name == name, Organization.id != party_id)
                .first()
            )
            if clash:
                raise HTTPException(409, "نام تکراری است")
            row.name = name
        elif k == "profile" and isinstance(v, dict):
            row.profile = {**(row.profile or {}), **v}
        else:
            setattr(row, k, v if not isinstance(v, str) else (v.strip() or None))

    append_event(
        db,
        event_type="network.party_updated",
        aggregate_type="organization",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role="admin",
        payload={"fields": [k for k in fields if k in allowed]},
    )
    db.commit()
    db.refresh(row)
    return row


def archive_party(db: Session, *, party_id: str, actor: str) -> Organization:
    row = get_party(db, party_id)
    row.status = "archived"
    append_event(
        db,
        event_type="network.party_archived",
        aggregate_type="organization",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role="admin",
        payload={"name": row.name},
    )
    db.commit()
    db.refresh(row)
    return row


def restore_party(db: Session, *, party_id: str, actor: str) -> Organization:
    row = get_party(db, party_id)
    row.status = "active"
    append_event(
        db,
        event_type="network.party_restored",
        aggregate_type="organization",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role="admin",
        payload={"name": row.name},
    )
    db.commit()
    db.refresh(row)
    return row


def list_memberships(db: Session, *, org_id: str) -> list[PartyMembership]:
    return (
        db.query(PartyMembership)
        .filter(PartyMembership.org_id == org_id, PartyMembership.status == "active")
        .order_by(PartyMembership.created_at.desc())
        .all()
    )


def list_memberships_for_user(db: Session, *, user_id: str) -> list[PartyMembership]:
    return (
        db.query(PartyMembership)
        .filter(
            PartyMembership.user_id == user_id,
            PartyMembership.status == "active",
        )
        .order_by(PartyMembership.created_at.desc())
        .all()
    )


def assign_member(
    db: Session,
    *,
    org_id: str,
    user_id: str,
    title: str,
    actor: str,
) -> PartyMembership:
    get_party(db, org_id)
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "کاربر یافت نشد")
    existing = (
        db.query(PartyMembership)
        .filter(PartyMembership.org_id == org_id, PartyMembership.user_id == user_id)
        .first()
    )
    if existing:
        existing.status = "active"
        existing.title = title.strip() or existing.title
        db.commit()
        db.refresh(existing)
        return existing
    row = PartyMembership(
        id=f"pm-{_tid()}",
        user_id=user_id,
        org_id=org_id,
        title=title.strip() or "عضو",
        status="active",
        created_label=now_label(),
    )
    db.add(row)
    append_event(
        db,
        event_type="network.member_assigned",
        aggregate_type="organization",
        aggregate_id=org_id,
        actor_name=actor,
        actor_role="admin",
        payload={"user_id": user_id, "title": row.title},
    )
    db.commit()
    db.refresh(row)
    return row


def unassign_member(db: Session, *, membership_id: str, actor: str) -> PartyMembership:
    row = db.get(PartyMembership, membership_id)
    if not row:
        raise HTTPException(404, "عضویت یافت نشد")
    row.status = "removed"
    append_event(
        db,
        event_type="network.member_unassigned",
        aggregate_type="organization",
        aggregate_id=row.org_id,
        actor_name=actor,
        actor_role="admin",
        payload={"user_id": row.user_id, "membership_id": membership_id},
    )
    db.commit()
    db.refresh(row)
    return row


def ensure_system_roles(db: Session) -> None:
    for code, label, desc, is_sys in SYSTEM_ROLES:
        if db.query(CustomRole).filter(CustomRole.code == code).first():
            continue
        db.add(
            CustomRole(
                id=f"role-{code}",
                code=code,
                label_fa=label,
                description=desc,
                permissions=[],
                is_system=is_sys,
                status="active",
                created_label=now_label(),
            )
        )
    db.commit()


def list_roles(db: Session, *, include_archived: bool = False) -> list[CustomRole]:
    ensure_system_roles(db)
    q = db.query(CustomRole).order_by(CustomRole.is_system.desc(), CustomRole.label_fa)
    if not include_archived:
        q = q.filter(CustomRole.status == "active")
    return q.all()


def create_custom_role(
    db: Session,
    *,
    code: str,
    label_fa: str,
    description: str,
    permissions: list[str],
    actor: str,
) -> CustomRole:
    ensure_system_roles(db)
    code = code.strip().lower().replace(" ", "_")
    if not code or not label_fa.strip():
        raise HTTPException(400, "کد و عنوان نقش الزامی است")
    if db.query(CustomRole).filter(CustomRole.code == code).first():
        raise HTTPException(409, "کد نقش تکراری است")
    row = CustomRole(
        id=f"role-{_tid()}",
        code=code,
        label_fa=label_fa.strip(),
        description=description.strip(),
        permissions=list(permissions or []),
        is_system=False,
        status="active",
        created_label=now_label(),
    )
    db.add(row)
    append_event(
        db,
        event_type="network.role_created",
        aggregate_type="custom_role",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role="admin",
        payload={"code": code, "label_fa": label_fa},
    )
    db.commit()
    db.refresh(row)
    return row


def archive_role(db: Session, *, role_id: str, actor: str) -> CustomRole:
    row = db.get(CustomRole, role_id)
    if not row:
        raise HTTPException(404, "نقش یافت نشد")
    if row.is_system:
        raise HTTPException(400, "نقش سیستمی را نمی‌توان حذف/بایگانی کرد")
    row.status = "archived"
    append_event(
        db,
        event_type="network.role_archived",
        aggregate_type="custom_role",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role="admin",
        payload={"code": row.code},
    )
    db.commit()
    db.refresh(row)
    return row


def grant_role(db: Session, *, user_id: str, role_code: str, actor: str) -> UserRoleGrant:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "کاربر یافت نشد")
    ensure_system_roles(db)
    role = db.query(CustomRole).filter(CustomRole.code == role_code, CustomRole.status == "active").first()
    if not role:
        raise HTTPException(404, "نقش فعال یافت نشد")
    existing = (
        db.query(UserRoleGrant)
        .filter(UserRoleGrant.user_id == user_id, UserRoleGrant.role_code == role_code)
        .first()
    )
    if existing:
        existing.status = "active"
        db.commit()
        db.refresh(existing)
        return existing
    row = UserRoleGrant(
        id=f"urg-{_tid()}",
        user_id=user_id,
        role_code=role_code,
        status="active",
        created_label=now_label(),
    )
    db.add(row)
    append_event(
        db,
        event_type="network.role_granted",
        aggregate_type="user",
        aggregate_id=user_id,
        actor_name=actor,
        actor_role="admin",
        payload={"role_code": role_code},
    )
    db.commit()
    db.refresh(row)
    return row


def revoke_role(db: Session, *, grant_id: str, actor: str) -> UserRoleGrant:
    row = db.get(UserRoleGrant, grant_id)
    if not row:
        raise HTTPException(404, "اعطای نقش یافت نشد")
    # Do not revoke if it's the only/primary via this table — primary users.role stays
    row.status = "revoked"
    append_event(
        db,
        event_type="network.role_revoked",
        aggregate_type="user",
        aggregate_id=row.user_id,
        actor_name=actor,
        actor_role="admin",
        payload={"role_code": row.role_code, "grant_id": grant_id},
    )
    db.commit()
    db.refresh(row)
    return row


def list_user_roles(db: Session, *, user_id: str) -> list[str]:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "کاربر یافت نشد")
    codes = {user.role}
    for g in (
        db.query(UserRoleGrant)
        .filter(UserRoleGrant.user_id == user_id, UserRoleGrant.status == "active")
        .all()
    ):
        codes.add(g.role_code)
    return sorted(codes)


def list_people(db: Session) -> list[User]:
    return db.query(User).order_by(User.name).all()
