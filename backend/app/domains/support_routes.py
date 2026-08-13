"""Governance / Relationship / Intelligence domain surfaces."""

from __future__ import annotations

import time

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db import get_db
from app.deps import get_current_user
from app.domains.permissions import (
    effective_roles,
    permissions_for_user,
    require_permission,
)
from app.models import (
    AuditEvent,
    Campaign,
    CrmContact,
    DomainEvent,
    Organization,
    User,
)
from app.services.events import append_event, now_label

governance_router = APIRouter(prefix="/governance", tags=["governance"])
relationship_router = APIRouter(prefix="/relationship", tags=["relationship"])
intelligence_router = APIRouter(prefix="/intelligence", tags=["intelligence"])


@governance_router.get("/permissions/me")
def my_permissions(user: User = Depends(require_permission("governance.view"))):
    return {
        "role": user.role,
        "roles": sorted(effective_roles(user)),
        "permissions": permissions_for_user(user),
    }


class ProfileUpdateIn(BaseModel):
    name: str | None = None
    national_id: str | None = None
    father_name: str | None = None
    birth_date: str | None = None
    gender: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    postal_code: str | None = None
    union_license: str | None = None
    title: str | None = None
    verification_status: str | None = None
    profile_data: dict | None = None


@governance_router.get("/profile/me")
def get_my_profile(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    org = db.get(Organization, user.org_id) if user.org_id else None
    prof = dict(user.organization.profile or {}) if user.organization else {}
    user_prof = dict(getattr(user, "profile_data", None) or prof)
    
    # User's stakeholder memberships
    memberships = [
        {
            "id": m.id,
            "org_id": m.org_id,
            "org_name": m.organization.name if m.organization else "مجموعه",
            "kind": m.organization.kind if m.organization else "internal",
            "title": m.title,
            "status": m.status,
        }
        for m in (user.memberships or [])
    ]

    return {
        "id": user.id,
        "name": user.name,
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "org_id": user.org_id,
        "org_name": org.name if org else user.org,
        "status": user.status,
        "last_active": user.last_active_label or "امروز",
        "national_id": user_prof.get("national_id") or (org.national_id if org else ""),
        "father_name": user_prof.get("father_name", "محمد"),
        "birth_date": user_prof.get("birth_date", "۱۳۶۸/۰۵/۱۲"),
        "gender": user_prof.get("gender", "مرد"),
        "phone": user_prof.get("phone") or (org.phone if org else ""),
        "address": user_prof.get("address") or (org.address if org else ""),
        "postal_code": user_prof.get("postal_code", "۱۹۳۹۵-۴۱۱"),
        "union_license": user_prof.get("union_license") or (org.union_license if org else ""),
        "verification_status": user_prof.get("verification_status", "verified"),
        "memberships": memberships,
        "profile_data": user_prof,
    }


@governance_router.put("/profile/me")
def update_my_profile(
    body: ProfileUpdateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if body.name:
        user.name = body.name.strip()
    if body.email:
        user.email = body.email.strip()

    current_prof = dict(getattr(user, "profile_data", None) or {})
    if body.national_id is not None: current_prof["national_id"] = body.national_id
    if body.father_name is not None: current_prof["father_name"] = body.father_name
    if body.birth_date is not None: current_prof["birth_date"] = body.birth_date
    if body.gender is not None: current_prof["gender"] = body.gender
    if body.phone is not None: current_prof["phone"] = body.phone
    if body.address is not None: current_prof["address"] = body.address
    if body.postal_code is not None: current_prof["postal_code"] = body.postal_code
    if body.union_license is not None: current_prof["union_license"] = body.union_license
    if body.verification_status is not None: current_prof["verification_status"] = body.verification_status
    if body.profile_data: current_prof.update(body.profile_data)

    db.commit()
    db.refresh(user)
    return {"status": "ok", "message": "پروفایل با موفقیت بروزرسانی شد"}


@governance_router.get("/audit")
def audit_tail(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("governance.audit")),
    limit: int = 50,
):
    rows = (
        db.query(AuditEvent)
        .order_by(AuditEvent.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "module": r.module,
            "actor": r.actor,
            "action": r.action,
            "entity": r.entity,
            "timestamp": r.timestamp_label,
        }
        for r in rows
    ]


class ContactOut(BaseModel):
    id: str
    name: str
    phone: str
    email: str
    party_org_id: str | None = None
    party_name: str | None = None
    role_label: str
    notes: str
    created_at: str


class ContactIn(BaseModel):
    name: str
    phone: str = ""
    email: str = ""
    party_org_id: str | None = None
    role_label: str = "contact"
    notes: str = ""


class CampaignOut(BaseModel):
    id: str
    name: str
    channel: str
    status: str
    trigger_event: str | None = None
    fired_count: int = 0
    last_fired_at: str | None = None
    created_at: str


class CampaignIn(BaseModel):
    name: str
    channel: str = "sms"
    status: str = "draft"
    trigger_event: str | None = None


def _contact_out(c: CrmContact, party_name: str | None = None) -> ContactOut:
    return ContactOut(
        id=c.id,
        name=c.name,
        phone=c.phone,
        email=c.email,
        party_org_id=c.party_org_id,
        party_name=party_name,
        role_label=c.role_label,
        notes=c.notes,
        created_at=c.created_label,
    )


@relationship_router.get("/status")
def relationship_status(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("relationship.view")),
):
    return {
        "status": "partial",
        "contacts": db.query(CrmContact).count(),
        "campaigns": db.query(Campaign).count(),
        "message": "CRM contacts + campaigns; active campaigns fire on DomainEvents",
        "backlog": [
            "multi-step journey automation / send providers",
            "campaign send pipeline",
        ],
    }


