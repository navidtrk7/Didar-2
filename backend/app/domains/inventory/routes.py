"""Inventory HTTP routes — canonical domain API."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.domains import inventory as inventory_domain
from app.domains.permissions import require_permission
from app.models import User
from app.schemas import AssetOut, InventoryOut

router = APIRouter(prefix="/inventory", tags=["inventory"])


def _asset_out(a) -> AssetOut:
    from app.services.uploads import normalize_image_url

    return AssetOut(
        id=a.id,
        sku_id=a.sku_id,
        uid=a.uid,
        name=a.name,
        category=a.category,
        karat=a.karat,
        weight_grams=a.weight_grams,
        craft_fee_pct=a.craft_fee_pct,
        status=a.status,
        location=a.location,
        image_url=normalize_image_url(a.image_url),
        sealed=a.sealed,
        issued_at=a.issued_label,
        collection=a.collection,
        producer=a.producer,
        description=a.description,
        custodian=a.custodian,
    )


@router.post("/uids", response_model=AssetOut)
def issue_uid(
    sku_id: str = Query(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("inventory.uid_issue")),
):
    return _asset_out(
        inventory_domain.issue_uid(db, sku_id=sku_id, actor=user.name)
    )


@router.get("/stock", response_model=list[InventoryOut])
def stock(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("inventory.view")),
):
    rows = inventory_domain.list_stock_locations(db)
    return [
        InventoryOut(
            id=r.id,
            location=r.location,
            type=r.type,
            pieces=r.pieces,
            weight_grams=r.weight_grams,
            reserved_grams=r.reserved_grams,
            available_grams=r.available_grams,
            utilization=r.utilization,
        )
        for r in rows
    ]


@router.get("/uids", response_model=list[AssetOut])
def list_uids(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("inventory.view")),
    limit: int = Query(200, ge=1, le=500),
):
    return [
        _asset_out(a)
        for a in inventory_domain.list_sealed_assets(db, limit=limit)
    ]


class AllocationOut(BaseModel):
    id: str
    uid: str
    proforma_id: str | None = None
    order_id: str | None = None
    status: str
    actor: str
    created_at: str


class AllocateIn(BaseModel):
    uid: str
    proforma_id: str | None = None
    order_id: str | None = None


@router.get("/allocations", response_model=list[AllocationOut])
def get_allocations(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("inventory.view")),
    status: str | None = Query(None),
):
    return [
        AllocationOut(
            id=a.id,
            uid=a.uid,
            proforma_id=a.proforma_id,
            order_id=a.order_id,
            status=a.status,
            actor=a.actor,
            created_at=a.created_label,
        )
        for a in inventory_domain.list_allocations(db, status=status)
    ]


@router.post("/allocations", response_model=AllocationOut)
def post_allocation(
    body: AllocateIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("inventory.allocate")),
):
    a = inventory_domain.allocate(
        db,
        uid=body.uid,
        actor=user.name,
        proforma_id=body.proforma_id,
        order_id=body.order_id,
    )
    return AllocationOut(
        id=a.id,
        uid=a.uid,
        proforma_id=a.proforma_id,
        order_id=a.order_id,
        status=a.status,
        actor=a.actor,
        created_at=a.created_label,
    )


@router.post("/allocations/{allocation_id}/release", response_model=AllocationOut)
def release_allocation(
    allocation_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("inventory.allocate")),
):
    a = inventory_domain.release(db, allocation_id=allocation_id, actor=user.name)
    return AllocationOut(
        id=a.id,
        uid=a.uid,
        proforma_id=a.proforma_id,
        order_id=a.order_id,
        status=a.status,
        actor=a.actor,
        created_at=a.created_label,
    )


class CustodyOut(BaseModel):
    id: str
    uid: str
    from_custodian: str
    to_custodian: str
    from_location: str
    to_location: str
    actor: str
    created_at: str


class CustodyIn(BaseModel):
    uid: str
    to_custodian: str
    to_location: str


@router.get("/custody", response_model=list[CustodyOut])
def get_custody(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("inventory.view")),
):
    return [
        CustodyOut(
            id=t.id,
            uid=t.uid,
            from_custodian=t.from_custodian,
            to_custodian=t.to_custodian,
            from_location=t.from_location,
            to_location=t.to_location,
            actor=t.actor,
            created_at=t.created_label,
        )
        for t in inventory_domain.list_transfers(db)
    ]


@router.post("/custody", response_model=CustodyOut)
def post_custody(
    body: CustodyIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("inventory.custody")),
):
    t = inventory_domain.transfer_custody(
        db,
        uid=body.uid,
        to_custodian=body.to_custodian,
        to_location=body.to_location,
        actor=user.name,
    )
    return CustodyOut(
        id=t.id,
        uid=t.uid,
        from_custodian=t.from_custodian,
        to_custodian=t.to_custodian,
        from_location=t.from_location,
        to_location=t.to_location,
        actor=t.actor,
        created_at=t.created_label,
    )


class DiscrepancyOut(BaseModel):
    id: str
    uid: str
    expected_weight: float
    measured_weight: float
    delta_grams: float
    reason: str
    status: str
    actor: str
    resolution_notes: str
    created_at: str
    resolved_at: str | None = None


class DiscrepancyIn(BaseModel):
    uid: str
    measured_weight: float
    reason: str = ""


class DiscrepancyResolveIn(BaseModel):
    resolution: str = "resolved"
    notes: str = ""
    accept_measured: bool = False


@router.get("/discrepancies", response_model=list[DiscrepancyOut])
def get_discrepancies(
    db: Session = Depends(get_db),
    _user: User = Depends(require_permission("inventory.view")),
    status: str | None = Query(None),
):
    return [
        DiscrepancyOut(
            id=d.id,
            uid=d.uid,
            expected_weight=d.expected_weight,
            measured_weight=d.measured_weight,
            delta_grams=d.delta_grams,
            reason=d.reason,
            status=d.status,
            actor=d.actor,
            resolution_notes=d.resolution_notes,
            created_at=d.created_label,
            resolved_at=d.resolved_label,
        )
        for d in inventory_domain.list_discrepancies(db, status=status)
    ]


@router.post("/discrepancies", response_model=DiscrepancyOut)
def post_discrepancy(
    body: DiscrepancyIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("inventory.custody")),
):
    d = inventory_domain.open_discrepancy(
        db,
        uid=body.uid,
        measured_weight=body.measured_weight,
        reason=body.reason,
        actor=user.name,
    )
    return DiscrepancyOut(
        id=d.id,
        uid=d.uid,
        expected_weight=d.expected_weight,
        measured_weight=d.measured_weight,
        delta_grams=d.delta_grams,
        reason=d.reason,
        status=d.status,
        actor=d.actor,
        resolution_notes=d.resolution_notes,
        created_at=d.created_label,
        resolved_at=d.resolved_label,
    )


@router.post("/discrepancies/{discrepancy_id}/resolve", response_model=DiscrepancyOut)
def post_resolve_discrepancy(
    discrepancy_id: str,
    body: DiscrepancyResolveIn,
    db: Session = Depends(get_db),
    user: User = Depends(require_permission("inventory.custody")),
):
    d = inventory_domain.resolve_discrepancy(
        db,
        discrepancy_id=discrepancy_id,
        resolution=body.resolution,
        actor=user.name,
        notes=body.notes,
        accept_measured=body.accept_measured,
    )
    return DiscrepancyOut(
        id=d.id,
        uid=d.uid,
        expected_weight=d.expected_weight,
        measured_weight=d.measured_weight,
        delta_grams=d.delta_grams,
        reason=d.reason,
        status=d.status,
        actor=d.actor,
        resolution_notes=d.resolution_notes,
        created_at=d.created_label,
        resolved_at=d.resolved_label,
    )
