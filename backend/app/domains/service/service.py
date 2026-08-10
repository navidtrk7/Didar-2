"""Service domain — warranty / return / buyback / secondary lifecycle."""

from __future__ import annotations

import time

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import get_settings
from app.integrations.zarrin import get_zarrin_client
from app.models import (
    Asset,
    DualLedgerEntry,
    ServiceCase,
    SystemSettingsRow,
    WarrantyClaim,
)
from app.services.events import append_event, now_label

CASE_KINDS = frozenset({"return", "buyback", "secondary"})


def _live_rate(db: Session) -> int:
    settings = get_settings()
    row = db.get(SystemSettingsRow, 1)
    if row and row.live_rate_override:
        return int(row.live_rate_override)
    return int(settings.live_gold_price_per_gram)


def quote_buyback(db: Session, *, uid: str) -> dict:
    """Metal value minus craft share — Didar quote, not Zarrin settlement."""
    asset = db.query(Asset).filter(Asset.uid.ilike(uid.strip())).first()
    if not asset:
        raise HTTPException(404, "UID یافت نشد")
    settings = get_settings()
    rate = _live_rate(db)
    metal_irr = int(round(asset.weight_grams * rate * settings.irt_to_irr))
    craft_irr = int(round(metal_irr * (float(asset.craft_fee_pct or 0) / 100)))
    offer_irr = max(0, metal_irr - craft_irr)
    return {
        "uid": asset.uid,
        "name": asset.name,
        "weight_grams": asset.weight_grams,
        "karat": asset.karat,
        "craft_fee_pct": float(asset.craft_fee_pct or 0),
        "rate_per_gram": rate,
        "metal_irr": metal_irr,
        "craft_irr": craft_irr,
        "offer_irr": offer_irr,
        "note": "پیشنهاد داخلی دیدار — تسویه زرین جداست",
    }


def list_claims(db: Session) -> list[WarrantyClaim]:
    return db.query(WarrantyClaim).order_by(WarrantyClaim.created_at.desc()).all()


def lookup_warranty(db: Session, *, uid: str) -> dict:
    asset = db.query(Asset).filter(Asset.uid.ilike(uid.strip())).first()
    if not asset:
        raise HTTPException(404, "UID یافت نشد")
    open_claims = (
        db.query(WarrantyClaim)
        .filter(WarrantyClaim.uid == asset.uid, WarrantyClaim.status == "open")
        .count()
    )
    # Active only after final delivery to the end customer.
    active = asset.status == "delivered"
    if active:
        message = f"گارانتی «{asset.name}» فعال است"
        if open_claims:
            message += f" — {open_claims} ادعای باز"
    elif asset.status in ("buyback", "returned", "secondary"):
        message = f"گارانتی برای وضعیت «{asset.status}» فعال نیست"
    elif asset.status in ("available", "reserved"):
        message = (
            "این قطعه هنوز نزد شبکه/انبار است — "
            "گارانتی مشتری پس از تحویل فعال می‌شود"
        )
    else:
        message = f"گارانتی فعال نیست (وضعیت: {asset.status})"

    return {
        "uid": asset.uid,
        "name": asset.name,
        "active": active,
        "open_claims": open_claims,
        "status": asset.status,
        "message": message,
    }


def open_claim(
    db: Session,
    *,
    uid: str,
    claimant: str,
    notes: str = "",
) -> WarrantyClaim:
    asset = db.query(Asset).filter(Asset.uid.ilike(uid.strip())).first()
    if not asset:
        raise HTTPException(404, "UID یافت نشد")
    if asset.status != "delivered":
        raise HTTPException(
            400,
            "ادعای گارانتی فقط پس از تحویل نهایی به مشتری قابل ثبت است",
        )
    row = WarrantyClaim(
        id=f"wc-{int(time.time() * 1000)}",
        uid=asset.uid,
        claimant=claimant,
        status="open",
        notes=notes,
        created_label=now_label(),
    )
    db.add(row)
    append_event(
        db,
        event_type="warranty.opened",
        aggregate_type="warranty",
        aggregate_id=row.id,
        actor_name=claimant,
        actor_role="customer",
        payload={"uid": asset.uid, "notes": notes},
    )
    db.commit()
    db.refresh(row)
    return row


