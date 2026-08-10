"""Inventory domain — UID, stock, allocation, custody."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.domains.inventory.allocation import allocate, list_allocations, release
from app.domains.inventory.custody import (
    list_discrepancies,
    list_transfers,
    open_discrepancy,
    resolve_discrepancy,
    transfer_custody,
)
from app.models import Asset, InventoryLocation
from app.services import slice_b


def issue_uid(db: Session, *, sku_id: str, actor: str) -> Asset:
    return slice_b.issue_uid(db, sku_id=sku_id, actor=actor)


def list_stock_locations(db: Session) -> list[InventoryLocation]:
    return db.query(InventoryLocation).order_by(InventoryLocation.location).all()


def list_sealed_assets(db: Session, *, limit: int = 200) -> list[Asset]:
    return (
        db.query(Asset)
        .filter(Asset.sealed.is_(True))
        .order_by(Asset.created_at.desc())
        .limit(limit)
        .all()
    )


__all__ = [
    "allocate",
    "issue_uid",
    "list_allocations",
    "list_discrepancies",
    "list_sealed_assets",
    "list_stock_locations",
    "list_transfers",
    "open_discrepancy",
    "release",
    "resolve_discrepancy",
    "transfer_custody",
]
