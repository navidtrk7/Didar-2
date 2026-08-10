"""Network HTTP routes — parties, memberships, roles."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.domains import network as network_domain
from app.domains.network.party_types import canonical_kind, type_meta
from app.domains.permissions import require_permission
from app.models import Organization, User

router = APIRouter(prefix="/network", tags=["network"])


class PartyOut(BaseModel):
    id: str
    name: str
    kind: str
    kind_label: str
    status: str
    city: str | None = None
    address: str | None = None
    phone: str | None = None
    union_license: str | None = None
    national_id: str | None = None
    summary: str | None = None
    profile: dict[str, Any] = Field(default_factory=dict)
    member_count: int = 0
    capabilities: list[str] = Field(default_factory=list)
    what_they_do: str = ""
    assignee_required: bool = False
    # cash_only | phone_ok | open_account — from profile.trust_tier
    trust_tier: str = "phone_ok"
    trust_tier_label: str = ""
    # Entity Profile mindset (computed — not a separate SoR)
    readiness: str = "registered"
    readiness_label: str = ""
    missing_mandatory: list[str] = Field(default_factory=list)
    missing_activation: list[str] = Field(default_factory=list)
    profile_checklist: dict[str, list[dict[str, Any]]] = Field(default_factory=dict)


class PartyIn(BaseModel):
    name: str
    kind: str
    city: str | None = None
    address: str | None = None
    phone: str | None = None
    union_license: str | None = None
    national_id: str | None = None
    summary: str | None = None
    profile: dict[str, Any] | None = None
    trust_tier: str | None = None


class PartyPatch(BaseModel):
    name: str | None = None
    kind: str | None = None
    city: str | None = None
    address: str | None = None
    phone: str | None = None
    union_license: str | None = None
    national_id: str | None = None
    summary: str | None = None
    profile: dict[str, Any] | None = None
    trust_tier: str | None = None


class MemberOut(BaseModel):
    id: str
    user_id: str
    user_name: str
    user_username: str
    title: str
    status: str


class AssignMemberIn(BaseModel):
    user_id: str
    title: str = "عضو"


class RoleOut(BaseModel):
    id: str
    code: str
    label_fa: str
    description: str
    permissions: list[str]
    is_system: bool
    status: str


class RoleIn(BaseModel):
    code: str
    label_fa: str
    description: str = ""
    permissions: list[str] = Field(default_factory=list)


class GrantRoleIn(BaseModel):
    user_id: str
    role_code: str


class PersonOut(BaseModel):
    id: str
    name: str
    username: str
    email: str
    primary_role: str
    roles: list[str]
    primary_org_id: str
    primary_org_name: str
    status: str


def _party_out(db, o) -> PartyOut:
    from app.domains.finance.trust import TRUST_TIERS, trust_tier_from_profile
    from app.domains.network.entity_profile import evaluate_party

    meta = type_meta(o.kind) or {}
    prof = dict(o.profile or {})
    caps = prof.get("capabilities") or meta.get("capabilities") or []
    tier = trust_tier_from_profile(prof)
    members = network_domain.party_member_count(db, o.id)
    ev = evaluate_party(o, member_count=members)
    return PartyOut(
        id=o.id,
        name=o.name,
        kind=canonical_kind(o.kind),
        kind_label=meta.get("label_fa") or o.kind,
        status=getattr(o, "status", None) or "active",
        city=getattr(o, "city", None),
        address=getattr(o, "address", None),
        phone=getattr(o, "phone", None),
        union_license=getattr(o, "union_license", None),
        national_id=getattr(o, "national_id", None),
        summary=getattr(o, "summary", None) or meta.get("what_they_do"),
        profile=prof,
        member_count=members,
        capabilities=list(caps),
        what_they_do=meta.get("what_they_do") or "",
        assignee_required=bool(meta.get("assignee_required")),
        trust_tier=tier,
        trust_tier_label=TRUST_TIERS.get(tier, tier),
        readiness=ev["readiness"],
        readiness_label=ev["readiness_label"],
        missing_mandatory=list(ev["missing_mandatory"]),
        missing_activation=list(ev["missing_activation"]),
        profile_checklist=ev["checklist"],
    )


@router.get("/entity-profile-spec")
def entity_profile_spec(_user: User = Depends(require_permission("network.view"))):
    """Actor & Entity Profile mindset — stages + Iran kind mapping."""
    from app.domains.network.entity_profile import list_entity_profile_spec

    return list_entity_profile_spec()


@router.get("/party-types")
def party_types(_user: User = Depends(require_permission("network.view"))):
    return network_domain.list_party_types()


@router.get("/parties", response_model=list[PartyOut])
def parties(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("network.view")),
    kind: str | None = Query(None),
    include_archived: bool = Query(False),
):
    rows = network_domain.list_parties(
        db, kind=kind, include_archived=include_archived, status=None if include_archived else "active"
    )
    return [_party_out(db, o) for o in rows]


@router.get("/parties/{party_id}", response_model=PartyOut)
def party_detail(
    party_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("network.view")),
):
    return _party_out(db, network_domain.get_party(db, party_id))


@router.post("/parties", response_model=PartyOut)
def create_party(
    body: PartyIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("network.manage")),
):
    from app.domains.finance.trust import normalize_trust_tier

    prof = dict(body.profile or {})
    if body.trust_tier:
        prof["trust_tier"] = normalize_trust_tier(body.trust_tier)
    row = network_domain.create_party(
        db,
        name=body.name,
        kind=body.kind,
        actor=user.name,
        city=body.city,
        address=body.address,
        phone=body.phone,
        union_license=body.union_license,
        national_id=body.national_id,
        summary=body.summary,
        profile=prof,
    )
    return _party_out(db, row)


@router.patch("/parties/{party_id}", response_model=PartyOut)
def patch_party(
    party_id: str,
    body: PartyPatch,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("network.manage")),
):
    from app.domains.finance.trust import normalize_trust_tier

    data = body.model_dump(exclude_unset=True)
    tier = data.pop("trust_tier", None)
    if tier is not None:
        prof = dict(data.get("profile") or {})
        prof["trust_tier"] = normalize_trust_tier(tier)
        data["profile"] = prof
    row = network_domain.update_party(db, party_id=party_id, actor=user.name, **data)
    return _party_out(db, row)


@router.post("/parties/{party_id}/archive", response_model=PartyOut)
def archive_party(
    party_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("network.manage")),
):
    return _party_out(db, network_domain.archive_party(db, party_id=party_id, actor=user.name))


@router.post("/parties/{party_id}/restore", response_model=PartyOut)
def restore_party(
    party_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("network.manage")),
):
    return _party_out(db, network_domain.restore_party(db, party_id=party_id, actor=user.name))


@router.get("/parties/{party_id}/members", response_model=list[MemberOut])
def members(
    party_id: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("network.view")),
):
    network_domain.get_party(db, party_id)
    out = []
    for m in network_domain.list_memberships(db, org_id=party_id):
        u = db.get(User, m.user_id)
        out.append(
            MemberOut(
                id=m.id,
                user_id=m.user_id,
                user_name=u.name if u else "—",
                user_username=u.username if u else "—",
                title=m.title,
                status=m.status,
            )
        )
    return out


@router.post("/parties/{party_id}/members", response_model=MemberOut)
def assign_member(
    party_id: str,
    body: AssignMemberIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("network.manage")),
):
    m = network_domain.assign_member(
        db, org_id=party_id, user_id=body.user_id, title=body.title, actor=user.name
    )
    u = db.get(User, m.user_id)
    return MemberOut(
        id=m.id,
        user_id=m.user_id,
        user_name=u.name if u else "—",
        user_username=u.username if u else "—",
        title=m.title,
        status=m.status,
    )


@router.post("/memberships/{membership_id}/unassign", response_model=MemberOut)
def unassign_member(
    membership_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("network.manage")),
):
    m = network_domain.unassign_member(db, membership_id=membership_id, actor=user.name)
    u = db.get(User, m.user_id)
    return MemberOut(
        id=m.id,
        user_id=m.user_id,
        user_name=u.name if u else "—",
        user_username=u.username if u else "—",
        title=m.title,
        status=m.status,
    )


class WorkspaceContextOut(BaseModel):
    party_id: str
    party_name: str
    kind: str
    kind_label: str
    title: str
    source: str  # membership | primary_org | admin_browse


@router.get("/me/contexts", response_model=list[WorkspaceContextOut])
def my_workspace_contexts(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Active store/party hats for the signed-in user (multi-context session)."""
    out: list[WorkspaceContextOut] = []
    seen: set[str] = set()

    for m in network_domain.list_memberships_for_user(db, user_id=user.id):
        party = network_domain.get_party(db, m.org_id)
        meta = type_meta(party.kind) or {}
        seen.add(party.id)
        out.append(
            WorkspaceContextOut(
                party_id=party.id,
                party_name=party.name,
                kind=canonical_kind(party.kind),
                kind_label=meta.get("label_fa") or party.kind,
                title=m.title or "عضو",
                source="membership",
            )
        )

    # Primary org on the user record (even with zero memberships)
    if user.org_id and user.org_id not in seen:
        party = db.get(Organization, user.org_id)
        if party:
            meta = type_meta(party.kind) or {}
            out.append(
                WorkspaceContextOut(
                    party_id=party.id,
                    party_name=party.name,
                    kind=canonical_kind(party.kind),
                    kind_label=meta.get("label_fa") or party.kind,
                    title="سازمان اصلی",
                    source="primary_org",
                )
            )

    # Admins with no memberships can browse active parties as a hat
    if user.role == "admin" and not out:
        for party in network_domain.list_parties(db, status="active")[:12]:
            meta = type_meta(party.kind) or {}
            out.append(
                WorkspaceContextOut(
                    party_id=party.id,
                    party_name=party.name,
                    kind=canonical_kind(party.kind),
                    kind_label=meta.get("label_fa") or party.kind,
                    title="بازدید مدیر",
                    source="admin_browse",
                )
            )

    return out


