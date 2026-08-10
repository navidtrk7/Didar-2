"""Remaining interactive operations beyond slice B."""

from __future__ import annotations

import time

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import (
    Adjustment,
    Asset,
    CraftFeeRule,
    CreditAccount,
    CreditDocument,
    Delivery,
    DualLedgerEntry,
    InventoryLocation,
    Order,
    Proforma,
    RateRequest,
    Sku,
    SystemSettingsRow,
    QcInspection,
    User,
)
from app.services.events import append_audit, append_event, now_label
from app.services.slice_b import get_settings_row


def create_sku(
    db: Session,
    *,
    name: str,
    category: str,
    sku_code: str,
    karat: int,
    catalog_weight: float,
    collection: str,
    image_url: str,
    actor: str,
    status: str = "draft",
    producer_org: str | None = None,
    actor_role: str = "qc",
) -> Sku:
    from app.services.uploads import normalize_image_url

    if db.query(Sku).filter(Sku.sku_code == sku_code).first():
        raise HTTPException(409, "کد SKU تکراری است")
    sku = Sku(
        id=f"sku-{int(time.time() * 1000)}",
        name=name,
        category=category,
        sku_code=sku_code,
        karat=karat,
        catalog_weight=catalog_weight,
        status=status,
        collection=collection,
        image_url=normalize_image_url(image_url),
        producer_org=producer_org,
        created_label=now_label(),
    )
    db.add(sku)
    append_event(
        db,
        event_type="sku.created",
        aggregate_type="sku",
        aggregate_id=sku.id,
        actor_name=actor,
        actor_role=actor_role,
        payload={
            "sku_code": sku_code,
            "name": name,
            "producer_org": producer_org,
        },
    )
    append_audit(
        db,
        id=f"ae-{int(time.time() * 1000)}",
        module="کاتالوگ",
        actor=actor,
        role=actor_role,
        action="ایجاد SKU",
        entity=sku_code,
    )
    db.commit()
    db.refresh(sku)
    return sku


def send_sku_to_qc(db: Session, *, sku_id: str, actor: str) -> QcInspection:
    sku = db.get(Sku, sku_id)
    if not sku:
        raise HTTPException(404, "sku not found")
    if sku.status != "draft":
        raise HTTPException(400, "only draft SKUs can be sent to QC")
    count = db.query(QcInspection).count()
    physical = f"PHY-{8000 + count:04d}-X"
    inspection = QcInspection(
        id=f"qc-{int(time.time() * 1000)}",
        sku_id=sku.id,
        physical_code=physical,
    )
    sku.status = "awaiting_qc"
    db.add(inspection)
    append_event(
        db,
        event_type="sku.sent_to_qc",
        aggregate_type="qc_inspection",
        aggregate_id=inspection.id,
        actor_name=actor,
        actor_role="qc",
        payload={"sku_id": sku.id, "physical_code": physical},
    )
    append_audit(
        db,
        id=f"ae-{int(time.time() * 1000)}-qc",
        module="کنترل کیفیت",
        actor=actor,
        role="عملیات کاتالوگ و QC",
        action="ارسال به صف QC",
        entity=physical,
    )
    db.commit()
    db.refresh(inspection)
    return inspection


def add_rate_request(
    db: Session,
    *,
    current_rate: int,
    proposed_rate: int,
    reason: str,
    requested_by: str,
    valid_until_label: str = "۲۴ ساعت",
) -> RateRequest:
    row = RateRequest(
        id=f"rr-{int(time.time() * 1000)}",
        current_rate=current_rate,
        proposed_rate=proposed_rate,
        reason=reason,
        status="pending",
        requested_by=requested_by,
        created_label=now_label(),
        valid_until_label=valid_until_label,
    )
    db.add(row)
    append_event(
        db,
        event_type="rate.requested",
        aggregate_type="rate_request",
        aggregate_id=row.id,
        actor_name=requested_by,
        actor_role="pricing",
        payload={"proposed_rate": proposed_rate, "reason": reason},
    )
    append_audit(
        db,
        id=f"ae-{int(time.time() * 1000)}-rr",
        module="قیمت‌گذاری",
        actor=requested_by,
        role="کارشناس قیمت‌گذاری",
        action="درخواست تغییر دستی نرخ",
        entity=str(proposed_rate),
    )
    db.commit()
    db.refresh(row)
    return row


