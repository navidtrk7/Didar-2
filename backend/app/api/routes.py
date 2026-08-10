from __future__ import annotations

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session, joinedload

from app.config import get_settings
from app.db import get_db
from app.deps import create_access_token, get_current_user, require_roles, verify_password
from app.models import (
    Adjustment,
    Asset,
    AuditEvent,
    CraftFeeRule,
    CreditAccount,
    CreditDocument,
    Delivery,
    DomainEvent,
    DualLedgerEntry,
    InventoryLocation,
    Order,
    Proforma,
    QcInspection,
    RateRequest,
    Sku,
    SystemSettingsRow,
    User,
    UserRoleGrant,
)
from app.schemas import (
    AssetOut,
    AuditOut,
    CompleteQcIn,
    CreditAccountOut,
    DomainEventOut,
    DualLedgerOut,
    HealthOut,
    InventoryOut,
    IssueProformaIn,
    LiveGoldOut,
    LoginIn,
    LoginOut,
    PlatformSnapshot,
    PriceLockIn,
    PriceLockOut,
    ProformaLineOut,
    ProformaOut,
    QcOut,
    SkuOut,
    SystemSettingsOut,
    UserOut,
    UserRoleGrantOut,
)
from app.services import ops, slice_b

router = APIRouter()


class TokenLoginOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class CreateSkuIn(BaseModel):
    name: str
    category: str
    sku_code: str
    karat: int = 18
    catalog_weight: float = Field(gt=0)
    collection: str = ""
    image_url: str = "/products/product-01.jpg"
    status: str = "draft"


class RateRequestIn(BaseModel):
    current_rate: int
    proposed_rate: int
    reason: str
    requested_by: str
    valid_until: str = "۲۴ ساعت"


class RateDecideIn(BaseModel):
    status: str


class CraftRuleIn(BaseModel):
    name: str
    category: str
    method: str
    value: float
    active: bool = True
    collection: Optional[str] = None


class SettingsPatchIn(BaseModel):
    weight_tolerance_grams: Optional[float] = None
    price_lock_minutes: Optional[int] = None
    proforma_ttl_minutes: Optional[int] = None
    default_karat: Optional[int] = None
    rate_source: Optional[str] = None
    currency: Optional[str] = None


class AdjustmentIn(BaseModel):
    reason: str
    weight_delta: float
    irr_delta: int


class DeliveryOtpIn(BaseModel):
    otp: str


class OrderIn(BaseModel):
    retailer: str
    items: int = 1
    total_weight: float
    value: int
    uids: list[str] = []


class RateOut(BaseModel):
    id: str
    current_rate: int
    proposed_rate: int
    reason: str
    status: str
    requested_by: str
    created_at: str
    valid_until: str


class CraftOut(BaseModel):
    id: str
    name: str
    category: str
    method: str
    value: float
    active: bool
    collection: Optional[str] = None


class CreditDocOut(BaseModel):
    id: str
    code: str
    retailer: str
    amount_irr: int
    weight_grams: float
    due_date: str
    overdue_days: int
    status: str
    settlement_channel: str | None = None
    settlement_notes: str = ""
    settled_at: str | None = None
    origin_channel: str | None = None


class AdjustmentOut(BaseModel):
    id: str
    code: str
    reason: str
    weight_delta: float
    irr_delta: int
    created_by: str
    created_at: str


class DeliveryOut(BaseModel):
    id: str
    code: str
    agent: str
    from_location: str
    to_location: str
    pieces: int
    weight_grams: float
    status: str
    otp_required: bool
    scheduled_at: str


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


class VerifyOut(BaseModel):
    found: bool
    asset: Optional[AssetOut] = None


def _user_out(
    u: User,
    db: Session | None = None,
    *,
    temporary_password: str | None = None,
) -> UserOut:
    roles = [u.role]
    grants: list[UserRoleGrant] = []
    if db is not None:
        grants = (
            db.query(UserRoleGrant)
            .filter(
                UserRoleGrant.user_id == u.id,
                UserRoleGrant.status == "active",
            )
            .all()
        )
        for g in grants:
            if g.role_code not in roles:
                roles.append(g.role_code)
        roles = sorted(set(roles))

    return UserOut(
        id=u.id,
        name=u.name,
        username=u.username,
        email=u.email,
        role=u.role,
        org=u.organization.name if u.organization else "",
        org_id=u.org_id,
        status=u.status,
        last_active=u.last_active_label,
        avatar_hue=u.avatar_hue,
        roles=roles,
        role_grants=[
            UserRoleGrantOut(id=g.id, role_code=g.role_code) for g in grants
        ],
        temporary_password=temporary_password,
    )