def list_cases(db: Session, *, kind: str | None = None) -> list[ServiceCase]:
    q = db.query(ServiceCase).order_by(ServiceCase.created_at.desc())
    if kind:
        q = q.filter(ServiceCase.kind == kind)
    return q.all()


def open_case(
    db: Session,
    *,
    uid: str,
    kind: str,
    claimant: str,
    notes: str = "",
    amount_irr: int = 0,
) -> ServiceCase:
    if kind not in CASE_KINDS:
        raise HTTPException(400, "kind must be return|buyback|secondary")
    asset = db.query(Asset).filter(Asset.uid.ilike(uid.strip())).first()
    if not asset:
        raise HTTPException(404, "UID یافت نشد")

    if kind == "buyback":
        if asset.status != "delivered":
            raise HTTPException(
                400,
                "بازخرید فقط برای قطعهٔ تحویل‌شده (delivered) ثبت می‌شود",
            )
        if amount_irr <= 0:
            amount_irr = int(quote_buyback(db, uid=asset.uid)["offer_irr"])
        # Hold in buyback until close posts through Zarrin adapter.
        asset.status = "buyback"

    # Lifecycle side-effects (thin but real)
    if kind == "return" and asset.status == "delivered":
        asset.status = "available"
        asset.location = "خزانه تهران-الف"
        asset.custodian = "خزانه دیدار"
    elif kind == "secondary":
        asset.status = "available"
        asset.custodian = "بازار ثانویه دیدار"

    row = ServiceCase(
        id=f"sc-{int(time.time() * 1000)}",
        uid=asset.uid,
        kind=kind,
        status="open",
        claimant=claimant,
        notes=notes,
        amount_irr=amount_irr,
        created_label=now_label(),
    )
    db.add(row)
    append_event(
        db,
        event_type=f"service.{kind}_opened",
        aggregate_type="service_case",
        aggregate_id=row.id,
        actor_name=claimant,
        actor_role="service",
        payload={"uid": asset.uid, "kind": kind, "amount_irr": amount_irr},
    )
    db.commit()
    db.refresh(row)
    return row


def close_case(db: Session, *, case_id: str, actor: str) -> ServiceCase:
    row = db.get(ServiceCase, case_id)
    if not row:
        raise HTTPException(404, "پرونده یافت نشد")
    if row.status == "closed":
        raise HTTPException(409, "قبلاً بسته شده")

    asset = db.query(Asset).filter(Asset.uid == row.uid).first()
    zarrin_payload: dict = {}
    if row.kind == "buyback" and row.amount_irr > 0:
        client = get_zarrin_client()
        try:
            zres = client.post_buyback(
                external_id=row.id,
                uid=row.uid,
                claimant=row.claimant,
                weight_grams=float(asset.weight_grams) if asset else 0.0,
                amount_irr=int(row.amount_irr),
            )
        except RuntimeError as exc:
            raise HTTPException(502, f"زرین در دسترس نیست: {exc}") from exc
        if not zres.ok:
            raise HTTPException(502, f"زرین بازخرید را نپذیرفت: {zres.status}")
        row.zarrin_ref = zres.zarrin_id or zres.ledger_ref
        row.zarrin_status = zres.status
        zarrin_payload = {
            "zarrin_id": zres.zarrin_id,
            "zarrin_status": zres.status,
            "zarrin_mode": zres.mode,
            "ledger_ref": zres.ledger_ref,
        }
        db.add(
            DualLedgerEntry(
                id=f"dl-{int(time.time() * 1000)}",
                doc_code=row.id,
                entity=row.claimant or row.uid,
                warehouse="بازخرید",
                weight_debit=float(asset.weight_grams) if asset else 0.0,
                weight_credit=0,
                irr_debit=int(row.amount_irr),
                irr_credit=0,
                kind="buyback",
                locked=True,
                date_label=now_label(),
            )
        )
        if asset:
            asset.status = "available"
            asset.location = "خزانه تهران-الف"
            asset.custodian = "خزانه دیدار"

    row.status = "closed"
    append_event(
        db,
        event_type="service.case_closed",
        aggregate_type="service_case",
        aggregate_id=row.id,
        actor_name=actor,
        actor_role="service",
        payload={"uid": row.uid, "kind": row.kind, **zarrin_payload},
    )
    db.commit()
    db.refresh(row)
    return row