@relationship_router.get("/contacts", response_model=list[ContactOut])
def list_contacts(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("relationship.view")),
):
    rows = db.query(CrmContact).order_by(CrmContact.created_at.desc()).all()
    org_ids = {c.party_org_id for c in rows if c.party_org_id}
    names: dict[str, str] = {}
    if org_ids:
        names = {
            o.id: o.name
            for o in db.query(Organization).filter(Organization.id.in_(org_ids)).all()
        }
    return [_contact_out(c, names.get(c.party_org_id or "")) for c in rows]


@relationship_router.post("/contacts", response_model=ContactOut)
def create_contact(
    body: ContactIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("relationship.manage")),
):
    if not body.name.strip():
        raise HTTPException(400, "نام مخاطب الزامی است")
    party_name = None
    if body.party_org_id:
        org = db.get(Organization, body.party_org_id)
        if not org:
            raise HTTPException(404, "طرف شبکه یافت نشد")
        party_name = org.name
    row = CrmContact(
        id=f"crm-{int(time.time() * 1000)}",
        name=body.name.strip(),
        phone=body.phone.strip(),
        email=body.email.strip(),
        party_org_id=body.party_org_id,
        role_label=body.role_label.strip() or "contact",
        notes=body.notes.strip(),
        created_label=now_label(),
    )
    db.add(row)
    append_event(
        db,
        event_type="relationship.contact_created",
        aggregate_type="crm_contact",
        aggregate_id=row.id,
        actor_name=user.name,
        actor_role=user.role,
        payload={"name": row.name, "party_org_id": row.party_org_id},
    )
    db.commit()
    db.refresh(row)
    return _contact_out(row, party_name)


@relationship_router.get("/campaigns", response_model=list[CampaignOut])
def list_campaigns(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("relationship.view")),
):
    rows = db.query(Campaign).order_by(Campaign.created_at.desc()).all()
    return [
        CampaignOut(
            id=c.id,
            name=c.name,
            channel=c.channel,
            status=c.status,
            trigger_event=c.trigger_event,
            fired_count=int(getattr(c, "fired_count", 0) or 0),
            last_fired_at=getattr(c, "last_fired_label", None),
            created_at=c.created_label,
        )
        for c in rows
    ]


