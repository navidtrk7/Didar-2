"""Custody transfer + discrepancy helpers for Inventory domain."""

from __future__ import annotations

import time

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Asset, CustodyDiscrepancy, CustodyTransfer
from app.services.events import append_event, now_label


def list_transfers(db: Session, *, limit: int = 100) -> list[CustodyTransfer]:
    return (
        db.query(CustodyTransfer)
        .order_by(CustodyTransfer.created_at.desc())
        .limit(limit)
        .all()
    )


def transfer_custody(
    db: Session,
    *,
    uid: str,
    to_custodian: str,
    to_location: str,
    actor: str,
) -> CustodyTransfer:
    asset = db.query(Asset).filter(Asset.uid.ilike(uid.strip())).first()
    if not asset:
        raise HTTPException(404, "UID یافت نشد")
    if asset.status == "discrepancy":
        raise HTTPException(400, "UID در وضعیت اختلاف فیزیکی قفل است")
    if not to_custodian.strip() or not to_location.strip():
        raise HTTPException(400, "مقصد حضانت و موقعیت الزامی است")

    row = CustodyTransfer(
        id=f"ct-{int(time.time() * 1000)}",
        uid=asset.uid,
        from_custodian=asset.custodian or "—",
        to_custodian=to_custodian.strip(),
        from_location=asset.location,
        to_location=to_location.strip(),
        actor=actor,
        created_label=now_label(),
    )
    asset.custodian = to_custodian.strip()
    asset.location = to_location.strip()
    db.add(row)
    append_event(
        db,
        event_type="inventory.custody_transferred",
        aggregate_type="custody",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role="warehouse",
        payload={
            "uid": asset.uid,
            "from": row.from_custodian,
            "to": row.to_custodian,
            "location": row.to_location,
        },
    )
    db.commit()
    db.refresh(row)
    return row


def list_discrepancies(
    db: Session, *, status: str | None = None, limit: int = 100
) -> list[CustodyDiscrepancy]:
    q = db.query(CustodyDiscrepancy).order_by(CustodyDiscrepancy.created_at.desc())
    if status:
        q = q.filter(CustodyDiscrepancy.status == status)
    return q.limit(limit).all()


def open_discrepancy(
    db: Session,
    *,
    uid: str,
    measured_weight: float,
    reason: str,
    actor: str,
) -> CustodyDiscrepancy:
    asset = db.query(Asset).filter(Asset.uid.ilike(uid.strip())).first()
    if not asset:
        raise HTTPException(404, "UID یافت نشد")
    open_row = (
        db.query(CustodyDiscrepancy)
        .filter(
            CustodyDiscrepancy.uid == asset.uid,
            CustodyDiscrepancy.status == "open",
        )
        .first()
    )
    if open_row:
        raise HTTPException(409, "اختلاف باز برای این UID وجود دارد")
    if measured_weight <= 0:
        raise HTTPException(400, "وزن اندازه‌گیری‌شده نامعتبر است")

    delta = float(measured_weight) - float(asset.weight_grams)
    row = CustodyDiscrepancy(
        id=f"cd-{int(time.time() * 1000)}",
        uid=asset.uid,
        expected_weight=float(asset.weight_grams),
        measured_weight=float(measured_weight),
        delta_grams=delta,
        reason=reason.strip() or "اختلاف وزن فیزیکی",
        status="open",
        actor=actor,
        created_label=now_label(),
    )
    # Freeze movement until resolved
    asset.status = "discrepancy"
    db.add(row)
    append_event(
        db,
        event_type="inventory.discrepancy_opened",
        aggregate_type="custody_discrepancy",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role="warehouse",
        payload={
            "uid": asset.uid,
            "expected": row.expected_weight,
            "measured": row.measured_weight,
            "delta": delta,
        },
    )
    db.commit()
    db.refresh(row)
    return row


def resolve_discrepancy(
    db: Session,
    *,
    discrepancy_id: str,
    resolution: str,
    actor: str,
    notes: str = "",
    accept_measured: bool = False,
) -> CustodyDiscrepancy:
    if resolution not in ("resolved", "written_off"):
        raise HTTPException(400, "resolution must be resolved|written_off")
    row = db.get(CustodyDiscrepancy, discrepancy_id)
    if not row:
        raise HTTPException(404, "پرونده اختلاف یافت نشد")
    if row.status != "open":
        raise HTTPException(409, "پرونده اختلاف باز نیست")

    asset = db.query(Asset).filter(Asset.uid == row.uid).first()
    row.status = resolution
    row.resolution_notes = notes.strip()
    row.resolved_label = now_label()
    if asset and asset.status == "discrepancy":
        if accept_measured and resolution == "resolved":
            asset.weight_grams = float(row.measured_weight)
        asset.status = "available"
    append_event(
        db,
        event_type="inventory.discrepancy_resolved",
        aggregate_type="custody_discrepancy",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role="warehouse",
        payload={
            "uid": row.uid,
            "resolution": resolution,
            "accept_measured": accept_measured,
        },
    )
    db.commit()
    db.refresh(row)
    return row
