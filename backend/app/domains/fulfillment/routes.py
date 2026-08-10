"""Fulfillment HTTP routes — canonical domain API."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.domains import fulfillment as fulfillment_domain
from app.domains.permissions import require_permission
from app.models import User

router = APIRouter(prefix="/fulfillment", tags=["fulfillment"])


class DeliveryOut(BaseModel):
    id: str
    code: str
    agent: str
    from_location: str
    to_location: str
    pieces: int
    weight_grams: float
    status: str
    otp_required: bool
    scheduled_at: str
    stage: str
    uids: list[str] = []


class CreateIn(BaseModel):
    proforma_id: str
    from_location: str = "خزانه تهران-الف"


class OtpIn(BaseModel):
    otp: str = "1234"


def _out(row) -> DeliveryOut:
    status = row.status
    return DeliveryOut(
        id=row.id,
        code=row.code,
        agent=row.agent,
        from_location=row.from_location,
        to_location=row.to_location,
        pieces=row.pieces,
        weight_grams=row.weight_grams,
        status=status,
        otp_required=row.otp_required,
        scheduled_at=row.scheduled_label,
        stage=fulfillment_domain.normalize_status(status),
        uids=list(row.uids or []),
    )


@router.get("/shipments", response_model=list[DeliveryOut])
def list_shipments(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("fulfillment.view")),
    stage: str | None = Query(None),
):
    rows = (
        fulfillment_domain.list_by_stage(db, stage)
        if stage
        else fulfillment_domain.list_deliveries(db)
    )
    return [_out(r) for r in rows]


@router.post("/shipments", response_model=DeliveryOut)
def create_shipment(
    body: CreateIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("fulfillment.deliver")),
):
    row = fulfillment_domain.create_from_proforma(
        db,
        proforma_id=body.proforma_id,
        agent=user.name,
        from_location=body.from_location,
    )
    return _out(row)


@router.post("/shipments/{delivery_id}/advance", response_model=DeliveryOut)
def advance(
    delivery_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("fulfillment.stage")),
):
    row = fulfillment_domain.advance_stage(
        db,
        delivery_id=delivery_id,
        actor=user.name,
        actor_role=user.role,
    )
    return _out(row)


@router.post("/shipments/{delivery_id}/confirm-otp", response_model=DeliveryOut)
def confirm_otp(
    delivery_id: str,
    body: OtpIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("fulfillment.deliver")),
):
    row = fulfillment_domain.confirm_otp(
        db, delivery_id=delivery_id, otp=body.otp, actor=user.name
    )
    return _out(row)
