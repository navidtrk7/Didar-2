"""Commerce HTTP routes."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.domains import commerce as commerce_domain
from app.domains.permissions import require_permission
from app.models import Asset, User
from app.schemas import (
    AssetOut,
    IssueProformaIn,
    PriceLockIn,
    PriceLockOut,
    ProformaLineOut,
    ProformaOut,
)
from app.services.slice_b import get_settings_row

router = APIRouter(prefix="/commerce", tags=["commerce"])


def _gallery_asset_out(a: Asset) -> AssetOut:
    return AssetOut(
        id=a.id,
        sku_id=a.sku_id,
        uid=a.uid,
        name=a.name,
        category=a.category,
        karat=a.karat,
        weight_grams=a.weight_grams,
        craft_fee_pct=a.craft_fee_pct,
        status=a.status,
        location=a.location,
        image_url=(a.image_url or "").strip() or "/products/product-01.jpg",
        sealed=a.sealed,
        issued_at=a.issued_label,
        collection=a.collection,
        producer=a.producer,
        description=a.description,
        custodian=a.custodian,
    )


@router.get("/gallery", response_model=list[AssetOut])
def gallery_assets(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("commerce.view")),
):
    """Sellable / agent-custody inventory for Commerce gallery view."""
    rows = (
        db.query(Asset)
        .filter(
            Asset.sealed.is_(True),
            Asset.status.in_(("available", "reserved", "in_transit")),
        )
        .order_by(Asset.created_at.desc())
        .limit(200)
        .all()
    )
    # Prefer mobile gallery / agent custody; fall back to all sealed sellable
    preferred = [
        a
        for a in rows
        if "گالری سیار" in (a.location or "")
        or "ایجنت" in (a.custodian or "")
        or a.custodian in ("نوید رستمی", "فروش میدانی دیدار گلد")
    ]
    pool = preferred or [a for a in rows if a.status == "available"]
    return [_gallery_asset_out(a) for a in pool]


class OrderOut(BaseModel):
    id: str
    code: str
    retailer: str
    items: int
    total_weight: float
    value: int
    status: str
    created_at: str
    eta: str


class CreateOrderIn(BaseModel):
    retailer: str
    items: int = Field(ge=1)
    total_weight: float = Field(gt=0)
    value: int = Field(ge=0)
    uids: list[str] = Field(default_factory=list)


class RateOut(BaseModel):
    id: str
    current_rate: int
    proposed_rate: int
    reason: str
    status: str
    requested_by: str
    created_at: str
    valid_until: str


class RateIn(BaseModel):
    current_rate: int
    proposed_rate: int
    reason: str
    valid_until: str = "۲۴ ساعت"


class DecideIn(BaseModel):
    status: str


class CraftOut(BaseModel):
    id: str
    name: str
    category: str
    method: str
    value: float
    active: bool
    collection: Optional[str] = None


class CraftIn(BaseModel):
    name: str
    category: str
    method: str
    value: float
    collection: Optional[str] = None


def _proforma_out(p) -> ProformaOut:
    return ProformaOut(
        id=p.id,
        code=p.code,
        retailer=p.retailer_name,
        agent=p.agent_name,
        lines=[
            ProformaLineOut(
                uid=l.uid,
                name=l.name,
                weight_grams=l.weight_grams,
                craft_fee_pct=l.craft_fee_pct,
            )
            for l in p.lines
        ],
        rate_per_gram=p.rate_per_gram,
        lock_expires_at=p.lock_expires_at,
        status=p.status,
        created_at=p.created_label,
        total_irr=p.total_irr,
    )


def _order_out(o) -> OrderOut:
    return OrderOut(
        id=o.id,
        code=o.code,
        retailer=o.retailer,
        items=o.items,
        total_weight=o.total_weight,
        value=o.value,
        status=o.status,
        created_at=o.created_label,
        eta=o.eta_label,
    )


@router.get("/proformas", response_model=list[ProformaOut])
def get_proformas(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("commerce.view")),
):
    return [_proforma_out(p) for p in commerce_domain.list_proformas(db)]


@router.post("/proformas", response_model=ProformaOut)
def post_proforma(
    body: IssueProformaIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("commerce.proforma")),
):
    pf = commerce_domain.issue_proforma(
        db,
        retailer_name=body.retailer,
        agent_name=body.agent or user.name,
        lock_id=body.lock_id,
        lines=[
            {"uid": l.uid, "craft_fee_pct": l.craft_fee_pct}
            for l in body.lines
        ],
    )
    return _proforma_out(pf)


@router.post("/locks", response_model=PriceLockOut)
def post_lock(
    body: PriceLockIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("commerce.proforma")),
):
    from app.config import get_settings
    from app.models import SystemSettingsRow

    settings = get_settings()
    row = db.get(SystemSettingsRow, 1)
    price = (
        row.live_rate_override
        if row and row.live_rate_override
        else settings.live_gold_price_per_gram
    )
    lock = commerce_domain.create_price_lock(
        db,
        retailer_name=body.retailer,
        agent_name=body.agent or user.name,
        rate_per_gram=body.rate_per_gram or price,
    )
    settings_row = get_settings_row(db)
    return PriceLockOut(
        id=lock.id,
        rate_per_gram=lock.rate_per_gram,
        retailer=lock.retailer_name,
        agent=lock.agent_name,
        expires_at=lock.expires_at,
        minutes=settings_row.price_lock_minutes,
    )


@router.get("/orders", response_model=list[OrderOut])
def get_orders(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("commerce.view")),
):
    return [_order_out(o) for o in commerce_domain.list_orders(db)]


@router.post("/orders", response_model=OrderOut)
def post_order(
    body: CreateOrderIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("commerce.order")),
):
    from app.domains.permissions import effective_roles

    # Retailer self-service always binds to their org SoR name (credit + scope).
    retailer = body.retailer.strip() if body.retailer else ""
    roles = effective_roles(user)
    if "retailer" in roles and user.organization:
        retailer = user.organization.name
    elif not retailer and user.organization:
        retailer = user.organization.name
    row = commerce_domain.place_order(
        db,
        retailer=retailer,
        items=body.items,
        total_weight=body.total_weight,
        value=body.value,
        uids=body.uids,
    )
    return _order_out(row)


@router.get("/rate-requests", response_model=list[RateOut])
def get_rates(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("commerce.view")),
):
    return [
        RateOut(
            id=r.id,
            current_rate=r.current_rate,
            proposed_rate=r.proposed_rate,
            reason=r.reason,
            status=r.status,
            requested_by=r.requested_by,
            created_at=r.created_label,
            valid_until=r.valid_until_label,
        )
        for r in commerce_domain.list_rate_requests(db)
    ]


@router.post("/rate-requests", response_model=RateOut)
def post_rate(
    body: RateIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("commerce.pricing")),
):
    r = commerce_domain.add_rate_request(
        db,
        current_rate=body.current_rate,
        proposed_rate=body.proposed_rate,
        reason=body.reason,
        requested_by=user.name,
        valid_until_label=body.valid_until,
    )
    return RateOut(
        id=r.id,
        current_rate=r.current_rate,
        proposed_rate=r.proposed_rate,
        reason=r.reason,
        status=r.status,
        requested_by=r.requested_by,
        created_at=r.created_label,
        valid_until=r.valid_until_label,
    )


@router.post("/rate-requests/{request_id}/decide", response_model=RateOut)
def decide_rate(
    request_id: str,
    body: DecideIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("commerce.pricing")),
):
    r = commerce_domain.decide_rate_request(
        db, request_id=request_id, status=body.status, actor=user.name
    )
    return RateOut(
        id=r.id,
        current_rate=r.current_rate,
        proposed_rate=r.proposed_rate,
        reason=r.reason,
        status=r.status,
        requested_by=r.requested_by,
        created_at=r.created_label,
        valid_until=r.valid_until_label,
    )


@router.get("/craft-rules", response_model=list[CraftOut])
def get_craft(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("commerce.view")),
):
    return [
        CraftOut(
            id=c.id,
            name=c.name,
            category=c.category,
            method=c.method,
            value=c.value,
            active=c.active,
            collection=c.collection,
        )
        for c in commerce_domain.list_craft_rules(db)
    ]


class PromoOut(BaseModel):
    id: str
    name: str
    collection: Optional[str] = None
    discount_pct: float
    active: bool
    status: str
    created_at: str


class PromoIn(BaseModel):
    name: str
    discount_pct: float = 0
    collection: Optional[str] = None
    active: bool = True


@router.get("/promotions", response_model=list[PromoOut])
def get_promos(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("commerce.view")),
):
    return [
        PromoOut(
            id=p.id,
            name=p.name,
            collection=p.collection,
            discount_pct=p.discount_pct,
            active=p.active,
            status=p.status,
            created_at=p.created_label,
        )
        for p in commerce_domain.list_promotions(db)
    ]


@router.post("/promotions", response_model=PromoOut)
def post_promo(
    body: PromoIn,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("commerce.promotion")),
):
    p = commerce_domain.create_promotion(
        db,
        name=body.name,
        discount_pct=body.discount_pct,
        collection=body.collection,
        active=body.active,
    )
    return PromoOut(
        id=p.id,
        name=p.name,
        collection=p.collection,
        discount_pct=p.discount_pct,
        active=p.active,
        status=p.status,
        created_at=p.created_label,
    )
