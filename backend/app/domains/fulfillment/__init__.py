"""Fulfillment domain package."""

from app.domains.fulfillment.service import (
    advance_stage,
    confirm_otp,
    create_from_proforma,
    list_by_stage,
    list_deliveries,
    normalize_status,
)

__all__ = [
    "advance_stage",
    "confirm_otp",
    "create_from_proforma",
    "list_by_stage",
    "list_deliveries",
    "normalize_status",
]