def decide_rate_request(
    db: Session,
    *,
    request_id: str,
    status: str,
    actor: str,
) -> RateRequest:
    if status not in ("approved", "rejected"):
        raise HTTPException(400, "status must be approved|rejected")
    row = db.get(RateRequest, request_id)
    if not row:
        raise HTTPException(404, "rate request not found")
    if row.status != "pending":
        raise HTTPException(409, "already decided")
    row.status = status
    append_event(
        db,
        event_type="rate.decided",
        aggregate_type="rate_request",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role="admin",
        payload={"status": status, "proposed_rate": row.proposed_rate},
    )
    append_audit(
        db,
        id=f"ae-{int(time.time() * 1000)}-rd",
        module="قیمت‌گذاری",
        actor=actor,
        role="مدیر کل سیستم",
        action="تأیید نرخ دستی" if status == "approved" else "رد نرخ دستی",
        entity=str(row.proposed_rate),
    )
    if status == "approved":
        settings_row = get_settings_row(db)
        settings_row.live_rate_override = row.proposed_rate
    db.commit()
    db.refresh(row)
    return row


def toggle_craft_rule(db: Session, *, rule_id: str) -> CraftFeeRule:
    row = db.get(CraftFeeRule, rule_id)
    if not row:
        raise HTTPException(404, "craft rule not found")
    row.active = not row.active
    db.commit()
    db.refresh(row)
    return row


