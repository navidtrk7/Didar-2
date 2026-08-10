"""Service HTTP routes — warranty / return / buyback / secondary."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.domains import service as service_domain
from app.domains.permissions import require_permission
from app.models import User

router = APIRouter(prefix="/service", tags=["service"])


class WarrantyLookupOut(BaseModel):
    uid: str
    name: str
    active: bool
    open_claims: int
    message: str
    status: str | None = None


class ClaimOut(BaseModel):
    id: str
    uid: str
    claimant: str
    status: str
    notes: str
    created_at: str


class ClaimIn(BaseModel):
    uid: str
    notes: str = ""


class CaseOut(BaseModel):
    id: str
    uid: str
    kind: str
    status: str
    claimant: str
    notes: str
    amount_irr: int
    created_at: str
    zarrin_ref: str | None = None
    zarrin_status: str | None = None


class CaseIn(BaseModel):
    uid: str
    kind: str
    notes: str = ""
    amount_irr: int = Field(default=0, ge=0)


def _case_out(c) -> CaseOut:
    return CaseOut(
        id=c.id,
        uid=c.uid,
        kind=c.kind,
        status=c.status,
        claimant=c.claimant,
        notes=c.notes,
        amount_irr=c.amount_irr,
        created_at=c.created_label,
        zarrin_ref=getattr(c, "zarrin_ref", None),
        zarrin_status=getattr(c, "zarrin_status", None),
    )


@router.get("/warranty/{uid}", response_model=WarrantyLookupOut)
def warranty_lookup(
    uid: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("service.warranty")),
):
    return WarrantyLookupOut(**service_domain.lookup_warranty(db, uid=uid))


@router.get("/claims", response_model=list[ClaimOut])
def claims(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("service.view")),
):
    return [
        ClaimOut(
            id=c.id,
            uid=c.uid,
            claimant=c.claimant,
            status=c.status,
            notes=c.notes,
            created_at=c.created_label,
        )
        for c in service_domain.list_claims(db)
    ]


@router.post("/claims", response_model=ClaimOut)
def open_claim(
    body: ClaimIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("service.warranty")),
):
    c = service_domain.open_claim(
        db, uid=body.uid, claimant=user.name, notes=body.notes
    )
    return ClaimOut(
        id=c.id,
        uid=c.uid,
        claimant=c.claimant,
        status=c.status,
        notes=c.notes,
        created_at=c.created_label,
    )


class BuybackQuoteOut(BaseModel):
    uid: str
    name: str
    weight_grams: float
    karat: int
    craft_fee_pct: float
    rate_per_gram: int
    metal_irr: int
    craft_irr: int
    offer_irr: int
    note: str


@router.get("/buyback-quote/{uid}", response_model=BuybackQuoteOut)
def buyback_quote(
    uid: str,
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("service.lifecycle")),
):
    return BuybackQuoteOut(**service_domain.quote_buyback(db, uid=uid))


@router.get("/cases", response_model=list[CaseOut])
def list_cases(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("service.view")),
    kind: str | None = Query(None),
):
    return [_case_out(c) for c in service_domain.list_cases(db, kind=kind)]


@router.post("/cases", response_model=CaseOut)
def open_case(
    body: CaseIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("service.lifecycle")),
):
    return _case_out(
        service_domain.open_case(
            db,
            uid=body.uid,
            kind=body.kind,
            claimant=user.name,
            notes=body.notes,
            amount_irr=body.amount_irr,
        )
    )


@router.post("/cases/{case_id}/close", response_model=CaseOut)
def close_case(
    case_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("service.lifecycle")),
):
    return _case_out(service_domain.close_case(db, case_id=case_id, actor=user.name))
