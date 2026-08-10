from __future__ import annotations

import re
import time
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import (
    Asset,
    CreditAccount,
    InventoryLocation,
    PriceLock,
    Proforma,
    ProformaLine,
    QcInspection,
    Sku,
    SystemSettingsRow,
)
from app.services.events import append_audit, append_event, now_label, utcnow


def get_settings_row(db: Session) -> SystemSettingsRow:
    row = db.get(SystemSettingsRow, 1)
    if not row:
        raise HTTPException(500, "system_settings missing — run seed")
    return row


def complete_qc(
    db: Session,
    *,
    inspection_id: str,
    measured_weight: float,
    result: str,
    inspector: str,
    notes: str | None = None,
) -> QcInspection:
    if result not in ("pass", "fail", "rework"):
        raise HTTPException(400, "result must be pass|fail|rework")

    inspection = db.get(QcInspection, inspection_id)
    if not inspection:
        raise HTTPException(404, "inspection not found")
    if inspection.result is not None:
        raise HTTPException(409, "inspection already completed")

    sku = db.get(Sku, inspection.sku_id)
    if not sku:
        raise HTTPException(404, "sku not found")

    settings = get_settings_row(db)
    delta = abs(measured_weight - sku.catalog_weight)
    if result == "pass" and delta > settings.weight_tolerance_grams:
        raise HTTPException(
            400,
            f"weight delta {delta:.3f}g exceeds tolerance ±{settings.weight_tolerance_grams}g",
        )

    next_status = {"pass": "approved", "rework": "needs_rework", "fail": "draft"}[result]
    inspection.measured_weight = measured_weight
    inspection.result = result
    inspection.notes = notes
    inspection.inspected_label = now_label()
    inspection.inspector_name = inspector

    sku.status = next_status
    if result == "pass":
        sku.catalog_weight = measured_weight

    action = {"pass": "تایید کیفی", "rework": "نیازمند اصلاح", "fail": "رد کیفی"}[result]
    append_event(
        db,
        event_type="qc.completed",
        aggregate_type="qc_inspection",
        aggregate_id=inspection.id,
        actor_name=inspector,
        actor_role="qc",
        payload={
            "sku_id": sku.id,
            "physical_code": inspection.physical_code,
            "measured_weight": measured_weight,
            "result": result,
            "sku_status": next_status,
        },
    )
    append_audit(
        db,
        id=f"ae-{int(time.time() * 1000)}",
        module="کنترل کیفیت",
        actor=inspector,
        role="عملیات کاتالوگ و QC",
        action=action,
        entity=inspection.physical_code,
    )
    db.commit()
    db.refresh(inspection)

    # Chain glue: QC pass → auto UID in Inventory
    if result == "pass":
        try:
            issue_uid(db, sku_id=sku.id, actor=inspector)
        except HTTPException as exc:
            # Already issued or transient — QC result still stands
            if exc.status_code not in (400, 409):
                raise

    return inspection