@router.get("/roles", response_model=list[RoleOut])
def roles(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("network.view")),
):
    return [
        RoleOut(
            id=r.id,
            code=r.code,
            label_fa=r.label_fa,
            description=r.description,
            permissions=list(r.permissions or []),
            is_system=r.is_system,
            status=r.status,
        )
        for r in network_domain.list_roles(db)
    ]


@router.post("/roles", response_model=RoleOut)
def create_role(
    body: RoleIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("network.manage")),
):
    r = network_domain.create_custom_role(
        db,
        code=body.code,
        label_fa=body.label_fa,
        description=body.description,
        permissions=body.permissions,
        actor=user.name,
    )
    return RoleOut(
        id=r.id,
        code=r.code,
        label_fa=r.label_fa,
        description=r.description,
        permissions=list(r.permissions or []),
        is_system=r.is_system,
        status=r.status,
    )


@router.post("/roles/{role_id}/archive", response_model=RoleOut)
def archive_role(
    role_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("network.manage")),
):
    r = network_domain.archive_role(db, role_id=role_id, actor=user.name)
    return RoleOut(
        id=r.id,
        code=r.code,
        label_fa=r.label_fa,
        description=r.description,
        permissions=list(r.permissions or []),
        is_system=r.is_system,
        status=r.status,
    )


