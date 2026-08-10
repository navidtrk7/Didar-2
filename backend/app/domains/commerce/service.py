"""Commerce domain — gallery / order / pricing / proforma / promotion."""

from __future__ import annotations

import time

from sqlalchemy.orm import Session

from app.models import CraftFeeRule, Order, Proforma, Promotion, RateRequest
from app.services import ops, slice_b
from app.services.events import now_label


def list_proformas(db: Session) -> list[Proforma]:
    return db.query(Proforma).order_by(Proforma.created_at.desc()).all()


def list_orders(db: Session) -> list[Order]:
    return db.query(Order).order_by(Order.created_label.desc()).all()


def list_craft_rules(db: Session) -> list[CraftFeeRule]:
    return db.query(CraftFeeRule).all()


def list_rate_requests(db: Session) -> list[RateRequest]:
    return db.query(RateRequest).all()


def create_price_lock(db: Session, **kwargs):
    return slice_b.create_price_lock(db, **kwargs)


def issue_proforma(db: Session, **kwargs):
    return slice_b.issue_proforma(db, **kwargs)


def add_rate_request(db: Session, **kwargs):
    return ops.add_rate_request(db, **kwargs)


def decide_rate_request(db: Session, **kwargs):
    return ops.decide_rate_request(db, **kwargs)


def add_craft_rule(db: Session, **kwargs):
    return ops.add_craft_rule(db, **kwargs)


def toggle_craft_rule(db: Session, **kwargs):
    return ops.toggle_craft_rule(db, **kwargs)


def place_order(db: Session, **kwargs):
    return ops.place_retailer_order(db, **kwargs)


def list_promotions(db: Session) -> list[Promotion]:
    return db.query(Promotion).order_by(Promotion.created_at.desc()).all()


def create_promotion(
    db: Session,
    *,
    name: str,
    discount_pct: float = 0,
    collection: str | None = None,
    active: bool = True,
) -> Promotion:
    row = Promotion(
        id=f"promo-{int(time.time() * 1000)}",
        name=name,
        collection=collection,
        discount_pct=discount_pct,
        active=active,
        status="active" if active else "draft",
        created_label=now_label(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