def add_craft_rule(
    db: Session,
    *,
    name: str,
    category: str,
    method: str,
    value: float,
    active: bool = True,
    collection: str | None = None,
) -> CraftFeeRule:
    row = CraftFeeRule(
        id=f"cfr-{int(time.time() * 1000)}",
        name=name,
        category=category,
        method=method,
        value=value,
        active=active,
        collection=collection,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def update_settings(
    db: Session,
    *,
    weight_tolerance_grams: float | None = None,
    price_lock_minutes: int | None = None,
    proforma_ttl_minutes: int | None = None,
    default_karat: int | None = None,
    rate_source: str | None = None,
    currency: str | None = None,
    actor: str,
) -> SystemSettingsRow:
    row = get_settings_row(db)
    if weight_tolerance_grams is not None:
        row.weight_tolerance_grams = weight_tolerance_grams
    if price_lock_minutes is not None:
        row.price_lock_minutes = price_lock_minutes
    if proforma_ttl_minutes is not None:
        row.proforma_ttl_minutes = proforma_ttl_minutes
    if default_karat is not None:
        row.default_karat = default_karat
    if rate_source is not None:
        row.rate_source = rate_source
    if currency is not None:
        row.currency = currency
    append_audit(
        db,
        id=f"ae-{int(time.time() * 1000)}-set",
        module="سیستم",
        actor=actor,
        role="مدیر کل سیستم",
        action="به‌روزرسانی تنظیمات",
        entity="system_settings",
    )
    db.commit()
    db.refresh(row)
    return row


def create_adjustment(
    db: Session,
    *,
    reason: str,
    weight_delta: float,
    irr_delta: int,
    created_by: str,
) -> Adjustment:
    count = db.query(Adjustment).count() + 14
    code = f"ADJ-{count:03d}"
    row = Adjustment(
        id=f"adj-{int(time.time() * 1000)}",
        code=code,
        reason=reason,
        weight_delta=weight_delta,
        irr_delta=irr_delta,
        created_by=created_by,
        created_label=now_label(),
    )
    db.add(row)
    settings = get_settings()
    db.add(
        DualLedgerEntry(
            id=f"dl-{int(time.time() * 1000)}-adj",
            doc_code=code,
            entity=reason,
            warehouse="خزانه مرکزی",
            weight_debit=weight_delta if weight_delta > 0 else 0,
            weight_credit=abs(weight_delta) if weight_delta < 0 else 0,
            irr_debit=irr_delta if irr_delta > 0 else 0,
            irr_credit=abs(irr_delta) if irr_delta < 0 else 0,
            kind="adjustment",
            locked=True,
            date_label="۱۴۰۵/۰۵/۱۵",
        )
    )
    append_event(
        db,
        event_type="adjustment.created",
        aggregate_type="adjustment",
        aggregate_id=row.id,
        actor_name=created_by,
        actor_role="finance",
        payload={
            "code": code,
            "weight_delta": weight_delta,
            "irr_delta": irr_delta,
            "reason": reason,
            "irt_to_irr": settings.irt_to_irr,
        },
    )
    append_audit(
        db,
        id=f"ae-{int(time.time() * 1000)}-adj",
        module="مالی",
        actor=created_by,
        role="مدیر مالی",
        action="ثبت سند اصلاحی",
        entity=code,
    )
    db.commit()
    db.refresh(row)
    return row


def confirm_delivery_otp(
    db: Session,
    *,
    delivery_id: str,
    otp: str,
    actor: str,
) -> Delivery:
    """SMS is not integrated — fixed OTP is always 1234."""
    row = db.get(Delivery, delivery_id)
    if not row:
        raise HTTPException(404, "delivery not found")
    if row.status == "completed":
        raise HTTPException(409, "already completed")
    if otp.strip() != "1234":
        raise HTTPException(400, "کد تأیید نادرست است (باید 1234 باشد)")
    row.status = "completed"

    uids = list(row.uids or [])
    for uid in uids:
        asset = db.query(Asset).filter(Asset.uid == uid).first()
        if not asset:
            continue
        # Release reserved grams at origin
        origin = (
            db.query(InventoryLocation)
            .filter(InventoryLocation.location == asset.location)
            .first()
        )
        # Proforma reserves grams; shipment may set status to in_transit first.
        if origin and asset.status in ("reserved", "in_transit"):
            origin.reserved_grams = max(0.0, origin.reserved_grams - asset.weight_grams)
            origin.pieces = max(0, origin.pieces - 1)
            origin.weight_grams = max(0.0, origin.weight_grams - asset.weight_grams)
        asset.status = "delivered"
        asset.location = row.to_location
        asset.custodian = row.to_location
        dest = (
            db.query(InventoryLocation)
            .filter(InventoryLocation.location == row.to_location)
            .first()
        )
        if not dest:
            dest = InventoryLocation(
                id=f"loc-{int(time.time() * 1000)}",
                location=row.to_location,
                type="retailer",
                pieces=0,
                weight_grams=0,
                reserved_grams=0,
                available_grams=0,
                utilization=0,
            )
            db.add(dest)
            db.flush()
        dest.pieces += 1
        dest.weight_grams += asset.weight_grams
        dest.available_grams += asset.weight_grams

    # Close active allocations for delivered UIDs
    from app.models import Allocation

    for uid in uids:
        active = (
            db.query(Allocation)
            .filter(Allocation.uid == uid, Allocation.status == "active")
            .all()
        )
        for alloc in active:
            alloc.status = "fulfilled"

    append_event(
        db,
        event_type="delivery.completed",
        aggregate_type="delivery",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role="agent",
        payload={"code": row.code, "otp": "1234", "uids": uids},
    )
    append_audit(
        db,
        id=f"ae-{int(time.time() * 1000)}-dlv",
        module="تحویل",
        actor=actor,
        role="ایجنت فروش",
        action="تأیید OTP تحویل",
        entity=row.code,
    )
    db.commit()
    db.refresh(row)
    return row


def create_delivery_from_proforma(
    db: Session,
    *,
    proforma_id: str,
    agent: str,
    from_location: str = "خزانه تهران-الف",
) -> Delivery:
    pf = db.get(Proforma, proforma_id)
    if not pf:
        raise HTTPException(404, "proforma not found")
    if pf.status != "issued":
        raise HTTPException(400, "only issued proformas can ship")
    lines = list(pf.lines)
    if not lines:
        raise HTTPException(400, "proforma has no lines")
    uids = [l.uid for l in lines]
    weight = sum(l.weight_grams for l in lines)
    count = db.query(Delivery).count() + 8850
    code = f"DLV-{count}"
    row = Delivery(
        id=f"dlv-{int(time.time() * 1000)}",
        code=code,
        agent=agent,
        from_location=from_location,
        to_location=pf.retailer_name,
        pieces=len(uids),
        weight_grams=weight,
        status="awaiting_otp",
        otp_required=True,
        scheduled_label=now_label(),
        proforma_id=pf.id,
        uids=uids,
    )
    db.add(row)
    for uid in uids:
        asset = db.query(Asset).filter(Asset.uid == uid).first()
        if asset:
            asset.status = "in_transit"
    append_event(
        db,
        event_type="delivery.created",
        aggregate_type="delivery",
        aggregate_id=row.id,
        actor_name=agent,
        actor_role="agent",
        payload={"code": code, "proforma": pf.code, "uids": uids},
    )
    db.commit()
    db.refresh(row)
    return row


def _credit_account_trust_tier(db: Session, account: CreditAccount | None) -> str:
    from app.domains.finance.trust import trust_tier_from_profile
    from app.models import Organization

    if not account:
        return trust_tier_from_profile(None)
    org = db.get(Organization, account.org_id)
    return trust_tier_from_profile(org.profile if org else None)


def create_credit_document(
    db: Session,
    *,
    retailer: str,
    amount_irr: int,
    weight_grams: float,
    due_date: str = "",
    origin_channel: str = "verbal",
    notes: str = "",
    actor: str,
) -> CreditDocument:
    """Open a trust receivable — phone/verbal deal without pretending it's paid."""
    from app.domains.finance.trust import assert_channel_allowed, normalize_channel

    channel = normalize_channel(origin_channel)
    name = retailer.strip()
    if not name:
        raise HTTPException(400, "نام خرده‌فروش الزامی است")
    if amount_irr <= 0 and weight_grams <= 0:
        raise HTTPException(400, "مبلغ یا وزن باید مثبت باشد")

    account = (
        db.query(CreditAccount)
        .filter(CreditAccount.retailer_name == name)
        .first()
    )
    if not account:
        raise HTTPException(404, f"حساب اعتبار برای «{name}» یافت نشد")
    if account.blocked:
        raise HTTPException(400, "حساب اعتبار مسدود است")

    assert_channel_allowed(_credit_account_trust_tier(db, account), channel)

    new_used_g = account.used_grams + max(0.0, weight_grams)
    new_used_irr = account.used_irr + max(0, amount_irr)
    if new_used_g > account.ceiling_grams + 1e-6:
        raise HTTPException(400, "سقف وزنی اعتبار کافی نیست")
    if new_used_irr > account.ceiling_irr:
        raise HTTPException(400, "سقف ریالی اعتبار کافی نیست")

    count = db.query(CreditDocument).count() + 100
    code = f"CD-{count:04d}"
    row = CreditDocument(
        id=f"cd-{int(time.time() * 1000)}",
        account_id=account.id,
        code=code,
        retailer_name=account.retailer_name,
        amount_irr=max(0, amount_irr),
        weight_grams=max(0.0, weight_grams),
        due_date_label=due_date.strip() or "توافقی",
        overdue_days=0,
        status="open",
        origin_channel=channel,
        settlement_notes=notes.strip(),
    )
    account.used_grams = new_used_g
    account.used_irr = new_used_irr
    db.add(row)
    append_event(
        db,
        event_type="credit.trust_deal_opened",
        aggregate_type="credit_document",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role="finance",
        payload={
            "code": code,
            "retailer": account.retailer_name,
            "amount_irr": row.amount_irr,
            "weight_grams": row.weight_grams,
            "origin_channel": channel,
            "notes": notes.strip(),
        },
    )
    append_audit(
        db,
        id=f"ae-{int(time.time() * 1000)}-cd",
        module="مالی",
        actor=actor,
        role="اعتبار",
        action=f"ثبت توافق اعتماد ({channel})",
        entity=code,
    )
    db.commit()
    db.refresh(row)
    return row


def settle_credit_document(
    db: Session,
    *,
    document_id: str,
    actor: str,
    channel: str = "phone",
    notes: str = "",
) -> CreditDocument:
    from app.domains.finance.trust import (
        SETTLEMENT_CHANNELS,
        assert_channel_allowed,
        normalize_channel,
    )

    doc = db.get(CreditDocument, document_id)
    if not doc:
        raise HTTPException(404, "credit document not found")
    if doc.status == "settled":
        raise HTTPException(409, "already settled")
    settle_ch = normalize_channel(channel)
    account = db.get(CreditAccount, doc.account_id)
    assert_channel_allowed(_credit_account_trust_tier(db, account), settle_ch)

    doc.status = "settled"
    doc.overdue_days = 0
    doc.settlement_channel = settle_ch
    doc.settled_label = now_label()
    note = notes.strip()
    if note:
        prev = (doc.settlement_notes or "").strip()
        doc.settlement_notes = f"{prev} | {note}".strip(" |") if prev else note
    if account:
        account.used_grams = max(0.0, account.used_grams - doc.weight_grams)
        account.used_irr = max(0, account.used_irr - doc.amount_irr)
        account.overdue_grams = max(0.0, account.overdue_grams - doc.weight_grams)
        if account.overdue_grams <= 0 and account.blocked:
            other = (
                db.query(CreditDocument)
                .filter(
                    CreditDocument.account_id == account.id,
                    CreditDocument.status == "overdue",
                    CreditDocument.id != doc.id,
                )
                .count()
            )
            if other == 0:
                account.blocked = False
                account.overdue_grams = 0

    db.add(
        DualLedgerEntry(
            id=f"dl-{int(time.time() * 1000)}-cd",
            doc_code=doc.code,
            entity=doc.retailer_name,
            warehouse=f"تسویه {SETTLEMENT_CHANNELS.get(settle_ch, settle_ch)}",
            weight_debit=0,
            weight_credit=float(doc.weight_grams or 0),
            irr_debit=0,
            irr_credit=int(doc.amount_irr or 0),
            kind="credit_settlement",
            locked=True,
            date_label=now_label(),
        )
    )
    append_event(
        db,
        event_type="credit.settled",
        aggregate_type="credit_document",
        aggregate_id=doc.id,
        actor_name=actor,
        actor_role="finance",
        payload={
            "code": doc.code,
            "amount_irr": doc.amount_irr,
            "channel": settle_ch,
            "notes": note,
        },
    )
    append_audit(
        db,
        id=f"ae-{int(time.time() * 1000)}-setl",
        module="مالی",
        actor=actor,
        role="مدیر مالی",
        action=f"تسویه سند اعتباری ({settle_ch})",
        entity=doc.code,
    )
    db.commit()
    db.refresh(doc)
    return doc


def invite_user(
    db: Session,
    *,
    name: str,
    email: str,
    username: str,
    role: str,
    org_id: str,
    actor: str,
) -> tuple[User, str | None]:
    import secrets

    from app.deps import hash_password
    from app.config import get_settings

    if db.query(User).filter(User.username == username).first():
        raise HTTPException(409, "نام کاربری تکراری است")
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "ایمیل تکراری است")
    settings = get_settings()
    # Demo seed: shared password. Real mode: one-time random (shown once to admin).
    if settings.demo_seed:
        password = settings.demo_password
        temporary_password = None
    else:
        password = secrets.token_urlsafe(12)
        temporary_password = password
    row = User(
        id=f"u-{int(time.time() * 1000)}",
        name=name,
        username=username.lower().strip(),
        email=email.lower().strip(),
        password_hash=hash_password(password),
        role=role,
        org_id=org_id,
        status="invited",
        avatar_hue=int(time.time()) % 360,
        last_active_label="—",
    )
    db.add(row)
    append_audit(
        db,
        id=f"ae-{int(time.time() * 1000)}-inv",
        module="کاربران",
        actor=actor,
        role="مدیر کل سیستم",
        action="دعوت کاربر",
        entity=username,
    )
    db.commit()
    db.refresh(row)
    return row, temporary_password


