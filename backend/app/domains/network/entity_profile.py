"""Didar Entity Profile mindset — Mandatory → Activation → Extension → Later → System.

Maps the Actor & Entity Profile Spec onto Iran party kinds.
Later / System Generated are never registration forms.
"""

from __future__ import annotations

from typing import Any

# Stages shown in Network UX (and API).
STAGES = (
    "mandatory",
    "activation",
    "extension",
    "later",
    "system",
)

STAGE_LABELS_FA: dict[str, str] = {
    "mandatory": "اجباری اولیه",
    "activation": "فعال‌سازی",
    "extension": "اختصاصی دیدار",
    "later": "بلوغ (بعداً)",
    "system": "سیستم‌ساخته",
}

# Field catalog — keys resolve against Organization columns or profile JSON.
FieldSpec = dict[str, Any]

# Shared field definitions (label + where value lives).
FIELDS: dict[str, FieldSpec] = {
    "name": {"label_fa": "نام", "source": "column"},
    "phone": {"label_fa": "موبایل / تلفن", "source": "column"},
    "city": {"label_fa": "شهر", "source": "column"},
    "address": {"label_fa": "آدرس", "source": "column"},
    "union_license": {"label_fa": "جواز اتحادیه", "source": "column"},
    "national_id": {"label_fa": "شناسه ملی", "source": "column"},
    "summary": {"label_fa": "نوع فعالیت / خلاصه", "source": "column"},
    "member_count": {
        "label_fa": "حداقل یک کاربر / مسئول",
        "source": "computed",
        "activation": True,
    },
    "trust_tier": {
        "label_fa": "سطح اعتماد تسویه (Didar Tier)",
        "source": "profile",
        "extension": True,
    },
    "market_zone": {
        "label_fa": "منطقه فروش",
        "source": "profile",
        "extension": True,
    },
    "assigned_agent": {
        "label_fa": "ایجنت مسئول",
        "source": "profile",
        "extension": True,
    },
    "zarrin_ref": {
        "label_fa": "شناسه زرین / ERP",
        "source": "profile",
        "extension": True,
    },
    "karat_range": {
        "label_fa": "بازه عیار",
        "source": "profile",
        "extension": True,
    },
    "monthly_capacity_grams": {
        "label_fa": "ظرفیت ماهانه (گرم)",
        "source": "profile",
        "extension": True,
    },
    "security_level": {
        "label_fa": "سطح امنیتی",
        "source": "profile",
        "extension": True,
    },
    # Later / maturity — shown as guidance only, never required for signup
    "payment_terms": {
        "label_fa": "شرایط پرداخت",
        "source": "profile",
        "later": True,
    },
    "credit_limit": {
        "label_fa": "سقف اعتبار (بلوغ)",
        "source": "profile",
        "later": True,
        "note": "SoR فعلی: حساب اعتبار دیدار / بعداً زرین",
    },
    "risk_level": {"label_fa": "سطح ریسک", "source": "profile", "later": True},
    "lead_time": {"label_fa": "Lead time", "source": "profile", "later": True},
    "sla": {"label_fa": "SLA", "source": "profile", "later": True},
    # System-generated — never data-entry
    "total_purchase": {
        "label_fa": "حجم خرید کل",
        "source": "system",
        "system": True,
    },
    "last_order": {"label_fa": "آخرین سفارش", "source": "system", "system": True},
    "performance": {
        "label_fa": "عملکرد / نرخ برگشت",
        "source": "system",
        "system": True,
    },
    "on_time_delivery": {
        "label_fa": "تحویل به‌موقع",
        "source": "system",
        "system": True,
    },
    "discrepancy_rate": {
        "label_fa": "نرخ اختلاف",
        "source": "system",
        "system": True,
    },
}

# Per Iran party kind: which field keys belong to which stage.
# Keys under "later"/"system" are guidance only.
KIND_STAGES: dict[str, dict[str, list[str]]] = {
    "gallery": {
        "mandatory": ["name", "phone", "city", "address", "summary"],
        "activation": ["member_count"],
        "extension": ["trust_tier", "market_zone", "assigned_agent", "zarrin_ref"],
        "later": ["payment_terms", "credit_limit", "risk_level"],
        "system": ["total_purchase", "last_order", "performance"],
    },
    "wholesaler": {
        "mandatory": ["name", "phone", "city", "union_license", "summary"],
        "activation": ["member_count", "address"],
        "extension": ["trust_tier", "market_zone", "zarrin_ref"],
        "later": ["payment_terms", "credit_limit", "risk_level"],
        "system": ["total_purchase", "last_order", "performance"],
    },
    "factory": {
        "mandatory": ["name", "phone", "city", "union_license", "summary"],
        "activation": ["member_count", "address"],
        "extension": [
            "karat_range",
            "monthly_capacity_grams",
            "zarrin_ref",
            "market_zone",
        ],
        "later": ["lead_time", "payment_terms"],
        "system": ["on_time_delivery", "discrepancy_rate", "performance"],
    },
    "atelier": {
        "mandatory": ["name", "phone", "city", "summary"],
        "activation": ["member_count"],
        "extension": [
            "karat_range",
            "monthly_capacity_grams",
            "zarrin_ref",
            "market_zone",
        ],
        "later": ["lead_time", "payment_terms"],
        "system": ["on_time_delivery", "discrepancy_rate", "performance"],
    },
    "vault": {
        "mandatory": ["name", "city", "address", "summary"],
        "activation": ["member_count", "phone"],
        "extension": ["security_level"],
        "later": ["sla"],
        "system": ["discrepancy_rate", "performance"],
    },
    "agent_desk": {
        "mandatory": ["name", "phone", "city", "summary"],
        "activation": ["member_count"],
        "extension": ["market_zone", "assigned_agent"],
        "later": ["risk_level"],
        "system": ["total_purchase", "last_order", "performance"],
    },
    "customer": {
        "mandatory": ["name", "phone"],
        "activation": [],
        "extension": ["national_id"],
        "later": ["payment_terms"],
        "system": ["total_purchase", "last_order"],
    },
    "internal": {
        "mandatory": ["name"],
        "activation": ["member_count"],
        "extension": [],
        "later": [],
        "system": ["performance"],
    },
}

