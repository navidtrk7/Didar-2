from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.models import AuditEvent, DomainEvent


def now_label() -> str:
    d = datetime.now()
    return f"امروز {d.hour:02d}:{d.minute:02d}"


def append_event(
    db: Session,
    *,
    event_type: str,
    aggregate_type: str,
    aggregate_id: str,
    actor_name: str,
    actor_role: str,
    payload: dict[str, Any],
) -> DomainEvent:
    row = DomainEvent(
        event_type=event_type,
        aggregate_type=aggregate_type,
        aggregate_id=aggregate_id,
        actor_name=actor_name,
        actor_role=actor_role,
        payload=payload,
    )
    db.add(row)
    db.flush()
    # Relationship automation: active campaigns matching this event_type
    if not event_type.startswith("campaign."):
        _dispatch_campaigns(
            db,
            event_type=event_type,
            aggregate_id=aggregate_id,
            payload=payload,
        )
    return row


def _dispatch_campaigns(
    db: Session,
    *,
    event_type: str,
    aggregate_id: str,
    payload: dict[str, Any],
) -> None:
    from app.models import Campaign

    camps = (
        db.query(Campaign)
        .filter(
            Campaign.status == "active",
            Campaign.trigger_event == event_type,
        )
        .all()
    )
    for camp in camps:
        camp.fired_count = int(camp.fired_count or 0) + 1
        camp.last_fired_label = now_label()
        db.add(
            DomainEvent(
                event_type="campaign.triggered",
                aggregate_type="campaign",
                aggregate_id=camp.id,
                actor_name="system",
                actor_role="relationship",
                payload={
                    "campaign": camp.name,
                    "channel": camp.channel,
                    "trigger_event": event_type,
                    "source_aggregate_id": aggregate_id,
                    "source_payload": payload,
                },
            )
        )


def append_audit(
    db: Session,
    *,
    id: str,
    module: str,
    actor: str,
    role: str,
    action: str,
    entity: str,
    ip: str = "10.0.12.10",
    status: str = "ok",
    timestamp_label: str | None = None,
) -> AuditEvent:
    row = AuditEvent(
        id=id,
        module=module,
        actor=actor,
        role=role,
        action=action,
        entity=entity,
        ip=ip,
        status=status,
        timestamp_label=timestamp_label or now_label(),
    )
    db.add(row)
    return row


def utcnow() -> datetime:
    return datetime.now(timezone.utc)
