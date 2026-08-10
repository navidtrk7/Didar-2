"""Finance domain — credit / ledger / producer settlement."""

from __future__ import annotations

import time

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import get_settings
from app.integrations.zarrin import get_zarrin_client
from app.models import (
    Adjustment,
    CreditAccount,
    CreditDocument,
    DualLedgerEntry,
    ProducerSettlement,
    SystemSettingsRow,
)
from app.services import ops
from app.services.events import append_event, now_label


def quote_producer_settlement_irr(db: Session, *, weight_grams: float) -> int:
    """Internal Didar suggestion from live rate — Zarrin remains SoR for gold books."""
    settings = get_settings()
    row = db.get(SystemSettingsRow, 1)
    rate = (
        int(row.live_rate_override)
        if row and row.live_rate_override
        else int(settings.live_gold_price_per_gram)
    )
    return max(0, int(round(float(weight_grams) * rate * settings.irt_to_irr)))


def list_ledger(db: Session) -> list[DualLedgerEntry]:
    return db.query(DualLedgerEntry).order_by(DualLedgerEntry.created_at.desc()).all()


def list_credit_accounts(db: Session) -> list[CreditAccount]:
    return db.query(CreditAccount).all()


def list_credit_documents(db: Session) -> list[CreditDocument]:
    return db.query(CreditDocument).all()


def list_adjustments(db: Session) -> list[Adjustment]:
    return db.query(Adjustment).order_by(Adjustment.created_at.desc()).all()


def create_adjustment(db: Session, **kwargs):
    return ops.create_adjustment(db, **kwargs)


def settle_document(db: Session, **kwargs):
    return ops.settle_credit_document(db, **kwargs)


def create_credit_document(db: Session, **kwargs):
    return ops.create_credit_document(db, **kwargs)


def list_producer_settlements(db: Session) -> list[ProducerSettlement]:
    return (
        db.query(ProducerSettlement)
        .order_by(ProducerSettlement.created_at.desc())
        .all()
    )


def create_producer_settlement(
    db: Session,
    *,
    producer: str,
    weight_grams: float,
    amount_irr: int,
    period_label: str,
    actor: str,
) -> ProducerSettlement:
    if amount_irr <= 0:
        amount_irr = quote_producer_settlement_irr(db, weight_grams=weight_grams)
    count = db.query(ProducerSettlement).count() + 1001
    row = ProducerSettlement(
        id=f"ps-{int(time.time() * 1000)}",
        code=f"PS-{count}",
        producer=producer,
        weight_grams=weight_grams,
        amount_irr=amount_irr,
        status="pending",
        period_label=period_label,
        created_label=now_label(),
    )
    db.add(row)
    append_event(
        db,
        event_type="finance.producer_settlement_created",
        aggregate_type="producer_settlement",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role="finance",
        payload={
            "code": row.code,
            "producer": producer,
            "amount_irr": amount_irr,
            "weight_grams": weight_grams,
        },
    )
    db.commit()
    db.refresh(row)
    return row


def settle_producer(
    db: Session,
    *,
    settlement_id: str,
    actor: str,
) -> ProducerSettlement:
    row = db.get(ProducerSettlement, settlement_id)
    if not row:
        raise HTTPException(404, "تسویه یافت نشد")
    if row.status == "settled":
        raise HTTPException(409, "قبلاً تسویه شده")

    client = get_zarrin_client()
    try:
        zres = client.post_producer_settlement(
            external_id=row.code,
            producer=row.producer,
            weight_grams=row.weight_grams,
            amount_irr=row.amount_irr,
            period_label=row.period_label,
        )
    except RuntimeError as exc:
        raise HTTPException(502, f"زرین در دسترس نیست: {exc}") from exc
    if not zres.ok:
        raise HTTPException(502, f"زرین تسویه را نپذیرفت: {zres.status}")

    row.status = "settled"
    row.settled_label = now_label()
    row.zarrin_ref = zres.zarrin_id or zres.ledger_ref
    row.zarrin_status = zres.status

    ledger = DualLedgerEntry(
        id=f"dl-{int(time.time() * 1000)}",
        doc_code=row.code,
        entity=row.producer,
        warehouse="تسویه تولیدکننده",
        weight_debit=0,
        weight_credit=float(row.weight_grams),
        irr_debit=0,
        irr_credit=int(row.amount_irr),
        kind="producer_settlement",
        locked=True,
        date_label=now_label(),
    )
    db.add(ledger)
    append_event(
        db,
        event_type="finance.producer_settlement_paid",
        aggregate_type="producer_settlement",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role="finance",
        payload={
            "code": row.code,
            "producer": row.producer,
            "zarrin_id": zres.zarrin_id,
            "zarrin_status": zres.status,
            "zarrin_mode": zres.mode,
            "ledger_ref": zres.ledger_ref,
        },
    )
    db.commit()
    db.refresh(row)
    return row