def update_user(
    db: Session,
    *,
    user_id: str,
    actor: str,
    name: str | None = None,
    email: str | None = None,
    username: str | None = None,
    role: str | None = None,
    org_id: str | None = None,
) -> User:
    from app.models import Organization

    row = db.get(User, user_id)
    if not row:
        raise HTTPException(404, "user not found")

    if username is not None:
        next_username = username.lower().strip()
        if not next_username:
            raise HTTPException(400, "نام کاربری نامعتبر است")
        clash = (
            db.query(User)
            .filter(User.username == next_username, User.id != user_id)
            .first()
        )
        if clash:
            raise HTTPException(409, "نام کاربری تکراری است")
        row.username = next_username

    if email is not None:
        next_email = email.lower().strip()
        if not next_email:
            raise HTTPException(400, "ایمیل نامعتبر است")
        clash = (
            db.query(User)
            .filter(User.email == next_email, User.id != user_id)
            .first()
        )
        if clash:
            raise HTTPException(409, "ایمیل تکراری است")
        row.email = next_email

    if name is not None:
        next_name = name.strip()
        if not next_name:
            raise HTTPException(400, "نام نامعتبر است")
        row.name = next_name

    if role is not None:
        next_role = role.strip()
        if not next_role:
            raise HTTPException(400, "نقش نامعتبر است")
        row.role = next_role

    if org_id is not None:
        org = db.get(Organization, org_id)
        if not org:
            raise HTTPException(404, "سازمان یافت نشد")
        row.org_id = org_id

    append_audit(
        db,
        id=f"ae-{int(time.time() * 1000)}-ued",
        module="کاربران",
        actor=actor,
        role="مدیر کل سیستم",
        action="ویرایش کاربر",
        entity=row.username,
    )
    db.commit()
    db.refresh(row)
    return row