@router.post("/role-grants", response_model=dict)
def grant_role(
    body: GrantRoleIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("network.manage")),
):
    g = network_domain.grant_role(
        db, user_id=body.user_id, role_code=body.role_code, actor=user.name
    )
    return {
        "id": g.id,
        "user_id": g.user_id,
        "role_code": g.role_code,
        "status": g.status,
        "roles": network_domain.list_user_roles(db, user_id=g.user_id),
    }


@router.post("/role-grants/{grant_id}/revoke", response_model=dict)
def revoke_role(
    grant_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("network.manage")),
):
    g = network_domain.revoke_role(db, grant_id=grant_id, actor=user.name)
    return {
        "id": g.id,
        "user_id": g.user_id,
        "role_code": g.role_code,
        "status": g.status,
        "roles": network_domain.list_user_roles(db, user_id=g.user_id),
    }


@router.get("/people", response_model=list[PersonOut])
def people(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("network.view")),
):
    out = []
    for u in network_domain.list_people(db):
        org = u.organization
        out.append(
            PersonOut(
                id=u.id,
                name=u.name,
                username=u.username,
                email=u.email,
                primary_role=u.role,
                roles=network_domain.list_user_roles(db, user_id=u.id),
                primary_org_id=u.org_id,
                primary_org_name=org.name if org else "—",
                status=u.status,
            )
        )
    return out