# Doc entity labels (English mindset) → Iran kinds
DOC_ENTITY_ALIASES: dict[str, list[str]] = {
    "Retailer / Business Account": ["gallery", "wholesaler"],
    "Store / Branch": ["gallery"],  # child-store later; today gallery covers store
    "Producer / Manufacturer": ["factory", "atelier"],
    "Supplier / Business Partner": ["wholesaler", "factory"],
    "Agent": ["agent_desk"],
    "End Customer": ["customer"],
    "Internal User": ["internal"],
    "Service / Delivery Partner": [],  # deferred
    "Courier / Delivery Actor": [],  # deferred — warehouse/agent + OTP today
}


def stages_for_kind(kind: str) -> dict[str, list[str]]:
    from app.domains.network.party_types import canonical_kind

    ck = canonical_kind(kind)
    base = KIND_STAGES.get(ck) or KIND_STAGES["internal"]
    return {s: list(base.get(s) or []) for s in STAGES}


def _value_present(party: Any, key: str, member_count: int) -> bool:
    meta = FIELDS.get(key) or {}
    source = meta.get("source")
    if source == "computed" and key == "member_count":
        return int(member_count or 0) > 0
    if source == "system":
        return False  # never "filled" by user
    if source == "profile":
        prof = getattr(party, "profile", None) or {}
        if not isinstance(prof, dict):
            return False
        val = prof.get(key)
        if val is None:
            return False
        if isinstance(val, str):
            return bool(val.strip())
        return True
    # column
    val = getattr(party, key, None)
    if val is None:
        return False
    if isinstance(val, str):
        return bool(val.strip())
    return True


def evaluate_party(party: Any, *, member_count: int = 0) -> dict[str, Any]:
    """Compute profile mindset readiness for a Network party."""
    stages = stages_for_kind(getattr(party, "kind", "internal"))
    checklist: dict[str, list[dict[str, Any]]] = {}
    missing_mandatory: list[str] = []
    missing_activation: list[str] = []

    for stage in STAGES:
        rows: list[dict[str, Any]] = []
        for key in stages.get(stage) or []:
            fmeta = FIELDS.get(key) or {"label_fa": key, "source": "profile"}
            filled = _value_present(party, key, member_count)
            # system/later never count as missing for readiness
            if stage == "mandatory" and not filled:
                missing_mandatory.append(key)
            if stage == "activation" and not filled:
                missing_activation.append(key)
            rows.append(
                {
                    "key": key,
                    "label_fa": fmeta.get("label_fa") or key,
                    "source": fmeta.get("source") or "profile",
                    "filled": filled if stage not in ("later", "system") else False,
                    "editable": stage in ("mandatory", "activation", "extension"),
                    "note": fmeta.get("note"),
                }
            )
        checklist[stage] = rows

    archived = (getattr(party, "status", None) or "") == "archived"
    if archived:
        readiness = "archived"
        readiness_label = "بایگانی"
    elif missing_mandatory:
        readiness = "registered"
        readiness_label = "ثبت‌شده — ناقص اجباری"
    elif missing_activation:
        readiness = "activation_incomplete"
        readiness_label = "نیاز به فعال‌سازی"
    else:
        readiness = "ready"
        readiness_label = "آماده عملیات"

    return {
        "readiness": readiness,
        "readiness_label": readiness_label,
        "missing_mandatory": missing_mandatory,
        "missing_activation": missing_activation,
        "checklist": checklist,
        "principles": [
            "Retailer با User یکی نیست — طرف شبکه ≠ شخص",
            "Store زیرمجموعه Retailer است (فعلاً گالری؛ شعبه جدا بعداً)",
            "Agent با Assignment به گالری وصل می‌شود نه مالکیت",
            "Later / System Generated فرم ثبت‌نام نیستند",
            "Credit و زرین SoR جدا دارند — فقط مرجع در پروفایل",
        ],
    }


def list_entity_profile_spec() -> dict[str, Any]:
    kinds = []
    for kind, stages in KIND_STAGES.items():
        kinds.append(
            {
                "kind": kind,
                "stages": {
                    s: [
                        {
                            "key": k,
                            "label_fa": (FIELDS.get(k) or {}).get("label_fa") or k,
                            "source": (FIELDS.get(k) or {}).get("source") or "profile",
                        }
                        for k in stages.get(s) or []
                    ]
                    for s in STAGES
                },
            }
        )
    return {
        "stage_labels": STAGE_LABELS_FA,
        "stages": list(STAGES),
        "doc_aliases": DOC_ENTITY_ALIASES,
        "kinds": kinds,
        "rules": [
            "Mandatory فقط برای ایجاد Profile",
            "Activation قبل از شروع فعالیت واقعی",
            "Didar Extension منطق خاص دیدار",
            "Later شرط Registration نیست",
            "System Generated از تراکنش محاسبه می‌شود",
        ],
    }
