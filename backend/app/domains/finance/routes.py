"""Finance HTTP routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.domains import finance as finance_domain
from app.domains.permissions import require_permission
from app.models import User
from app.schemas import CreditAccountOut, DualLedgerOut

router = APIRouter(prefix="/finance", tags=["finance"])


class AdjustmentOut(BaseModel):
    id: str
    code: str
    reason: str
    weight_delta: float
    irr_delta: int
    created_by: str
    created_at: str


class AdjustmentIn(BaseModel):
    reason: str
    weight_delta: float
    irr_delta: int


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


class CreditSettleIn(BaseModel):
    channel: str = "phone"
    notes: str = ""


class CreditDealIn(BaseModel):
    retailer: str
    amount_irr: int = 0
    weight_grams: float = 0
    due_date: str = ""
    origin_channel: str = "verbal"
    notes: str = ""


def _doc_out(d) -> CreditDocOut:
    return CreditDocOut(
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


@router.get("/trust-meta")
def trust_meta(_user: User = Depends(require_permission("finance.view"))):
    from app.domains.finance.trust import SETTLEMENT_CHANNELS, TRUST_TIERS

    return {
        "settlement_channels": [
            {"id": k, "label_fa": v} for k, v in SETTLEMENT_CHANNELS.items()
        ],
        "trust_tiers": [{"id": k, "label_fa": v} for k, v in TRUST_TIERS.items()],
    }


@router.get("/ledger", response_model=list[DualLedgerOut])
def ledger(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("finance.ledger")),
):
    return [
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
        for e in finance_domain.list_ledger(db)
    ]


@router.get("/credit-accounts", response_model=list[CreditAccountOut])
def credits(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("finance.view")),
):
    return [
        CreditAccountOut(
            id=a.id,
            retailer=a.retailer_name,
            ceiling_grams=a.ceiling_grams,
            used_grams=a.used_grams,
            ceiling_irr=a.ceiling_irr,
            used_irr=a.used_irr,
            overdue_grams=a.overdue_grams,
            blocked=a.blocked,
        )
        for a in finance_domain.list_credit_accounts(db)
    ]


@router.get("/credit-documents", response_model=list[CreditDocOut])
def credit_docs(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("finance.credit")),
):
    return [_doc_out(d) for d in finance_domain.list_credit_documents(db)]


@router.post("/credit-documents", response_model=CreditDocOut)
def open_trust_deal(
    body: CreditDealIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("finance.credit")),
):
    d = finance_domain.create_credit_document(
        db,
        retailer=body.retailer,
        amount_irr=body.amount_irr,
        weight_grams=body.weight_grams,
        due_date=body.due_date,
        origin_channel=body.origin_channel,
        notes=body.notes,
        actor=user.name,
    )
    return _doc_out(d)


@router.post("/adjustments", response_model=AdjustmentOut)
def post_adjustment(
    body: AdjustmentIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("finance.ledger")),
):
    row = finance_domain.create_adjustment(
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


@router.post("/credit-documents/{document_id}/settle", response_model=CreditDocOut)
def settle(
    document_id: str,
    body: CreditSettleIn | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("finance.credit")),
):
    payload = body or CreditSettleIn()
    d = finance_domain.settle_document(
        db,
        document_id=document_id,
        actor=user.name,
        channel=payload.channel,
        notes=payload.notes,
    )
    return _doc_out(d)


class SettlementOut(BaseModel):
    id: str
    code: str
    producer: str
    weight_grams: float
    amount_irr: int
    status: str
    period_label: str
    created_at: str
    settled_at: str | None = None
    zarrin_ref: str | None = None
    zarrin_status: str | None = None


class SettlementIn(BaseModel):
    producer: str
    weight_grams: float
    amount_irr: int = 0
    period_label: str = "ماه جاری"


class SettlementQuoteOut(BaseModel):
    weight_grams: float
    amount_irr: int
    note: str


@router.get("/producer-settlement-quote", response_model=SettlementQuoteOut)
def settlement_quote(
    weight_grams: float,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("finance.settlement")),
):
    amount = finance_domain.quote_producer_settlement_irr(
        db, weight_grams=weight_grams
    )
    return SettlementQuoteOut(
        weight_grams=weight_grams,
        amount_irr=amount,
        note="پیشنهاد داخلی دیدار از نرخ زنده — مرز زرین جداست",
    )


@router.get("/producer-settlements", response_model=list[SettlementOut])
def list_settlements(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("finance.settlement")),
):
    return [
        SettlementOut(
            id=s.id,
            code=s.code,
            producer=s.producer,
            weight_grams=s.weight_grams,
            amount_irr=s.amount_irr,
            status=s.status,
            period_label=s.period_label,
            created_at=s.created_label,
            settled_at=s.settled_label,
            zarrin_ref=s.zarrin_ref,
            zarrin_status=s.zarrin_status,
        )
        for s in finance_domain.list_producer_settlements(db)
    ]


@router.post("/producer-settlements", response_model=SettlementOut)
def create_settlement(
    body: SettlementIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("finance.settlement")),
):
    s = finance_domain.create_producer_settlement(
        db,
        producer=body.producer,
        weight_grams=body.weight_grams,
        amount_irr=body.amount_irr,
        period_label=body.period_label,
        actor=user.name,
    )
    return SettlementOut(
        id=s.id,
        code=s.code,
        producer=s.producer,
        weight_grams=s.weight_grams,
        amount_irr=s.amount_irr,
        status=s.status,
        period_label=s.period_label,
        created_at=s.created_label,
        settled_at=s.settled_label,
        zarrin_ref=s.zarrin_ref,
        zarrin_status=s.zarrin_status,
    )


@router.post("/producer-settlements/{settlement_id}/settle", response_model=SettlementOut)
def pay_settlement(
    settlement_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("finance.settlement")),
):
    s = finance_domain.settle_producer(
        db, settlement_id=settlement_id, actor=user.name
    )
    return SettlementOut(
        id=s.id,
        code=s.code,
        producer=s.producer,
        weight_grams=s.weight_grams,
        amount_irr=s.amount_irr,
        status=s.status,
        period_label=s.period_label,
        created_at=s.created_label,
        settled_at=s.settled_label,
        zarrin_ref=s.zarrin_ref,
        zarrin_status=s.zarrin_status,
    )
