"""Fulfillment domain — pick → pack → handover → delivery/OTP."""

from __future__ import annotations

import time

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Asset, Delivery, Proforma
from app.services import ops
from app.services.events import append_audit, append_event, now_label

NEXT_STAGE: dict[str, str] = {
    "scheduled": "picking",
    "picking": "packing",
    "packing": "handover",
    "handover": "awaiting_otp",
    "en_route": "awaiting_otp",
}


def normalize_status(status: str) -> str:
    if status == "en_route":
        return "awaiting_otp"
    if status == "scheduled":
        return "picking"
    return status


def _tid() -> int:
    return int(time.time() * 1000)


def list_deliveries(db: Session) -> list[Delivery]:
    return db.query(Delivery).order_by(Delivery.code.desc()).all()


def list_by_stage(db: Session, stage: str) -> list[Delivery]:
    target = normalize_status(stage)
    return [r for r in list_deliveries(db) if normalize_status(r.status) == target]


def create_from_order(
    db: Session,
    *,
    order_id: str,
    agent: str,
    uids: list[str],
    to_location: str,
    from_location: str = "خزانه تهران-الف",
    commit: bool = True,
) -> Delivery:
    """Start fulfillment from a retailer order + allocated UIDs."""
    from app.models import Order

    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "order not found")
    if not uids:
        raise HTTPException(400, "order has no UIDs to ship")

    assets = []
    weight = 0.0
    for uid in uids:
        asset = db.query(Asset).filter(Asset.uid == uid).first()
        if not asset:
            raise HTTPException(404, f"asset not found: {uid}")
        assets.append(asset)
        weight += asset.weight_grams

    count = db.query(Delivery).count() + 8850
    code = f"DLV-{count}"
    row = Delivery(
        id=f"dlv-{_tid()}",
        code=code,
        agent=agent,
        from_location=from_location,
        to_location=to_location or order.retailer,
        pieces=len(uids),
        weight_grams=weight,
        status="picking",
        otp_required=True,
        scheduled_label=now_label(),
        proforma_id=None,
        uids=uids,
    )
    db.add(row)
    for asset in assets:
        if asset.status == "available":
            asset.status = "reserved"
    append_event(
        db,
        event_type="fulfillment.created",
        aggregate_type="delivery",
        aggregate_id=row.id,
        actor_name=agent,
        actor_role="system",
        payload={
            "code": code,
            "order": order.code,
            "stage": "picking",
            "uids": uids,
        },
    )
    order.status = "picking"
    if commit:
        db.commit()
        db.refresh(row)
    else:
        db.flush()
    return row


def create_from_proforma(
    db: Session,
    *,
    proforma_id: str,
    agent: str,
    from_location: str = "خزانه تهران-الف",
) -> Delivery:
    """Start at picking — assets stay reserved until handover → in_transit."""
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
        id=f"dlv-{_tid()}",
        code=code,
        agent=agent,
        from_location=from_location,
        to_location=pf.retailer_name,
        pieces=len(uids),
        weight_grams=weight,
        status="picking",
        otp_required=True,
        scheduled_label=now_label(),
        proforma_id=pf.id,
        uids=uids,
    )
    db.add(row)
    for uid in uids:
        asset = db.query(Asset).filter(Asset.uid == uid).first()
        if asset and asset.status == "available":
            asset.status = "reserved"
    append_event(
        db,
        event_type="fulfillment.created",
        aggregate_type="delivery",
        aggregate_id=row.id,
        actor_name=agent,
        actor_role="agent",
        payload={
            "code": code,
            "proforma": pf.code,
            "stage": "picking",
            "uids": uids,
        },
    )
    db.commit()
    db.refresh(row)
    return row


def advance_stage(
    db: Session,
    *,
    delivery_id: str,
    actor: str,
    actor_role: str = "warehouse",
) -> Delivery:
    row = db.get(Delivery, delivery_id)
    if not row:
        raise HTTPException(404, "delivery not found")
    if row.status in ("completed", "failed"):
        raise HTTPException(409, "delivery is closed")

    current = row.status
    nxt = NEXT_STAGE.get(current)
    if not nxt:
        raise HTTPException(400, f"نمی‌توان مرحله «{current}» را جلو برد")

    row.status = nxt

    if nxt == "awaiting_otp":
        for uid in list(row.uids or []):
            asset = db.query(Asset).filter(Asset.uid == uid).first()
            if asset:
                asset.status = "in_transit"

    append_event(
        db,
        event_type="fulfillment.advanced",
        aggregate_type="delivery",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role=actor_role,
        payload={"code": row.code, "from": current, "to": nxt},
    )
    append_audit(
        db,
        id=f"ae-{_tid()}-ff",
        module="تحقق سفارش",
        actor=actor,
        role=actor_role,
        action=f"پیشبرد به {nxt}",
        entity=row.code,
    )
    db.commit()
    db.refresh(row)
    return row


def confirm_otp(
    db: Session,
    *,
    delivery_id: str,
    otp: str,
    actor: str,
) -> Delivery:
    row = db.get(Delivery, delivery_id)
    if not row:
        raise HTTPException(404, "delivery not found")
    if row.status in ("handover", "en_route"):
        row.status = "awaiting_otp"
        db.flush()
    return ops.confirm_delivery_otp(
        db, delivery_id=delivery_id, otp=otp, actor=actor
    )
