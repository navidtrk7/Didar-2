"""Allocation — reserve UID for commerce documents."""

from __future__ import annotations

import time

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Allocation, Asset
from app.services.events import append_event, now_label


def list_allocations(db: Session, *, status: str | None = None) -> list[Allocation]:
    q = db.query(Allocation).order_by(Allocation.created_at.desc())
    if status:
        q = q.filter(Allocation.status == status)
    return q.all()


def allocate(
    db: Session,
    *,
    uid: str,
    actor: str,
    proforma_id: str | None = None,
    order_id: str | None = None,
    commit: bool = True,
) -> Allocation:
    asset = db.query(Asset).filter(Asset.uid.ilike(uid.strip())).first()
    if not asset:
        raise HTTPException(404, "UID یافت نشد")
    existing = (
        db.query(Allocation)
        .filter(Allocation.uid == asset.uid, Allocation.status == "active")
        .first()
    )
    if existing:
        # Idempotent link of commerce docs onto the same active allocation
        if proforma_id and not existing.proforma_id:
            existing.proforma_id = proforma_id
        if order_id and not existing.order_id:
            existing.order_id = order_id
        if commit:
            db.commit()
            db.refresh(existing)
        return existing

    if asset.status != "available":
        raise HTTPException(
            400, f"فقط UID آزاد قابل تخصیص است؛ وضعیت فعلی: {asset.status}"
        )

    asset.status = "reserved"
    row = Allocation(
        id=f"alloc-{int(time.time() * 1000)}",
        uid=asset.uid,
        proforma_id=proforma_id,
        order_id=order_id,
        status="active",
        actor=actor,
        created_label=now_label(),
    )
    db.add(row)
    append_event(
        db,
        event_type="inventory.allocated",
        aggregate_type="allocation",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role="warehouse",
        payload={"uid": asset.uid, "proforma_id": proforma_id, "order_id": order_id},
    )
    if commit:
        db.commit()
        db.refresh(row)
    else:
        db.flush()
    return row


def release(db: Session, *, allocation_id: str, actor: str) -> Allocation:
    row = db.get(Allocation, allocation_id)
    if not row:
        raise HTTPException(404, "تخصیص یافت نشد")
    if row.status != "active":
        raise HTTPException(409, "تخصیص فعال نیست")
    row.status = "released"
    asset = db.query(Asset).filter(Asset.uid == row.uid).first()
    if asset and asset.status == "reserved":
        asset.status = "available"
    append_event(
        db,
        event_type="inventory.allocation_released",
        aggregate_type="allocation",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role="warehouse",
        payload={"uid": row.uid},
    )
    db.commit()
    db.refresh(row)
    return row