def _sku_out(s: Sku) -> SkuOut:
    from app.services.uploads import normalize_image_url

    return SkuOut(
        id=s.id,
        name=s.name,
        category=s.category,
        sku_code=s.sku_code,
        karat=s.karat,
        catalog_weight=s.catalog_weight,
        status=s.status,
        collection=s.collection,
        image_url=normalize_image_url(s.image_url),
        created_at=s.created_label,
    )


def _qc_out(q: QcInspection) -> QcOut:
    return QcOut(
        id=q.id,
        sku_id=q.sku_id,
        physical_code=q.physical_code,
        measured_weight=q.measured_weight,
        result=q.result,
        notes=q.notes,
        inspected_at=q.inspected_label,
        inspector=q.inspector_name,
    )


def _asset_out(a: Asset) -> AssetOut:
    from app.services.uploads import normalize_image_url

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
        image_url=normalize_image_url(a.image_url),
        sealed=a.sealed,
        issued_at=a.issued_label,
        collection=a.collection,
        producer=a.producer,
        description=a.description,
        custodian=a.custodian,
    )


def _proforma_out(p: Proforma) -> ProformaOut:
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


def _live_gold(db: Session) -> LiveGoldOut:
    settings = get_settings()
    row = db.get(SystemSettingsRow, 1)
    price = (
        row.live_rate_override
        if row and row.live_rate_override
        else settings.live_gold_price_per_gram
    )
    return LiveGoldOut(
        price_per_gram=price,
        karat=settings.live_gold_karat,
        source=settings.live_gold_source,
    )


_FULL_PLATFORM_ROLES = frozenset(
    {"admin", "finance", "warehouse", "qc", "pricing"}
)


def _scope_platform_lists(
    user: User,
    *,
    skus: list,
    qc: list,
    assets: list,
    issued: list,
    inventory: list,
    proformas: list,
    credits: list,
    credit_docs: list,
    ledger: list,
    audits: list,
    rates: list,
    crafts: list,
    adjustments: list,
    deliveries: list,
    orders: list,
):
    """Hide other parties' commercial data for channel roles."""
    from app.domains.permissions import effective_roles

    roles = effective_roles(user)
    if roles & _FULL_PLATFORM_ROLES:
        return (
            skus,
            qc,
            assets,
            issued,
            inventory,
            proformas,
            credits,
            credit_docs,
            ledger,
            audits,
            rates,
            crafts,
            adjustments,
            deliveries,
            orders,
        )

    party = user.organization.name if user.organization else ""
    name = user.name or ""

    if "retailer" in roles and "agent" not in roles and party:
        orders = [o for o in orders if o.retailer == party]
        credits = [
            c
            for c in credits
            if c.retailer_name == party or c.org_id == user.org_id
        ]
        credit_docs = [d for d in credit_docs if d.retailer_name == party]
        proformas = [p for p in proformas if p.retailer_name == party]
        deliveries = [d for d in deliveries if d.to_location == party]
        inventory = [
            i for i in inventory if i.location == party or i.type == "vault"
        ]
        assets = [
            a
            for a in assets
            if a.status in ("available", "reserved")
            or a.location == party
            or a.custodian == party
        ]
        issued = [
            a
            for a in issued
            if a.location == party
            or a.custodian == party
            or a.status in ("available", "reserved")
        ]
        ledger, audits, adjustments, rates = [], [], [], []
    elif "agent" in roles:
        proformas = [p for p in proformas if p.agent_name == name]
        deliveries = [
            d
            for d in deliveries
            if d.agent == name or d.agent in ("صف تحقق", "سیستم")
        ]
        orders = []
        credits, credit_docs = [], []
        ledger, audits, adjustments = [], [], []
        assets = [
            a
            for a in assets
            if a.status in ("available", "reserved")
            or "گالری" in (a.location or "")
        ]
        issued = [
            a
            for a in issued
            if "گالری" in (a.location or "")
            or a.status in ("available", "reserved")
        ]
    elif "producer" in roles:
        orders, credits, credit_docs, proformas = [], [], [], []
        deliveries, ledger, audits, adjustments, rates = [], [], [], [], []
        # Producers keep product/QC visibility; strip network stock details.
        inventory = []
        assets = []
        issued = []
    elif "customer" in roles:
        skus, qc = [], []
        assets, issued, inventory = [], [], []
        proformas, credits, credit_docs = [], [], []
        ledger, audits, rates, crafts, adjustments = [], [], [], [], []
        deliveries, orders = [], []
    else:
        # Unknown / restricted role — commercial empty, keep catalog read if any.
        orders, credits, credit_docs, proformas = [], [], [], []
        deliveries, ledger, audits, adjustments, rates = [], [], [], [], []

    return (
        skus,
        qc,
        assets,
        issued,
        inventory,
        proformas,
        credits,
        credit_docs,
        ledger,
        audits,
        rates,
        crafts,
        adjustments,
        deliveries,
        orders,
    )


