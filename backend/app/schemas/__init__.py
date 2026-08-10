from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class HealthOut(BaseModel):
    status: str
    service: str = "didar-api"
    demo_seed: bool = False
    otp_demo: bool = True  # SMS not integrated yet — fixed OTP in demo/pilot
    db_ok: bool = False
    zarrin_mode: str = "test"


class LiveGoldOut(BaseModel):
    price_per_gram: int
    karat: int
    currency: str = "IRT"
    source: str


class SystemSettingsOut(BaseModel):
    weight_tolerance_grams: float
    price_lock_minutes: int
    proforma_ttl_minutes: int
    default_karat: int
    rate_source: str
    currency: str


class UserRoleGrantOut(BaseModel):
    id: str
    role_code: str


class UserOut(BaseModel):
    id: str
    name: str
    username: str
    email: str
    role: str
    org: str
    org_id: str | None = None
    status: str
    last_active: str
    avatar_hue: int
    roles: list[str] = []
    role_grants: list[UserRoleGrantOut] = []
    # One-time password returned only on invite when DEMO_SEED is false.
    temporary_password: str | None = None


class LoginIn(BaseModel):
    username: str
    password: str


class LoginOut(BaseModel):
    user: UserOut


class SkuOut(BaseModel):
    id: str
    name: str
    category: str
    sku_code: str
    karat: int
    catalog_weight: float
    status: str
    collection: str
    image_url: str
    created_at: str
    producer_org: Optional[str] = None


class QcOut(BaseModel):
    id: str
    sku_id: str
    physical_code: str
    measured_weight: Optional[float] = None
    result: Optional[str] = None
    notes: Optional[str] = None
    inspected_at: Optional[str] = None
    inspector: Optional[str] = None


class CompleteQcIn(BaseModel):
    measured_weight: float = Field(gt=0)
    result: str
    inspector: Optional[str] = None
    notes: Optional[str] = None


class AssetOut(BaseModel):
    id: str
    sku_id: Optional[str] = None
    uid: str
    name: str
    category: str
    karat: int
    weight_grams: float
    craft_fee_pct: float
    status: str
    location: str
    image_url: str
    sealed: bool
    issued_at: Optional[str] = None
    collection: Optional[str] = None
    producer: Optional[str] = None
    description: Optional[str] = None
    custodian: Optional[str] = None


class InventoryOut(BaseModel):
    id: str
    location: str
    type: str
    pieces: int
    weight_grams: float
    reserved_grams: float
    available_grams: float
    utilization: int


class CreditAccountOut(BaseModel):
    id: str
    retailer: str
    ceiling_grams: float
    used_grams: float
    ceiling_irr: int
    used_irr: int
    overdue_grams: float
    blocked: bool


class ProformaLineIn(BaseModel):
    uid: str
    craft_fee_pct: Optional[float] = None


class ProformaLineOut(BaseModel):
    uid: str
    name: str
    weight_grams: float
    craft_fee_pct: float


class ProformaOut(BaseModel):
    id: str
    code: str
    retailer: str
    agent: str
    lines: list[ProformaLineOut]
    rate_per_gram: int
    lock_expires_at: Optional[datetime] = None
    status: str
    created_at: str
    total_irr: int


class PriceLockIn(BaseModel):
    retailer: str
    agent: str = "نوید رستمی"
    rate_per_gram: Optional[int] = None


class PriceLockOut(BaseModel):
    id: str
    rate_per_gram: int
    retailer: str
    agent: str
    expires_at: datetime
    minutes: int


class IssueProformaIn(BaseModel):
    retailer: str
    agent: str = "نوید رستمی"
    lock_id: str
    lines: list[ProformaLineIn]


class DualLedgerOut(BaseModel):
    id: str
    doc_code: str
    entity: str
    warehouse: str
    weight_debit: float
    weight_credit: float
    irr_debit: int
    irr_credit: int
    kind: str
    locked: bool
    date: str


class AuditOut(BaseModel):
    id: str
    module: str
    actor: str
    role: str
    action: str
    entity: str
    ip: str
    status: str
    timestamp: str


class DomainEventOut(BaseModel):
    id: int
    event_type: str
    aggregate_type: str
    aggregate_id: str
    actor_name: str
    actor_role: str
    payload: dict[str, Any]
    created_at: datetime


class PlatformSnapshot(BaseModel):
    """Shape close to frontend PlatformState + related demo tables."""

    settings: SystemSettingsOut
    live_gold: LiveGoldOut
    skus: list[SkuOut]
    qc_queue: list[QcOut]
    issued_assets: list[AssetOut]
    assets: list[AssetOut]
    inventory: list[InventoryOut]
    proformas: list[ProformaOut]
    credit_accounts: list[CreditAccountOut]
    credit_documents: list[Any] = []
    rate_requests: list[Any] = []
    craft_rules: list[Any] = []
    adjustments: list[Any] = []
    deliveries: list[Any] = []
    orders: list[Any] = []
    dual_ledger: list[DualLedgerOut]
    audit_events: list[AuditOut]
