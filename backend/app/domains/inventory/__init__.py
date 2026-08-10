"""Inventory domain package."""

from app.domains.inventory.service import (
    allocate,
    issue_uid,
    list_allocations,
    list_discrepancies,
    list_sealed_assets,
    list_stock_locations,
    list_transfers,
    open_discrepancy,
    release,
    resolve_discrepancy,
    transfer_custody,
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