@router.get("/health", response_model=HealthOut)
def health(db: Session = Depends(get_db)):
    settings = get_settings()
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    return HealthOut(
        status="ok" if db_ok else "degraded",
        demo_seed=settings.demo_seed,
        otp_demo=True,  # postponed: real SMS later
        db_ok=db_ok,
        zarrin_mode=settings.zarrin_mode if settings.zarrin_mode in ("test", "live") else "test",
    )


@router.post("/auth/login", response_model=TokenLoginOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .options(joinedload(User.organization))
        .filter(User.username == body.username.strip().lower())
        .first()
    )
    if not user:
        # also try email
        user = (
            db.query(User)
            .options(joinedload(User.organization))
            .filter(User.email == body.username.strip().lower())
            .first()
        )
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "نام کاربری یا رمز عبور نادرست است")
    if user.status != "active":
        raise HTTPException(403, "حساب کاربری فعال نیست")
    token = create_access_token(user_id=user.id, role=user.role, username=user.username)
    return TokenLoginOut(access_token=token, user=_user_out(user, db))


@router.get("/auth/me", response_model=UserOut)
def me(
    user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    return _user_out(user, db)


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    rows = db.query(User).options(joinedload(User.organization)).all()
    return [_user_out(u, db) for u in rows]


@router.get("/platform", response_model=PlatformSnapshot)
def platform_snapshot(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    row = db.get(SystemSettingsRow, 1)
    if not row:
        raise HTTPException(500, "not seeded")

    skus = db.query(Sku).order_by(Sku.created_at.desc()).all()
    qc = db.query(QcInspection).order_by(QcInspection.created_at.desc()).all()
    assets = db.query(Asset).order_by(Asset.created_at.desc()).all()
    issued = [a for a in assets if a.sealed]
    inventory = db.query(InventoryLocation).all()
    proformas = (
        db.query(Proforma).options(joinedload(Proforma.lines)).order_by(Proforma.created_at.desc()).all()
    )
    credits = db.query(CreditAccount).all()
    credit_docs = db.query(CreditDocument).all()
    ledger = db.query(DualLedgerEntry).order_by(DualLedgerEntry.created_at.desc()).all()
    audits = db.query(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(80).all()
    rates = db.query(RateRequest).order_by(RateRequest.id.desc()).all()
    crafts = db.query(CraftFeeRule).all()
    adjustments = db.query(Adjustment).order_by(Adjustment.created_at.desc()).all()
    deliveries = db.query(Delivery).all()
    orders = db.query(Order).order_by(Order.id.desc()).all()

    (
        skus,
        qc,
        assets,
        issued,
        inventory,
        proformas,
        credits,
        credit_docs,
        ledger,
        audits,
        rates,
        crafts,
        adjustments,
        deliveries,
        orders,
    ) = _scope_platform_lists(
        user,
        skus=skus,
        qc=qc,
        assets=assets,
        issued=issued,
        inventory=inventory,
        proformas=proformas,
        credits=credits,
        credit_docs=credit_docs,
        ledger=ledger,
        audits=audits,
        rates=rates,
        crafts=crafts,
        adjustments=adjustments,
        deliveries=deliveries,
        orders=orders,
    )

    return PlatformSnapshot(
        settings=SystemSettingsOut(
            weight_tolerance_grams=row.weight_tolerance_grams,
            price_lock_minutes=row.price_lock_minutes,
            proforma_ttl_minutes=row.proforma_ttl_minutes,
            default_karat=row.default_karat,
            rate_source=row.rate_source,
            currency=row.currency,
        ),
        live_gold=_live_gold(db),
        skus=[_sku_out(s) for s in skus],
        qc_queue=[_qc_out(q) for q in qc],
        issued_assets=[_asset_out(a) for a in issued],
        assets=[_asset_out(a) for a in assets],
        inventory=[
            InventoryOut(
                id=i.id,
                location=i.location,
                type=i.type,
                pieces=i.pieces,
                weight_grams=i.weight_grams,
                reserved_grams=i.reserved_grams,
                available_grams=i.available_grams,
                utilization=i.utilization,
            )
            for i in inventory
        ],
        proformas=[_proforma_out(p) for p in proformas],
        credit_accounts=[
            CreditAccountOut(
                id=c.id,
                retailer=c.retailer_name,
                ceiling_grams=c.ceiling_grams,
                used_grams=c.used_grams,
                ceiling_irr=c.ceiling_irr,
                used_irr=c.used_irr,
                overdue_grams=c.overdue_grams,
                blocked=c.blocked,
            )
            for c in credits
        ],
        credit_documents=[
            CreditDocOut(
                id=d.id,
                code=d.code,
                retailer=d.retailer_name,
                amount_irr=d.amount_irr,
                weight_grams=d.weight_grams,
                due_date=d.due_date_label,
                overdue_days=d.overdue_days,
                status=d.status,
                settlement_channel=getattr(d, "settlement_channel", None),
                settlement_notes=getattr(d, "settlement_notes", None) or "",
                settled_at=getattr(d, "settled_label", None),
                origin_channel=getattr(d, "origin_channel", None),
            )
            for d in credit_docs
        ],
        rate_requests=[
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
            for r in rates
        ],
        craft_rules=[
            CraftOut(
                id=c.id,
                name=c.name,
                category=c.category,
                method=c.method,
                value=c.value,
                active=c.active,
                collection=c.collection,
            )
            for c in crafts
        ],
        adjustments=[
            AdjustmentOut(
                id=a.id,
                code=a.code,
                reason=a.reason,
                weight_delta=a.weight_delta,
                irr_delta=a.irr_delta,
                created_by=a.created_by,
                created_at=a.created_label,
            )
            for a in adjustments
        ],
        deliveries=[
            DeliveryOut(
                id=d.id,
                code=d.code,
                agent=d.agent,
                from_location=d.from_location,
                to_location=d.to_location,
                pieces=d.pieces,
                weight_grams=d.weight_grams,
                status=d.status,
                otp_required=d.otp_required,
                scheduled_at=d.scheduled_label,
            )
            for d in deliveries
        ],
        orders=[
            OrderOut(
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
            for o in orders
        ],
        dual_ledger=[
            DualLedgerOut(
                id=e.id,
                doc_code=e.doc_code,
                entity=e.entity,
                warehouse=e.warehouse,
                weight_debit=e.weight_debit,
                weight_credit=e.weight_credit,
                irr_debit=e.irr_debit,
                irr_credit=e.irr_credit,
                kind=e.kind,
                locked=e.locked,
                date=e.date_label,
            )
            for e in ledger
        ],
        audit_events=[
            AuditOut(
                id=a.id,
                module=a.module,
                actor=a.actor,
                role=a.role,
                action=a.action,
                entity=a.entity,
                ip=a.ip,
                status=a.status,
                timestamp=a.timestamp_label,
            )
            for a in audits
        ],
    )


@router.get("/verify/{uid}", response_model=VerifyOut)
def verify_uid(uid: str, db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.uid == uid.strip().upper()).first()
    if not asset:
        asset = db.query(Asset).filter(Asset.uid.ilike(uid.strip())).first()
    if not asset:
        return VerifyOut(found=False)
    return VerifyOut(found=True, asset=_asset_out(asset))


@router.post("/skus", response_model=SkuOut)
def create_sku(
    body: CreateSkuIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("qc")),
):
    sku = ops.create_sku(
        db,
        name=body.name,
        category=body.category,
        sku_code=body.sku_code,
        karat=body.karat,
        catalog_weight=body.catalog_weight,
        collection=body.collection,
        image_url=body.image_url,
        actor=user.name,
        status=body.status,
    )
    return _sku_out(sku)


@router.post("/skus/{sku_id}/send-to-qc", response_model=QcOut)
def send_to_qc(
    sku_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("qc")),
):
    return _qc_out(ops.send_sku_to_qc(db, sku_id=sku_id, actor=user.name))


@router.post("/qc/{inspection_id}/complete", response_model=QcOut)
def qc_complete(
    inspection_id: str,
    body: CompleteQcIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("qc")),
):
    row = slice_b.complete_qc(
        db,
        inspection_id=inspection_id,
        measured_weight=body.measured_weight,
        result=body.result,
        inspector=body.inspector or user.name,
        notes=body.notes,
    )
    return _qc_out(row)


@router.post("/warehouse/uids", response_model=AssetOut, deprecated=True)
def warehouse_issue_uid(
    sku_id: str = Query(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("warehouse")),
):
    """Legacy alias — prefer POST /inventory/uids (domain permission)."""
    from app.domains import inventory as inventory_domain

    return _asset_out(
        inventory_domain.issue_uid(db, sku_id=sku_id, actor=user.name)
    )


@router.post("/pricing/locks", response_model=PriceLockOut)
def create_lock(
    body: PriceLockIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("agent")),
):
    live = _live_gold(db)
    lock = slice_b.create_price_lock(
        db,
        retailer_name=body.retailer,
        agent_name=body.agent or user.name,
        rate_per_gram=body.rate_per_gram or live.price_per_gram,
    )
    row = slice_b.get_settings_row(db)
    return PriceLockOut(
        id=lock.id,
        rate_per_gram=lock.rate_per_gram,
        retailer=lock.retailer_name,
        agent=lock.agent_name,
        expires_at=lock.expires_at,
        minutes=row.price_lock_minutes,
    )


