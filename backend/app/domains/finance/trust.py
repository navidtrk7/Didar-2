"""Iran gold trust settlement — channels and party trust tiers.

Close deal ≠ clear money. Informal (phone/verbal) settlement is first-class
and must never be labeled as Zarrin-paid.
"""

from __future__ import annotations

from fastapi import HTTPException

# How money/metal was cleared (or agreed) for retailer credit docs.
SETTLEMENT_CHANNELS: dict[str, str] = {
    "verbal": "شفاهی",
    "phone": "تلفنی",
    "cash": "نقد",
    "transfer": "کارت‌به‌کارت / واریز",
}

# Who may use informal channels.
TRUST_TIERS: dict[str, str] = {
    "cash_only": "فقط نقد / واریز",
    "phone_ok": "تلفن و شفاهی مجاز",
    "open_account": "حساب باز / اعتماد کامل",
}

DEFAULT_TRUST_TIER = "phone_ok"

# Channels that require higher trust than cash_only.
INFORMAL_CHANNELS = frozenset({"verbal", "phone"})


def normalize_channel(channel: str | None) -> str:
    ch = (channel or "phone").strip().lower()
    if ch not in SETTLEMENT_CHANNELS:
        raise HTTPException(
            400,
            f"کانال تسویه نامعتبر است — مجاز: {', '.join(SETTLEMENT_CHANNELS)}",
        )
    return ch


def normalize_trust_tier(tier: str | None) -> str:
    t = (tier or DEFAULT_TRUST_TIER).strip().lower()
    if t == "credit_tier":  # legacy alias from party_types suggested_fields
        t = DEFAULT_TRUST_TIER
    if t not in TRUST_TIERS:
        raise HTTPException(
            400,
            f"سطح اعتماد نامعتبر است — مجاز: {', '.join(TRUST_TIERS)}",
        )
    return t


def trust_tier_from_profile(profile: dict | None) -> str:
    prof = profile or {}
    raw = prof.get("trust_tier") or prof.get("credit_tier") or DEFAULT_TRUST_TIER
    try:
        return normalize_trust_tier(str(raw))
    except HTTPException:
        return DEFAULT_TRUST_TIER


def assert_channel_allowed(trust_tier: str, channel: str) -> None:
    tier = normalize_trust_tier(trust_tier)
    ch = normalize_channel(channel)
    if tier == "cash_only" and ch in INFORMAL_CHANNELS:
        raise HTTPException(
            400,
            "این طرف فقط نقد/واریز دارد — تسویه شفاهی یا تلفنی مجاز نیست",
        )
