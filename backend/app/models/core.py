"""SQLAlchemy models — projections + append-only domain_events."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB as PG_JSONB

JSONB = JSON().with_variant(PG_JSONB, "postgresql")
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class Organization(Base):
    """Network party — factory, atelier, wholesaler, gallery/store, vault, etc.

    Can exist with zero assigned people (store without assignee).
    """

    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    kind: Mapped[str] = mapped_column(String(64), nullable=False, default="internal")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    city: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    union_license: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    national_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    profile: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    users: Mapped[list[User]] = relationship(back_populates="organization")
    credit_account: Mapped[Optional[CreditAccount]] = relationship(back_populates="organization")
    memberships: Mapped[list[PartyMembership]] = relationship(back_populates="organization")


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    avatar_hue: Mapped[int] = mapped_column(Integer, nullable=False, default=160)
    last_active_label: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    organization: Mapped[Organization] = relationship(back_populates="users")
    memberships: Mapped[list[PartyMembership]] = relationship(back_populates="user")
    role_grants: Mapped[list[UserRoleGrant]] = relationship(back_populates="user")


class PartyMembership(Base):
    """Person ↔ Party/Store link. Party may have zero memberships."""

    __tablename__ = "party_memberships"
    __table_args__ = (UniqueConstraint("user_id", "org_id", name="uq_party_membership"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(128), nullable=False, default="عضو")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    created_label: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped[User] = relationship(back_populates="memberships")
    organization: Mapped[Organization] = relationship(back_populates="memberships")


class CustomRole(Base):
    """System or custom role definition — add/archive, not hard-delete system roles."""

    __tablename__ = "custom_roles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    label_fa: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    permissions: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    created_label: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserRoleGrant(Base):
    """Extra roles on a person (primary role remains users.role for session)."""

    __tablename__ = "user_role_grants"
    __table_args__ = (UniqueConstraint("user_id", "role_code", name="uq_user_role_grant"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    role_code: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    created_label: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped[User] = relationship(back_populates="role_grants")


class SystemSettingsRow(Base):
    __tablename__ = "system_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    weight_tolerance_grams: Mapped[float] = mapped_column(Float, nullable=False, default=0.05)
    price_lock_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    proforma_ttl_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=15)
    default_karat: Mapped[int] = mapped_column(Integer, nullable=False, default=18)
    rate_source: Mapped[str] = mapped_column(String(32), nullable=False, default="tgju")
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="IRT")
    live_rate_override: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)


class Sku(Base):
    __tablename__ = "skus"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    sku_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    karat: Mapped[int] = mapped_column(Integer, nullable=False)
    catalog_weight: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    collection: Mapped[str] = mapped_column(String(128), nullable=False, default="")
    image_url: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    producer_org: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_label: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    inspections: Mapped[list[QcInspection]] = relationship(back_populates="sku")
    assets: Mapped[list[Asset]] = relationship(back_populates="sku")


class QcInspection(Base):
    __tablename__ = "qc_inspections"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sku_id: Mapped[str] = mapped_column(ForeignKey("skus.id"), nullable=False)
    physical_code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    measured_weight: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    result: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    inspected_label: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    inspector_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    sku: Mapped[Sku] = relationship(back_populates="inspections")


class Asset(Base):
    """Sealed UID piece (or catalog demo piece). Weight/karat immutable after seal."""

    __tablename__ = "assets"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    sku_id: Mapped[Optional[str]] = mapped_column(ForeignKey("skus.id"), nullable=True)
    uid: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    collection: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    karat: Mapped[int] = mapped_column(Integer, nullable=False)
    weight_grams: Mapped[float] = mapped_column(Float, nullable=False)
    craft_fee_pct: Mapped[float] = mapped_column(Float, nullable=False, default=15.0)
    craft_fee_irr: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    custodian: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    producer: Mapped[str] = mapped_column(String(255), nullable=False, default="خانه ساخت دیدار گلد")
    image_url: Mapped[str] = mapped_column(String(512), nullable=False, default="")
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sealed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    issued_label: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_label: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    sku: Mapped[Optional[Sku]] = relationship(back_populates="assets")


class InventoryLocation(Base):
    __tablename__ = "inventory_locations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    location: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False)
    pieces: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    weight_grams: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    reserved_grams: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    available_grams: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    utilization: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class CraftFeeRule(Base):
    __tablename__ = "craft_fee_rules"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(32), nullable=False)
    method: Mapped[str] = mapped_column(String(32), nullable=False)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    collection: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)


class RateRequest(Base):
    __tablename__ = "rate_requests"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    current_rate: Mapped[int] = mapped_column(BigInteger, nullable=False)
    proposed_rate: Mapped[int] = mapped_column(BigInteger, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    requested_by: Mapped[str] = mapped_column(String(255), nullable=False)
    created_label: Mapped[str] = mapped_column(String(64), nullable=False)
    valid_until_label: Mapped[str] = mapped_column(String(64), nullable=False)


class CreditAccount(Base):
    __tablename__ = "credit_accounts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), unique=True, nullable=False)
    retailer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    ceiling_grams: Mapped[float] = mapped_column(Float, nullable=False)
    used_grams: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    ceiling_irr: Mapped[int] = mapped_column(BigInteger, nullable=False)
    used_irr: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    overdue_grams: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    blocked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    organization: Mapped[Organization] = relationship(back_populates="credit_account")
    documents: Mapped[list[CreditDocument]] = relationship(back_populates="account")


class CreditDocument(Base):
    __tablename__ = "credit_documents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    account_id: Mapped[str] = mapped_column(ForeignKey("credit_accounts.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    retailer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    amount_irr: Mapped[int] = mapped_column(BigInteger, nullable=False)
    weight_grams: Mapped[float] = mapped_column(Float, nullable=False)
    due_date_label: Mapped[str] = mapped_column(String(64), nullable=False)
    overdue_days: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    # verbal|phone|cash|transfer — how settle was confirmed (never fake Zarrin)
    settlement_channel: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    settlement_notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    settled_label: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    # Channel when the trust deal / receivable was opened
    origin_channel: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)

    account: Mapped[CreditAccount] = relationship(back_populates="documents")


class PriceLock(Base):
    __tablename__ = "price_locks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    rate_per_gram: Mapped[int] = mapped_column(BigInteger, nullable=False)
    agent_name: Mapped[str] = mapped_column(String(255), nullable=False)
    retailer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Proforma(Base):
    __tablename__ = "proformas"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    retailer_name: Mapped[str] = mapped_column(String(255), nullable=False)
    agent_name: Mapped[str] = mapped_column(String(255), nullable=False)
    rate_per_gram: Mapped[int] = mapped_column(BigInteger, nullable=False)
    lock_id: Mapped[Optional[str]] = mapped_column(ForeignKey("price_locks.id"), nullable=True)
    lock_expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    total_irr: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_label: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    lines: Mapped[list[ProformaLine]] = relationship(back_populates="proforma", cascade="all, delete-orphan")


class ProformaLine(Base):
    __tablename__ = "proforma_lines"
    __table_args__ = (UniqueConstraint("proforma_id", "uid", name="uq_proforma_uid"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    proforma_id: Mapped[str] = mapped_column(ForeignKey("proformas.id"), nullable=False)
    uid: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    weight_grams: Mapped[float] = mapped_column(Float, nullable=False)
    craft_fee_pct: Mapped[float] = mapped_column(Float, nullable=False)

    proforma: Mapped[Proforma] = relationship(back_populates="lines")


class DualLedgerEntry(Base):
    """Append-only dual-ledger projection rows (locked=true always)."""

    __tablename__ = "dual_ledger_entries"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    doc_code: Mapped[str] = mapped_column(String(64), nullable=False)
    entity: Mapped[str] = mapped_column(String(255), nullable=False)
    warehouse: Mapped[str] = mapped_column(String(255), nullable=False)
    weight_debit: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    weight_credit: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    irr_debit: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    irr_credit: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)
    locked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    date_label: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class DomainEvent(Base):
    """Append-only operational ledger — source of truth for slice writes."""

    __tablename__ = "domain_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    aggregate_type: Mapped[str] = mapped_column(String(64), nullable=False)
    aggregate_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    actor_name: Mapped[str] = mapped_column(String(255), nullable=False)
    actor_role: Mapped[str] = mapped_column(String(64), nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    module: Mapped[str] = mapped_column(String(128), nullable=False)
    actor: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(128), nullable=False)
    action: Mapped[str] = mapped_column(String(255), nullable=False)
    entity: Mapped[str] = mapped_column(String(255), nullable=False)
    ip: Mapped[str] = mapped_column(String(64), nullable=False, default="—")
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="ok")
    timestamp_label: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Adjustment(Base):
    __tablename__ = "adjustments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    weight_delta: Mapped[float] = mapped_column(Float, nullable=False)
    irr_delta: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_by: Mapped[str] = mapped_column(String(255), nullable=False)
    created_label: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Delivery(Base):
    __tablename__ = "deliveries"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    agent: Mapped[str] = mapped_column(String(255), nullable=False)
    from_location: Mapped[str] = mapped_column(String(255), nullable=False)
    to_location: Mapped[str] = mapped_column(String(255), nullable=False)
    pieces: Mapped[int] = mapped_column(Integer, nullable=False)
    weight_grams: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    otp_required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    scheduled_label: Mapped[str] = mapped_column(String(64), nullable=False)
    proforma_id: Mapped[Optional[str]] = mapped_column(ForeignKey("proformas.id"), nullable=True)
    uids: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    retailer: Mapped[str] = mapped_column(String(255), nullable=False)
    items: Mapped[int] = mapped_column(Integer, nullable=False)
    total_weight: Mapped[float] = mapped_column(Float, nullable=False)
    value: Mapped[int] = mapped_column(BigInteger, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    created_label: Mapped[str] = mapped_column(String(64), nullable=False)
    eta_label: Mapped[str] = mapped_column(String(64), nullable=False)


class Allocation(Base):
    """Inventory allocation — UID reserved for a commerce document."""

    __tablename__ = "allocations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    uid: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    proforma_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    order_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    actor: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    created_label: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class WarrantyClaim(Base):
    """Service domain — warranty / support claim against a UID."""

    __tablename__ = "warranty_claims"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    uid: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    claimant: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_label: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Collection(Base):
    """Product domain — named collection grouping SKUs."""

    __tablename__ = "collections"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="live")
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CustodyTransfer(Base):
    """Inventory domain — explicit custody handoff for a UID."""

    __tablename__ = "custody_transfers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    uid: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    from_custodian: Mapped[str] = mapped_column(String(255), nullable=False)
    to_custodian: Mapped[str] = mapped_column(String(255), nullable=False)
    from_location: Mapped[str] = mapped_column(String(255), nullable=False)
    to_location: Mapped[str] = mapped_column(String(255), nullable=False)
    actor: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    created_label: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CustodyDiscrepancy(Base):
    """Inventory domain — physical variance vs sealed UID weight."""

    __tablename__ = "custody_discrepancies"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    uid: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    expected_weight: Mapped[float] = mapped_column(Float, nullable=False)
    measured_weight: Mapped[float] = mapped_column(Float, nullable=False)
    delta_grams: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    reason: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
    actor: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    resolution_notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_label: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    resolved_label: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ServiceCase(Base):
    """Service domain — return / buyback / secondary lifecycle case."""

    __tablename__ = "service_cases"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    uid: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    kind: Mapped[str] = mapped_column(String(32), nullable=False)  # return|buyback|secondary
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="open")
    claimant: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    amount_irr: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    zarrin_ref: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    zarrin_status: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_label: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ProducerSettlement(Base):
    """Finance domain — producer payable settlement."""

    __tablename__ = "producer_settlements"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    code: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    producer: Mapped[str] = mapped_column(String(255), nullable=False)
    weight_grams: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    amount_irr: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="pending")
    period_label: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    zarrin_ref: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    zarrin_status: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_label: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    settled_label: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Promotion(Base):
    """Commerce domain — promotion / campaign."""

    __tablename__ = "promotions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    collection: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    discount_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")
    created_label: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CrmContact(Base):
    """Relationship domain — contact linked to a Network party (org)."""

    __tablename__ = "crm_contacts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    email: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    party_org_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("organizations.id"), nullable=True
    )
    role_label: Mapped[str] = mapped_column(String(64), nullable=False, default="contact")
    notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_label: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Campaign(Base):
    """Relationship domain — marketing campaign (automation later)."""

    __tablename__ = "campaigns"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    channel: Mapped[str] = mapped_column(String(64), nullable=False, default="sms")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="draft")
    trigger_event: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    fired_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_fired_label: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_label: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