@router.post("/proformas", response_model=ProformaOut)
def create_proforma(
    body: IssueProformaIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("agent")),
):
    pf = slice_b.issue_proforma(
        db,
        retailer_name=body.retailer,
        agent_name=body.agent or user.name,
        lock_id=body.lock_id,
        lines=[
            {"uid": l.uid, **({"craft_fee_pct": l.craft_fee_pct} if l.craft_fee_pct is not None else {})}
            for l in body.lines
        ],
    )
    pf = (
        db.query(Proforma)
        .options(joinedload(Proforma.lines))
        .filter(Proforma.id == pf.id)
        .one()
    )
    return _proforma_out(pf)


@router.post("/pricing/rate-requests", response_model=RateOut)
def create_rate_request(
    body: RateRequestIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("pricing")),
):
    row = ops.add_rate_request(
        db,
        current_rate=body.current_rate,
        proposed_rate=body.proposed_rate,
        reason=body.reason,
        requested_by=body.requested_by or user.name,
        valid_until_label=body.valid_until,
    )
    return RateOut(
        id=row.id,
        current_rate=row.current_rate,
        proposed_rate=row.proposed_rate,
        reason=row.reason,
        status=row.status,
        requested_by=row.requested_by,
        created_at=row.created_label,
        valid_until=row.valid_until_label,
    )


