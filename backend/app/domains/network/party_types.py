"""Iran gold-market party type catalog for Network UX."""

from __future__ import annotations

from typing import Any

# kind codes stored on organizations.kind
# Legacy aliases (producer/retailer/agent) still accepted and normalized in UI.

PARTY_TYPES: list[dict[str, Any]] = [
    {
        "kind": "factory",
        "label_fa": "کارخانه",
        "aliases": [],
        "what_they_do": "تولید عمده مصنوعات طلا، ذوب و ریخته‌گری، تأمین حجم بالا برای بنکداران.",
        "capabilities": [
            "تولید عمده",
            "ذوب / ریخته‌گری",
            "سفارش ساخت",
            "تحویل به بنکدار",
        ],
        "required_profile": ["city", "union_license", "phone"],
        "suggested_fields": [
            "monthly_capacity_grams",
            "karat_range",
            "specialties",
        ],
        "can_delete": False,
        "can_archive": True,
        "assignee_required": False,
    },
    {
        "kind": "atelier",
        "label_fa": "کارگاه / آتلیه",
        "aliases": ["producer"],
        "what_they_do": "ساخت ظریف و سفارشی، طراحی مدل، تولید محدود با کنترل کیفیت نزدیک.",
        "capabilities": [
            "طراحی مدل",
            "ساخت سفارشی",
            "ارسال به QC",
            "تحویل قطعه به خزانه",
        ],
        "required_profile": ["city", "phone"],
        "suggested_fields": ["karat_range", "specialties", "monthly_capacity_grams"],
        "can_delete": False,
        "can_archive": True,
        "assignee_required": False,
    },
    {
        "kind": "wholesaler",
        "label_fa": "بنکدار",
        "aliases": [],
        "what_they_do": "واسطه عمده بین کارخانه/کارگاه و خرده‌فروش؛ خرید و فروش حجمی و تنظیم عرضه.",
        "capabilities": [
            "خرید عمده از تولید",
            "فروش به گالری",
            "اعتبار / فاکتور",
            "تنوع مدل",
        ],
        "required_profile": ["city", "union_license", "phone"],
        "suggested_fields": ["trust_tier", "market_zone"],
        "can_delete": False,
        "can_archive": True,
        "assignee_required": False,
    },
    {
        "kind": "gallery",
        "label_fa": "گالری / فروشگاه",
        "aliases": ["retailer"],
        "what_they_do": "خرده‌فروشی به مشتری نهایی؛ ویترین، موجودی فروشگاهی، سفارش از بنکدار/ایجنت.",
        "capabilities": [
            "ویترین فروش",
            "سفارش به شبکه",
            "موجودی فروشگاه",
            "گارانتی مشتری",
        ],
        "required_profile": ["city", "address", "phone"],
        "suggested_fields": ["trust_tier", "market_zone", "union_license"],
        "can_delete": False,
        "can_archive": True,
        "assignee_required": False,
    },
    {
        "kind": "vault",
        "label_fa": "خزانه / انبار",
        "aliases": [],
        "what_they_do": "نگهداری فیزیکی، custody، آماده‌سازی pack/handover و تحویل امن.",
        "capabilities": [
            "نگهداری UID",
            "Pick / Pack",
            "Handover",
            "موقعیت مکانی موجودی",
        ],
        "required_profile": ["city", "address"],
        "suggested_fields": ["security_level"],
        "can_delete": False,
        "can_archive": True,
        "assignee_required": False,
    },
    {
        "kind": "agent_desk",
        "label_fa": "میز ایجنت",
        "aliases": ["agent"],
        "what_they_do": "فروش و هماهنگی میدانی؛ پیش‌فاکتور، ارتباط با گالری و بنکدار.",
        "capabilities": [
            "پیش‌فاکتور",
            "هماهنگی تحویل",
            "پورتفوی مشتری",
        ],
        "required_profile": ["city", "phone"],
        "suggested_fields": ["market_zone"],
        "can_delete": False,
        "can_archive": True,
        "assignee_required": False,
    },
    {
        "kind": "customer",
        "label_fa": "مشتری سازمانی",
        "aliases": [],
        "what_they_do": "خریدار نهایی سازمانی یا حساب مشتری برای خدمات پس از فروش.",
        "capabilities": ["خرید", "گارانتی", "پیگیری سفارش"],
        "required_profile": ["phone"],
        "suggested_fields": ["national_id"],
        "can_delete": False,
        "can_archive": True,
        "assignee_required": False,
    },
    {
        "kind": "internal",
        "label_fa": "واحد داخلی دیدار",
        "aliases": [],
        "what_they_do": "واحدهای عملیاتی پلتفرم (ستاد، QC، مالی، قیمت).",
        "capabilities": ["عملیات داخلی", "حاکمیت"],
        "required_profile": [],
        "suggested_fields": [],
        "can_delete": False,
        "can_archive": True,
        "assignee_required": False,
    },
]

KIND_ALIASES: dict[str, str] = {}
for _t in PARTY_TYPES:
    for a in _t["aliases"]:
        KIND_ALIASES[a] = _t["kind"]


def canonical_kind(kind: str) -> str:
    k = (kind or "").strip()
    return KIND_ALIASES.get(k, k)


def type_meta(kind: str) -> dict[str, Any] | None:
    ck = canonical_kind(kind)
    for t in PARTY_TYPES:
        if t["kind"] == ck:
            return t
    return None
