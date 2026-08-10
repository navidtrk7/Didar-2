"""Product domain — SKU / Collection / QC."""

from __future__ import annotations

import re
import time

from sqlalchemy.orm import Session

from app.models import Collection, QcInspection, Sku
from app.services import ops, slice_b


def list_skus(db: Session) -> list[Sku]:
    return db.query(Sku).order_by(Sku.created_at.desc()).all()


def list_qc_queue(db: Session) -> list[QcInspection]:
    return db.query(QcInspection).order_by(QcInspection.created_at.desc()).all()


def create_sku(db: Session, **kwargs) -> Sku:
    return ops.create_sku(db, **kwargs)


def send_to_qc(db: Session, *, sku_id: str, actor: str) -> QcInspection:
    return ops.send_sku_to_qc(db, sku_id=sku_id, actor=actor)


def complete_qc(db: Session, **kwargs) -> QcInspection:
    return slice_b.complete_qc(db, **kwargs)


def list_collections(db: Session) -> list[Collection]:
    return db.query(Collection).order_by(Collection.name).all()


def ensure_collections_from_skus(db: Session) -> list[Collection]:
    names = {s.collection for s in db.query(Sku).all() if s.collection}
    existing = {c.name for c in db.query(Collection).all()}
    for i, name in enumerate(sorted(names - existing)):
        slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or f"c-{i}"
        db.add(
            Collection(
                id=f"col-{int(time.time() * 1000)}-{i}",
                name=name,
                slug=f"{slug}-{i}",
                status="live",
                description=f"کالکشن {name}",
            )
        )
    if names - existing:
        db.commit()
    return list_collections(db)


def create_collection(
    db: Session,
    *,
    name: str,
    description: str = "",
) -> Collection:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or f"c-{int(time.time())}"
    row = Collection(
        id=f"col-{int(time.time() * 1000)}",
        name=name,
        slug=slug,
        status="live",
        description=description or f"کالکشن {name}",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