@router.post("/pricing/rate-requests/{request_id}/decide", response_model=RateOut)
def decide_rate(
    request_id: str,
    body: RateDecideIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("admin")),
):
    row = ops.decide_rate_request(
        db, request_id=request_id, status=body.status, actor=user.name
    )
    return RateOut(
        id=row.id,
        current_rate=row.current_rate,
        proposed_rate=row.proposed_rate,
        reason=row.reason,
        status=row.status,
        requested_by=row.requested_by,
        created_at=row.created_label,
        valid_until=row.valid_until_label,
    )


@router.post("/pricing/craft-rules", response_model=CraftOut)
def create_craft(
    body: CraftRuleIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("pricing")),
):
    row = ops.add_craft_rule(
        db,
        name=body.name,
        category=body.category,
        method=body.method,
        value=body.value,
        active=body.active,
        collection=body.collection,
    )
    return CraftOut(
        id=row.id,
        name=row.name,
        category=row.category,
        method=row.method,
        value=row.value,
        active=row.active,
        collection=row.collection,
    )


@router.post("/pricing/craft-rules/{rule_id}/toggle", response_model=CraftOut)
def toggle_craft(
    rule_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("pricing")),
):
    row = ops.toggle_craft_rule(db, rule_id=rule_id)
    return CraftOut(
        id=row.id,
        name=row.name,
        category=row.category,
        method=row.method,
        value=row.value,
        active=row.active,
        collection=row.collection,
    )