def issue_uid(db: Session, *, sku_id: str, actor: str = "حسین پاکروان") -> Asset:
    sku = db.get(Sku, sku_id)
    if not sku:
        raise HTTPException(404, "sku not found")
    if sku.status != "approved":
        raise HTTPException(400, "sku must be approved before UID issue")

    existing = db.query(Asset).filter(Asset.sku_id == sku_id, Asset.sealed.is_(True)).first()
    if existing:
        # Idempotent: QC auto-issue and warehouse re-issue both OK
        return existing

    settings = get_settings()
    code_tail = re.sub(r"[^A-Z0-9]", "", sku.sku_code.upper())[-4:] or "ITEM"
    seq = db.query(Asset).filter(Asset.sealed.is_(True)).count() + 1
    uid = f"DDR-{sku.karat}K-{code_tail}-{seq:03d}"

    location = "خزانه تهران-الف"
    warehouse = "خزانه مرکزی"
    asset = Asset(
        id=f"iss-{int(time.time() * 1000)}",
        sku_id=sku.id,
        uid=uid,
        name=sku.name,
        category=sku.category,
        collection=sku.collection,
        karat=sku.karat,
        weight_grams=sku.catalog_weight,
        craft_fee_pct=15.0,
        status="available",
        location=location,
        custodian="خزانه دیدار",
        image_url=(sku.image_url or "").strip() or "/products/product-01.jpg",
        sealed=True,
        issued_label=now_label(),
        created_label=now_label(),
    )
    db.add(asset)

    irr_debit = round(sku.catalog_weight * settings.live_gold_price_per_gram * settings.irt_to_irr)
    from app.models import DualLedgerEntry

    db.add(
        DualLedgerEntry(
            id=f"dl-{int(time.time() * 1000)}",
            doc_code=f"UID-{uid[-6:]}",
            entity=sku.name,
            warehouse=warehouse,
            weight_debit=sku.catalog_weight,
            weight_credit=0,
            irr_debit=irr_debit,
            irr_credit=0,
            kind="receipt",
            locked=True,
            date_label="۱۴۰۵/۰۵/۱۵",
        )
    )

    inv = (
        db.query(InventoryLocation)
        .filter(InventoryLocation.location.in_([location, warehouse]))
        .order_by(InventoryLocation.location)
        .first()
    )
    # Prefer exact vault location used by warehouse UI
    inv = db.query(InventoryLocation).filter(InventoryLocation.location == location).first()
    if inv:
        inv.pieces += 1
        inv.weight_grams += sku.catalog_weight
        inv.available_grams += sku.catalog_weight

    append_event(
        db,
        event_type="uid.issued",
        aggregate_type="asset",
        aggregate_id=asset.id,
        actor_name=actor,
        actor_role="warehouse",
        payload={
            "uid": uid,
            "sku_id": sku.id,
            "karat": sku.karat,
            "weight_grams": sku.catalog_weight,
            "location": location,
            "sealed": True,
        },
    )
    append_audit(
        db,
        id=f"ae-{int(time.time() * 1000)}-uid",
        module="انبار",
        actor=actor,
        role="مسئول UID و انبار",
        action="صدور UID",
        entity=uid,
    )
    db.commit()
    db.refresh(asset)
    return asset


def create_price_lock(
    db: Session,
    *,
    retailer_name: str,
    agent_name: str,
    rate_per_gram: int | None = None,
) -> PriceLock:
    settings_row = get_settings_row(db)
    settings = get_settings()
    account = db.query(CreditAccount).filter(CreditAccount.retailer_name == retailer_name).first()
    if not account:
        raise HTTPException(404, "credit account not found for retailer")
    if account.blocked:
        raise HTTPException(400, "retailer credit is blocked")

    lock = PriceLock(
        id=f"pl-{int(time.time() * 1000)}",
        rate_per_gram=rate_per_gram or settings.live_gold_price_per_gram,
        agent_name=agent_name,
        retailer_name=retailer_name,
        expires_at=utcnow() + timedelta(minutes=settings_row.price_lock_minutes),
        used=False,
    )
    db.add(lock)
    append_event(
        db,
        event_type="price.locked",
        aggregate_type="price_lock",
        aggregate_id=lock.id,
        actor_name=agent_name,
        actor_role="agent",
        payload={
            "retailer": retailer_name,
            "rate_per_gram": lock.rate_per_gram,
            "expires_at": lock.expires_at.isoformat(),
            "minutes": settings_row.price_lock_minutes,
        },
    )
    db.commit()
    db.refresh(lock)
    return lock


def proforma_total(lines: list[dict], rate_per_gram: int) -> int:
    total = 0.0
    for line in lines:
        metal = line["weight_grams"] * rate_per_gram
        craft = metal * (line["craft_fee_pct"] / 100)
        total += metal + craft
    return int(round(total))