@relationship_router.post("/campaigns", response_model=CampaignOut)
def create_campaign(
    body: CampaignIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("relationship.manage")),
):
    if not body.name.strip():
        raise HTTPException(400, "نام کمپین الزامی است")
    row = Campaign(
        id=f"camp-{int(time.time() * 1000)}",
        name=body.name.strip(),
        channel=body.channel.strip() or "sms",
        status=body.status.strip() or "draft",
        trigger_event=body.trigger_event,
        created_label=now_label(),
    )
    db.add(row)
    append_event(
        db,
        event_type="relationship.campaign_created",
        aggregate_type="campaign",
        aggregate_id=row.id,
        actor_name=user.name,
        actor_role=user.role,
        payload={"name": row.name, "channel": row.channel},
    )
    db.commit()
    db.refresh(row)
    return CampaignOut(
        id=row.id,
        name=row.name,
        channel=row.channel,
        status=row.status,
        trigger_event=row.trigger_event,
        fired_count=int(row.fired_count or 0),
        last_fired_at=row.last_fired_label,
        created_at=row.created_label,
    )


@relationship_router.post("/campaigns/{campaign_id}/activate", response_model=CampaignOut)
def activate_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("relationship.manage")),
):
    row = db.get(Campaign, campaign_id)
    if not row:
        raise HTTPException(404, "کمپین یافت نشد")
    row.status = "active"
    append_event(
        db,
        event_type="relationship.campaign_activated",
        aggregate_type="campaign",
        aggregate_id=row.id,
        actor_name=user.name,
        actor_role=user.role,
        payload={"name": row.name, "trigger_event": row.trigger_event},
    )
    db.commit()
    db.refresh(row)
    return CampaignOut(
        id=row.id,
        name=row.name,
        channel=row.channel,
        status=row.status,
        trigger_event=row.trigger_event,
        fired_count=int(row.fired_count or 0),
        last_fired_at=row.last_fired_label,
        created_at=row.created_label,
    )


@relationship_router.post("/campaigns/{campaign_id}/pause", response_model=CampaignOut)
def pause_campaign(
    campaign_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("relationship.manage")),
):
    row = db.get(Campaign, campaign_id)
    if not row:
        raise HTTPException(404, "کمپین یافت نشد")
    row.status = "draft"
    append_event(
        db,
        event_type="relationship.campaign_paused",
        aggregate_type="campaign",
        aggregate_id=row.id,
        actor_name=user.name,
        actor_role=user.role,
        payload={"name": row.name},
    )
    db.commit()
    db.refresh(row)
    return CampaignOut(
        id=row.id,
        name=row.name,
        channel=row.channel,
        status=row.status,
        trigger_event=row.trigger_event,
        fired_count=int(row.fired_count or 0),
        last_fired_at=row.last_fired_label,
        created_at=row.created_label,
    )