@router.patch("/settings", response_model=SystemSettingsOut)
def patch_settings(
    body: SettingsPatchIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("admin")),
):
    row = ops.update_settings(db, actor=user.name, **body.model_dump(exclude_none=True))
    return SystemSettingsOut(
        weight_tolerance_grams=row.weight_tolerance_grams,
        price_lock_minutes=row.price_lock_minutes,
        proforma_ttl_minutes=row.proforma_ttl_minutes,
        default_karat=row.default_karat,
        rate_source=row.rate_source,
        currency=row.currency,
    )


@router.post("/finance/adjustments", response_model=AdjustmentOut)
def post_adjustment(
    body: AdjustmentIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("finance")),
):
    row = ops.create_adjustment(
        db,
        reason=body.reason,
        weight_delta=body.weight_delta,
        irr_delta=body.irr_delta,
        created_by=user.name,
    )
    return AdjustmentOut(
        id=row.id,
        code=row.code,
        reason=row.reason,
        weight_delta=row.weight_delta,
        irr_delta=row.irr_delta,
        created_by=row.created_by,
        created_at=row.created_label,
    )


class CreditSettleLegacyIn(BaseModel):
    channel: str = "phone"
    notes: str = ""


@router.post("/finance/credit-documents/{document_id}/settle", response_model=CreditDocOut)
def settle_doc(
    document_id: str,
    body: CreditSettleLegacyIn | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("finance", "admin", "agent")),
):
    payload = body or CreditSettleLegacyIn()
    row = ops.settle_credit_document(
        db,
        document_id=document_id,
        actor=user.name,
        channel=payload.channel,
        notes=payload.notes,
    )
    return CreditDocOut(
        id=row.id,
        code=row.code,
        retailer=row.retailer_name,
        amount_irr=row.amount_irr,
        weight_grams=row.weight_grams,
        due_date=row.due_date_label,
        overdue_days=row.overdue_days,
        status=row.status,
        settlement_channel=getattr(row, "settlement_channel", None),
        settlement_notes=getattr(row, "settlement_notes", None) or "",
        settled_at=getattr(row, "settled_label", None),
        origin_channel=getattr(row, "origin_channel", None),
    )


class CreateDeliveryIn(BaseModel):
    proforma_id: str
    from_location: str = "خزانه تهران-الف"


@router.post("/deliveries", response_model=DeliveryOut, deprecated=True)
def create_delivery(
    body: CreateDeliveryIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("agent")),
):
    """Legacy alias — prefer POST /fulfillment/shipments."""
    from app.domains import fulfillment as fulfillment_domain

    row = fulfillment_domain.create_from_proforma(
        db,
        proforma_id=body.proforma_id,
        agent=user.name,
        from_location=body.from_location,
    )
    return DeliveryOut(
        id=row.id,
        code=row.code,
        agent=row.agent,
        from_location=row.from_location,
        to_location=row.to_location,
        pieces=row.pieces,
        weight_grams=row.weight_grams,
        status=row.status,
        otp_required=row.otp_required,
        scheduled_at=row.scheduled_label,
    )


@router.post("/deliveries/{delivery_id}/confirm-otp", response_model=DeliveryOut, deprecated=True)
def confirm_otp(
    delivery_id: str,
    body: DeliveryOtpIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("agent")),
):
    """Legacy alias — prefer POST /fulfillment/shipments/{id}/confirm-otp."""
    from app.domains import fulfillment as fulfillment_domain

    row = fulfillment_domain.confirm_otp(
        db, delivery_id=delivery_id, otp=body.otp, actor=user.name
    )
    return DeliveryOut(
        id=row.id,
        code=row.code,
        agent=row.agent,
        from_location=row.from_location,
        to_location=row.to_location,
        pieces=row.pieces,
        weight_grams=row.weight_grams,
        status=row.status,
        otp_required=row.otp_required,
        scheduled_at=row.scheduled_label,
    )