def issue_proforma(
    db: Session,
    *,
    retailer_name: str,
    agent_name: str,
    lock_id: str,
    lines: list[dict],
) -> Proforma:
    if not lines:
        raise HTTPException(400, "at least one line required")

    lock = db.get(PriceLock, lock_id)
    if not lock:
        raise HTTPException(404, "price lock not found")
    if lock.used:
        raise HTTPException(409, "price lock already used")
    if lock.retailer_name != retailer_name:
        raise HTTPException(400, "price lock retailer mismatch")
    lock_exp = lock.expires_at.replace(tzinfo=None) if lock.expires_at else datetime.min
    if lock_exp < datetime.utcnow():
        raise HTTPException(400, "price lock expired")

    account = db.query(CreditAccount).filter(CreditAccount.retailer_name == retailer_name).first()
    if not account:
        raise HTTPException(404, "credit account not found")
    if account.blocked:
        raise HTTPException(400, "retailer credit is blocked")

    # Resolve lines from assets (sealed weight is source of truth)
    resolved: list[dict] = []
    seen: set[str] = set()
    total_weight = 0.0
    for raw in lines:
        uid = str(raw["uid"]).strip().upper()
        if uid in seen:
            raise HTTPException(400, f"duplicate uid {uid}")
        seen.add(uid)
        asset = db.query(Asset).filter(Asset.uid == uid).first()
        if not asset:
            raise HTTPException(404, f"asset not found: {uid}")
        if asset.status != "available":
            raise HTTPException(400, f"asset {uid} not available (status={asset.status})")
        # Hard vault reservation: available grams must cover the piece
        inv = (
            db.query(InventoryLocation)
            .filter(InventoryLocation.location == asset.location)
            .first()
        )
        if inv is not None and inv.available_grams + 1e-9 < asset.weight_grams:
            raise HTTPException(
                400,
                f"موجودی قابل‌فروش در {asset.location} کافی نیست "
                f"(باقی {inv.available_grams:.2f}g، نیاز {asset.weight_grams:.2f}g)",
            )
        weight = asset.weight_grams
        raw_craft = raw.get("craft_fee_pct", asset.craft_fee_pct)
        craft = float(raw_craft if raw_craft is not None else 15.0)
        resolved.append(
            {
                "uid": asset.uid,
                "name": asset.name,
                "weight_grams": weight,
                "craft_fee_pct": craft,
                "location": asset.location,
            }
        )
        total_weight += weight

    remaining = account.ceiling_grams - account.used_grams
    if total_weight > remaining:
        raise HTTPException(
            400,
            f"insufficient credit: remaining {remaining:.1f}g, basket {total_weight:.1f}g",
        )

    settings = get_settings()
    rate = lock.rate_per_gram
    total_irt = proforma_total(resolved, rate)
    seq = db.query(Proforma).count() + 20
    code = f"PF-1405-{seq:03d}"
    pf = Proforma(
        id=f"pf-{int(time.time() * 1000)}",
        code=code,
        retailer_name=retailer_name,
        agent_name=agent_name,
        rate_per_gram=rate,
        lock_id=lock.id,
        lock_expires_at=lock.expires_at,
        status="issued",
        total_irr=total_irt,
        created_label="الان",
    )
    db.add(pf)
    for line in resolved:
        db.add(
            ProformaLine(
                proforma_id=pf.id,
                uid=line["uid"],
                name=line["name"],
                weight_grams=line["weight_grams"],
                craft_fee_pct=line["craft_fee_pct"],
            )
        )
        asset = db.query(Asset).filter(Asset.uid == line["uid"]).first()
        if asset:
            asset.status = "reserved"
            inv = (
                db.query(InventoryLocation)
                .filter(InventoryLocation.location == asset.location)
                .first()
            )
            if inv:
                inv.available_grams = max(0.0, inv.available_grams - asset.weight_grams)
                inv.reserved_grams += asset.weight_grams

    lock.used = True
    account.used_grams += total_weight
    account.used_irr += int(round(total_irt * settings.irt_to_irr))

    from app.models import DualLedgerEntry

    db.add(
        DualLedgerEntry(
            id=f"dl-{int(time.time() * 1000)}-pf",
            doc_code=code,
            entity=f"پیش‌فاکتور {retailer_name}",
            warehouse="گالری سیار",
            weight_debit=0,
            weight_credit=total_weight,
            irr_debit=0,
            irr_credit=int(round(total_irt * settings.irt_to_irr)),
            kind="sale",
            locked=True,
            date_label="۱۴۰۵/۰۵/۱۵",
        )
    )

    append_event(
        db,
        event_type="proforma.issued",
        aggregate_type="proforma",
        aggregate_id=pf.id,
        actor_name=agent_name,
        actor_role="agent",
        payload={
            "code": code,
            "retailer": retailer_name,
            "rate_per_gram": rate,
            "total_irt": total_irt,
            "total_weight": total_weight,
            "uids": [l["uid"] for l in resolved],
            "lock_id": lock.id,
        },
    )
    append_audit(
        db,
        id=f"ae-{int(time.time() * 1000)}-pf",
        module="فروش",
        actor=agent_name,
        role="ایجنت فروش",
        action="صدور پیش‌فاکتور",
        entity=code,
    )
    db.commit()
    db.refresh(pf)

    # Chain glue: proforma → Allocation rows (inventory domain)
    from app.domains.inventory.allocation import allocate

    for line in resolved:
        try:
            allocate(
                db,
                uid=line["uid"],
                actor=agent_name,
                proforma_id=pf.id,
                commit=True,
            )
        except HTTPException as exc:
            if exc.status_code not in (400, 409):
                raise

    return pf