def _analytics(db: Session, top_n: int = 12) -> dict:
    from app.models import Allocation, Delivery, Order, Sku

    total = db.query(DomainEvent).count()
    by_type_rows = (
        db.query(DomainEvent.event_type, func.count(DomainEvent.id))
        .group_by(DomainEvent.event_type)
        .order_by(func.count(DomainEvent.id).desc())
        .limit(top_n)
        .all()
    )
    by_agg_rows = (
        db.query(DomainEvent.aggregate_type, func.count(DomainEvent.id))
        .group_by(DomainEvent.aggregate_type)
        .order_by(func.count(DomainEvent.id).desc())
        .limit(top_n)
        .all()
    )
    recent = (
        db.query(DomainEvent)
        .order_by(DomainEvent.created_at.desc())
        .limit(20)
        .all()
    )

    type_counts = {t: c for t, c in by_type_rows}
    live_orders = db.query(Order).count()
    live_picking = db.query(Delivery).filter(Delivery.status == "picking").count()
    live_awaiting = db.query(Delivery).filter(
        Delivery.status.in_(("awaiting_otp", "handover", "en_route"))
    ).count()
    live_alloc = db.query(Allocation).filter(Allocation.status == "active").count()
    approved_skus = db.query(Sku).filter(Sku.status == "approved").count()
    draft_skus = db.query(Sku).filter(Sku.status == "draft").count()

    signals = {
        "orders": max(type_counts.get("order.submitted", 0), live_orders),
        "deliveries_completed": type_counts.get("delivery.completed", 0),
        "skus_created": type_counts.get("sku.created", 0),
        "allocations": max(type_counts.get("inventory.allocated", 0), live_alloc),
        "contacts": type_counts.get("relationship.contact_created", 0),
        "warranty_claims": type_counts.get("service.claim_opened", 0)
        + type_counts.get("warranty.claim_opened", 0),
        "campaigns_fired": type_counts.get("campaign.triggered", 0),
        "fulfillment_picking": live_picking,
        "awaiting_otp": live_awaiting,
        "approved_skus": approved_skus,
        "draft_skus": draft_skus,
    }

    recommendations: list[str] = []
    if signals["orders"] > signals["deliveries_completed"] * 2 + 2:
        recommendations.append(
            "سفارش‌های ثبت‌شده از تحویل‌های تکمیل‌شده جلوتر است — صف Fulfillment را بررسی کنید."
        )
    if live_awaiting:
        recommendations.append(
            f"{live_awaiting} محموله در انتظار OTP/تحویل است — دامنه تحقق سفارش."
        )
    if live_picking:
        recommendations.append(
            f"{live_picking} محموله در مرحله Pick است — انبار را پیش ببرید."
        )
    if approved_skus and live_alloc == 0 and signals["skus_created"]:
        recommendations.append(
            "SKU تأییدشده بدون تخصیص فعال — گالری/سفارش را تغذیه کنید."
        )
    if signals["skus_created"] and signals["skus_created"] > signals["allocations"]:
        recommendations.append(
            "SKUهای جدید بیشتر از تخصیص هستند — مسیر UID → موجودی → گالری را چک کنید."
        )
    if signals["contacts"] == 0:
        recommendations.append(
            "هنوز مخاطب CRM ثبت نشده — از دامنه ارتباطات شروع کنید."
        )
    if signals["campaigns_fired"] == 0 and type_counts.get("relationship.campaign_activated", 0):
        recommendations.append(
            "کمپین فعال است ولی هنوز تریگر نخورده — رویداد تریگر را در زنجیره تولید کنید."
        )
    if not recommendations:
        recommendations.append(
            "جریان رویدادها متعادل به نظر می‌رسد — برای پیش‌بینی تقاضا داده بیشتری جمع شود."
        )

    return {
        "total_events": total,
        "by_type": [{"event_type": t, "count": c} for t, c in by_type_rows],
        "by_aggregate": [{"aggregate_type": a, "count": c} for a, c in by_agg_rows],
        "signals": signals,
        "recommendations": recommendations,
        "recent": [
            {
                "id": e.id,
                "event_type": e.event_type,
                "aggregate_type": e.aggregate_type,
                "aggregate_id": e.aggregate_id,
                "actor": e.actor_name,
                "role": e.actor_role,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in recent
        ],
    }


@intelligence_router.get("/status")
def intelligence_status(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("intelligence.view")),
):
    events = db.query(DomainEvent).count()
    return {
        "status": "partial",
        "domain_events": events,
        "message": "Event analytics live; forecast/recs next",
        "backlog": [
            "recommendation over gallery/SKU affinity",
            "demand forecast from orders + allocations",
        ],
    }


@intelligence_router.get("/analytics")
def intelligence_analytics(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("intelligence.view")),
    top_n: int = Query(12, ge=1, le=50),
):
    return _analytics(db, top_n=top_n)