class InviteUserIn(BaseModel):
    name: str
    email: str
    username: str
    role: str = "retailer"
    org_id: str = "org-mehr"


class UserStatusIn(BaseModel):
    status: str


class UpdateUserIn(BaseModel):
    name: str | None = None
    email: str | None = None
    username: str | None = None
    role: str | None = None
    org_id: str | None = None


@router.post("/users/invite", response_model=UserOut)
def invite_user(
    body: InviteUserIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("admin")),
):
    row, temporary_password = ops.invite_user(
        db,
        name=body.name,
        email=body.email,
        username=body.username,
        role=body.role,
        org_id=body.org_id,
        actor=user.name,
    )
    row = (
        db.query(User)
        .options(joinedload(User.organization))
        .filter(User.id == row.id)
        .one()
    )
    return _user_out(row, db, temporary_password=temporary_password)


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: str,
    body: UpdateUserIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("admin")),
):
    row = ops.update_user(
        db,
        user_id=user_id,
        name=body.name,
        email=body.email,
        username=body.username,
        role=body.role,
        org_id=body.org_id,
        actor=user.name,
    )
    row = (
        db.query(User)
        .options(joinedload(User.organization))
        .filter(User.id == row.id)
        .one()
    )
    return _user_out(row, db)


@router.post("/users/{user_id}/status", response_model=UserOut)
def set_status(
    user_id: str,
    body: UserStatusIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("admin")),
):
    row = ops.set_user_status(
        db, user_id=user_id, status=body.status, actor=user.name
    )
    row = (
        db.query(User)
        .options(joinedload(User.organization))
        .filter(User.id == row.id)
        .one()
    )
    return _user_out(row, db)


@router.get("/finance/summary")
def finance_summary(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("finance", "admin")),
):
    entries = db.query(DualLedgerEntry).all()
    weight_in = sum(e.weight_debit for e in entries)
    weight_out = sum(e.weight_credit for e in entries)
    irr_in = sum(e.irr_debit for e in entries)
    irr_out = sum(e.irr_credit for e in entries)
    by_kind: dict[str, int] = {}
    for e in entries:
        by_kind[e.kind] = by_kind.get(e.kind, 0) + 1
    inventory = db.query(InventoryLocation).all()
    return {
        "ledger_rows": len(entries),
        "weight_debit_total": weight_in,
        "weight_credit_total": weight_out,
        "irr_debit_total": irr_in,
        "irr_credit_total": irr_out,
        "by_kind": by_kind,
        "inventory_weight": sum(i.weight_grams for i in inventory),
        "inventory_available": sum(i.available_grams for i in inventory),
        "inventory_reserved": sum(i.reserved_grams for i in inventory),
    }


@router.post("/orders", response_model=OrderOut)
def create_order(
    body: OrderIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_roles("retailer")),
):
    row = ops.place_retailer_order(
        db,
        retailer=body.retailer or user.organization.name,
        items=body.items,
        total_weight=body.total_weight,
        value=body.value,
        uids=body.uids,
    )
    return OrderOut(
        id=row.id,
        code=row.code,
        retailer=row.retailer,
        items=row.items,
        total_weight=row.total_weight,
        value=row.value,
        status=row.status,
        created_at=row.created_label,
        eta=row.eta_label,
    )


@router.get("/events", response_model=list[DomainEventOut])
def list_events(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin", "finance")),
):
    return [
        DomainEventOut(
            id=e.id,
            event_type=e.event_type,
            aggregate_type=e.aggregate_type,
            aggregate_id=e.aggregate_id,
            actor_name=e.actor_name,
            actor_role=e.actor_role,
            payload=e.payload,
            created_at=e.created_at,
        )
        for e in db.query(DomainEvent).order_by(DomainEvent.id.desc()).limit(100).all()
    ]


@router.post("/admin/reseed")
def reseed(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
):
    settings = get_settings()
    if not settings.demo_seed and not settings.allow_destructive_admin:
        raise HTTPException(
            403,
            "بازنشانی دمو در حالت تولید غیرفعال است "
            "(DEMO_SEED یا ALLOW_DESTRUCTIVE_ADMIN لازم است)",
        )
    from app.seed.demo import seed_all

    stats = seed_all(db, force=True)
    return {"ok": True, "stats": stats}