def set_user_status(
    db: Session,
    *,
    user_id: str,
    status: str,
    actor: str,
) -> User:
    if status not in ("active", "suspended", "invited"):
        raise HTTPException(400, "invalid status")
    row = db.get(User, user_id)
    if not row:
        raise HTTPException(404, "user not found")
    row.status = status
    append_audit(
        db,
        id=f"ae-{int(time.time() * 1000)}-ust",
        module="کاربران",
        actor=actor,
        role="مدیر کل سیستم",
        action=f"تغییر وضعیت به {status}",
        entity=row.username,
    )
    db.commit()
    db.refresh(row)
    return row


def place_retailer_order(
    db: Session,
    *,
    retailer: str,
    items: int,
    total_weight: float,
    value: int,
    uids: list[str] | None = None,
) -> Order:
    from app.models import Asset, CreditAccount
    from app.domains.inventory.allocation import allocate
    from app.domains.fulfillment.service import create_from_order

    uid_list = [u.strip().upper() for u in (uids or []) if u and str(u).strip()]
    resolved_weight = 0.0

    if uid_list:
        seen: set[str] = set()
        for uid in uid_list:
            if uid in seen:
                raise HTTPException(400, f"UID تکراری در سفارش: {uid}")
            seen.add(uid)
            asset = db.query(Asset).filter(Asset.uid == uid).first()
            if not asset:
                raise HTTPException(404, f"UID یافت نشد: {uid}")
            if asset.status != "available":
                raise HTTPException(
                    400,
                    f"UID {uid} قابل فروش نیست (وضعیت: {asset.status})",
                )
            resolved_weight += asset.weight_grams

        account = (
            db.query(CreditAccount)
            .filter(CreditAccount.retailer_name == retailer)
            .first()
        )
        if not account:
            # Fallback: match by org name fragment / partial (pilot-safe)
            account = (
                db.query(CreditAccount)
                .filter(CreditAccount.retailer_name.ilike(f"%{retailer}%"))
                .first()
            )
        if not account:
            raise HTTPException(404, "حساب اعتباری خرده‌فروش یافت نشد")
        if account.blocked:
            raise HTTPException(400, "اعتبار خرده‌فروش مسدود است")
        # Normalize to credit SoR name so subsequent used_grams updates stick
        retailer = account.retailer_name
        remaining = account.ceiling_grams - account.used_grams
        if resolved_weight > remaining + 1e-9:
            raise HTTPException(
                400,
                f"اعتبار ناکافی: باقی‌مانده {remaining:.1f}g، سبد {resolved_weight:.1f}g",
            )
        total_weight = resolved_weight
        items = len(uid_list)

    count = db.query(Order).count() + 24090
    code = f"ORD-{count}"
    row = Order(
        id=f"ord-{int(time.time() * 1000)}",
        code=code,
        retailer=retailer,
        items=items,
        total_weight=total_weight,
        value=value,
        status="submitted",
        created_label=now_label(),
        eta_label="به‌زودی",
    )
    db.add(row)
    append_event(
        db,
        event_type="order.submitted",
        aggregate_type="order",
        aggregate_id=row.id,
        actor_name=retailer,
        actor_role="retailer",
        payload={
            "code": code,
            "items": items,
            "total_weight": total_weight,
            "uids": list(uid_list),
        },
    )
    db.flush()

    if uid_list:
        for uid in uid_list:
            allocate(
                db,
                uid=uid,
                actor=retailer,
                order_id=row.id,
                commit=False,
            )
        create_from_order(
            db,
            order_id=row.id,
            agent="صف تحقق",
            uids=list(uid_list),
            to_location=retailer,
            commit=False,
        )
        if account := (
            db.query(CreditAccount)
            .filter(CreditAccount.retailer_name == retailer)
            .first()
        ):
            account.used_grams = float(account.used_grams) + float(resolved_weight)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise
    db.refresh(row)
    return row
