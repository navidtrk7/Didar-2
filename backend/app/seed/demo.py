"""Demo seed — mirrors frontend mock/platform data with real FK relations.

Wipe before production go-live (`DEMO_SEED` / re-seed script).
"""

from __future__ import annotations

from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import (
    Adjustment,
    Asset,
    AuditEvent,
    Campaign,
    CraftFeeRule,
    CreditAccount,
    CreditDocument,
    CrmContact,
    CustomRole,
    Delivery,
    DualLedgerEntry,
    InventoryLocation,
    Order,
    Organization,
    PartyMembership,
    ProducerSettlement,
    Promotion,
    Proforma,
    ProformaLine,
    QcInspection,
    RateRequest,
    Sku,
    SystemSettingsRow,
    User,
    UserRoleGrant,
)
from app.domains.network.service import ensure_system_roles
from app.services.events import now_label

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

# id, name, kind, city, phone, summary, profile
ORGS = [
    ("org-hq", "ستاد دیدار گلد", "internal", "تهران", None, "حاکمیت و هماهنگی پلتفرم", {"capabilities": ["عملیات داخلی", "حاکمیت"]}),
    ("org-qc", "عملیات کاتالوگ دیدار", "internal", "تهران", None, "QC و کاتالوگ", {"capabilities": ["بازرسی", "کاتالوگ"]}),
    ("org-mehr", "گالری مهر طلا", "gallery", "تهران", "021-=======", "خرده‌فروشی ویترینی به مشتری نهایی", {"capabilities": ["ویترین فروش", "سفارش به شبکه", "موجودی فروشگاه"], "market_zone": "ونک", "trust_tier": "open_account"}),
    ("org-field", "فروش میدانی دیدار گلد", "agent_desk", "تهران", "021-=======", "ایجنت‌ها و پیش‌فاکتور میدانی", {"capabilities": ["پیش‌فاکتور", "هماهنگی تحویل"]}),
    ("org-vault", "خزانه مرکزی دیدار", "vault", "تهران", None, "نگهداری فیزیکی و تحویل امن", {"capabilities": ["نگهداری UID", "Pick / Pack", "Handover"], "security_level": "high"}),
    ("org-pricing", "میز قیمت‌گذاری دیدار", "internal", "تهران", None, "قوانین نرخ", {}),
    ("org-finance", "مدیریت مالی دیدار گلد", "internal", "تهران", None, "اعتبار و تسویه", {}),
    ("org-customer", "مشتری نهایی", "customer", "تهران", None, "حساب مشتری نهایی", {}),
    ("org-parsa", "بنکداری پارسا", "wholesaler", "تهران", "021-=======", "واسطه عمده بین تولید و گالری", {"capabilities": ["خرید عمده از تولید", "فروش به گالری", "اعتبار / فاکتور"], "market_zone": "۱۵ خرداد", "trust_tier": "phone_ok"}),
    ("org-zomorod", "گالری زمرد", "gallery", "اصفهان", "031-=======", "فروشگاه بدون مسئول اختصاص‌یافته (نمونه)", {"capabilities": ["ویترین فروش"], "note": "بدون assignee", "trust_tier": "cash_only"}),
    ("org-noor", "بوتيك نور", "gallery", "شیراز", "071-=======", "فروشگاه بدون مسئول اختصاص‌یافته (نمونه)", {"capabilities": ["ویترین فروش"]}),
    ("org-atelier", "آتلیه نوا", "atelier", "تهران", "021-=======", "کارگاه طراحی و ساخت سفارشی", {"capabilities": ["طراحی مدل", "ساخت سفارشی", "ارسال به QC"], "karat_range": "18-21", "monthly_capacity_grams": 2500}),
    ("org-factory-yazd", "کارخانه یزد زرین", "factory", "یزد", "035-=======", "تولید عمده و ذوب برای بنکداران", {"capabilities": ["تولید عمده", "ذوب / ریخته‌گری", "سفارش ساخت"], "karat_range": "18-24", "monthly_capacity_grams": 80000}),
]


USERS = [
    ("u1", "لیلا فرهادی", "leila", "leila@didargold.com", "admin", "org-hq", "active", "۲ دقیقه پیش", 160),
    ("u2", "مریم کاظمی", "maryam", "maryam@didargold.com", "qc", "org-qc", "active", "۱۲ دقیقه پیش", 40),
    ("u3", "سارا مهربان", "sara", "sara@didargold.com", "retailer", "org-mehr", "active", "۱ ساعت پیش", 210),
    ("u4", "نوید رستمی", "navid", "navid@didargold.com", "agent", "org-field", "active", "۵ دقیقه پیش", 120),
    ("u5", "حسین پاکروان", "hossein", "hossein@didargold.com", "warehouse", "org-vault", "active", "۲۰ دقیقه پیش", 30),
    ("u6", "نیما شریفی", "nima", "nima@didargold.com", "pricing", "org-pricing", "active", "۸ دقیقه پیش", 250),
    ("u7", "کامبیز نوری", "kambiz", "kambiz@didargold.com", "finance", "org-finance", "active", "۳۵ دقیقه پیش", 180),
    ("u8", "آیدا محمدی", "aida", "aida@didargold.com", "customer", "org-customer", "active", "دیروز", 200),
    ("u9", "کیان پارسا", "kian", "kian@didargold.com", "retailer", "org-parsa", "active", "۳ ساعت پیش", 250),
    ("u10", "رضا علوی", "reza", "reza@didargold.com", "admin", "org-hq", "active", "۴۰ دقیقه پیش", 180),
    ("u11", "آرش نوایی", "arash", "arash@atelier-nova.com", "producer", "org-atelier", "active", "۱۵ دقیقه پیش", 95),
]

SKUS = [
    ("sku1", "انگشتر رز روژان", "ring", "RG-RJN-18K", 18, 4.2, "awaiting_qc", "روژان", "/products/product-03.jpg", "۱۴۰۵/۰۵/۱۲"),
    ("sku2", "گردنبند مهتاب", "necklace", "NK-MHT-18K", 18, 7.1, "awaiting_qc", "مهتاب", "/products/product-06.jpg", "۱۴۰۵/۰۵/۱۱"),
    ("sku3", "دستبند ویرا کلاسیک", "bracelet", "BR-VIR-18K", 18, 11.5, "needs_rework", "امضای دیدار", "/products/product-02.jpg", "۱۴۰۵/۰۵/۰۹"),
    ("sku4", "گوشواره نادیا", "earring", "ER-NAD-18K", 18, 5.6, "approved", "مراسم", "/products/product-04.jpg", "۱۴۰۵/۰۵/۰۸"),
    ("sku5", "انگشتر لیلا", "ring", "RG-LEI-18K", 18, 4.2, "draft", "امضای دیدار", "/products/product-05.jpg", "۱۴۰۵/۰۵/۱۴"),
    ("sku6", "گردنبند آترین", "necklace", "NK-ATR-18K", 18, 7.2, "approved", "امضای دیدار", "/products/product-01.jpg", "۱۴۰۵/۰۵/۰۷"),
]

QC = [
    ("qc1", "sku1", "PHY-8823-A", None, None, None, None, None),
    ("qc2", "sku2", "PHY-8824-B", None, None, None, None, None),
    ("qc3", "sku3", "PHY-8801-C", 11.62, "rework", "اختلاف وزن بیش از تلورانس", "۱۴۰۵/۰۵/۱۰", "مریم کاظمی"),
]

# Catalog ops assets — linked to SKUs where names/weights match
ASSETS = [
    {
        "id": "a1",
        "sku_id": "sku6",
        "uid": "DDR-18K-ATR01",
        "name": "گردنبند آترین",
        "slug": "atrin-necklace",
        "category": "necklace",
        "collection": "امضای دیدار",
        "karat": 18,
        "weight_grams": 7.2,
        "craft_fee_pct": 14.0,
        "craft_fee_irr": 14_800_000,
        # reserved: linked to seeded proforma PF-1405-018
        "status": "reserved",
        "location": "خزانه تهران-الف",
        "custodian": "خزانه دیدار",
        "image_url": "/products/product-01.jpg",
        "sealed": True,
        "created_label": "۱۴۰۵/۰۵/۱۰",
        "issued_label": "۱۴۰۵/۰۵/۱۰",
    },
    {
        "id": "a2",
        "sku_id": "sku3",
        "uid": "DDR-18K-VIR02",
        "name": "دستبند ویرا",
        "slug": "vira-bracelet",
        "category": "bracelet",
        "collection": "امضای دیدار",
        "karat": 18,
        "weight_grams": 11.5,
        "craft_fee_pct": 15.0,
        "craft_fee_irr": 16_200_000,
        "status": "reserved",
        "location": "خزانه تهران-الف",
        "custodian": "گالری مهر طلا",
        "image_url": "/products/product-02.jpg",
        "sealed": True,
        "created_label": "۱۴۰۵/۰۵/۰۶",
        "issued_label": "۱۴۰۵/۰۵/۰۶",
    },
    {
        "id": "a3",
        "sku_id": None,
        "uid": "DDR-18K-MAH03",
        "name": "انگشتر مهتاب",
        "slug": "mahtab-ring",
        "category": "ring",
        "collection": "میراث",
        "karat": 18,
        "weight_grams": 4.9,
        "craft_fee_pct": 15.0,
        "craft_fee_irr": 9_800_000,
        "status": "in_transit",
        "location": "گالری سیار شماره ۴",
        "custodian": "نوید رستمی",
        "image_url": "/products/product-03.jpg",
        "sealed": True,
        "created_label": "۱۴۰۵/۰۵/۱۲",
        "issued_label": "۱۴۰۵/۰۵/۱۲",
    },
    {
        "id": "a4",
        "sku_id": "sku4",
        "uid": "DDR-18K-NAD04",
        "name": "گوشواره نادیا",
        "slug": "nadia-earrings",
        "category": "earring",
        "collection": "مراسم",
        "karat": 18,
        "weight_grams": 5.6,
        "craft_fee_pct": 15.0,
        "craft_fee_irr": 11_400_000,
        "status": "available",
        "location": "گالری سیار شماره ۴",
        "custodian": "نوید رستمی",
        "image_url": "/products/product-04.jpg",
        "sealed": True,
        "created_label": "۱۴۰۵/۰۵/۱۴",
        "issued_label": "۱۴۰۵/۰۵/۱۴",
    },
    {
        "id": "a5",
        "sku_id": "sku5",
        "uid": "DDR-18K-LEI05",
        "name": "انگشتر لیلا",
        "slug": "leila-ring",
        "category": "ring",
        "collection": "امضای دیدار",
        "karat": 18,
        "weight_grams": 4.2,
        "craft_fee_pct": 15.0,
        "craft_fee_irr": 8_900_000,
        "status": "qc_hold",
        "location": "ایستگاه کنترل کیفی",
        "custodian": "کنترل کیفی دیدار",
        "image_url": "/products/product-05.jpg",
        "sealed": False,
        "created_label": "۱۴۰۵/۰۵/۱۳",
        "issued_label": None,
    },
    {
        "id": "a6",
        "sku_id": None,
        "uid": "DDR-18K-RAH06",
        "name": "گردنبند رها",
        "slug": "raha-necklace",
        "category": "necklace",
        "collection": "امضای دیدار",
        "karat": 18,
        "weight_grams": 6.8,
        "craft_fee_pct": 15.0,
        "craft_fee_irr": 13_500_000,
        "status": "delivered",
        "location": "گالری مهر طلا",
        "custodian": "سارا مهربان",
        "image_url": "/products/product-06.jpg",
        "sealed": True,
        "created_label": "۱۴۰۵/۰۴/۲۹",
        "issued_label": "۱۴۰۵/۰۴/۲۹",
    },
]

INVENTORY = [
    ("i1", "خزانه تهران-الف", "vault", 842, 12840.5, 1860.2, 10980.3, 72),
    ("i2", "خزانه دبی-ب", "vault", 410, 9640.0, 420.0, 9220.0, 48),
    ("i3", "گالری مهر طلا", "branch", 96, 1120.4, 80.0, 1040.4, 81),
    ("i4", "گالری سیار شماره ۴", "mobile", 24, 286.7, 42.3, 244.4, 64),
    ("i5", "کارگاه آتلیه نوا", "workshop", 58, 740.2, 0, 740.2, 35),
]

CREDIT_ACCOUNTS = [
    ("ca1", "org-mehr", "گالری مهر طلا", 12_500, 4_300, 5_000_000_000_000, 1_720_000_000_000, 0, False),
    ("ca2", "org-zomorod", "گالری زمرد", 8_000, 6_800, 3_200_000_000_000, 2_720_000_000_000, 150, True),
    ("ca3", "org-parsa", "بنکداری پارسا", 20_000, 9_100, 8_000_000_000_000, 3_640_000_000_000, 40, False),
]

CREDIT_DOCS = [
    ("cd1", "ca2", "DOC-8942", "گالری زمرد", 420_000_000_000, 120, "۱۴۰۵/۰۲/۱۸", 72, "overdue"),
    ("cd2", "ca3", "DOC-9011", "بنکداری پارسا", 85_000_000_000, 40, "۱۴۰۵/۰۴/۰۲", 18, "overdue"),
    ("cd3", "ca1", "DOC-9102", "گالری مهر طلا", 210_000_000_000, 95, "۱۴۰۵/۰۶/۰۱", 0, "open"),
]

# Proforma seed: PF-1405-018 for مهر طلا on ATR01 (matches platform.ts)
# totalIrr 152_000_000 in mock is illustrative; we keep same number for UI parity.


def seed_all(db: Session, *, force: bool = False) -> dict[str, int]:
    settings = get_settings()
    existing = db.query(Organization).count()
    if existing and not force:
        # Top-up interactive demo tables if missing (schema upgrades)
        added = 0
        # Normalize legacy kinds → Iran market party types
        kind_map = {
            "producer": "atelier",
            "retailer": "gallery",
            "agent": "agent_desk",
        }
        id_kind = {
            "org-vault": "vault",
            "org-parsa": "wholesaler",
            "org-mehr": "gallery",
            "org-zomorod": "gallery",
            "org-noor": "gallery",
            "org-atelier": "atelier",
            "org-field": "agent_desk",
            "org-factory-yazd": "factory",
        }
        for org in db.query(Organization).all():
            before = org.kind
            if org.id in id_kind:
                org.kind = id_kind[org.id]
            elif org.kind in kind_map:
                org.kind = kind_map[org.kind]
            if org.kind != before:
                added += 1
            if not getattr(org, "status", None):
                org.status = "active"
            # Refresh profile copy for remapped market parties
            if org.id == "org-field" and org.kind == "agent_desk":
                if not org.summary or "واحدهای عملیاتی" in (org.summary or ""):
                    org.summary = "ایجنت‌ها و پیش‌فاکتور میدانی"
                    org.profile = {
                        **(org.profile or {}),
                        "capabilities": ["پیش‌فاکتور", "هماهنگی تحویل"],
                    }
                    added += 1
            if org.id == "org-vault" and org.kind == "vault" and not org.city:
                org.city = "تهران"
                org.summary = org.summary or "نگهداری فیزیکی و تحویل امن"
                added += 1
        # Backfill party profile columns from ORGS (entity-profile readiness)
        org_seed = {
            row[0]: {
                "name": row[1],
                "kind": row[2],
                "city": row[3],
                "phone": row[4],
                "summary": row[5],
                "profile": row[6],
            }
            for row in ORGS
        }
        for oid, meta in org_seed.items():
            org = db.get(Organization, oid)
            if not org:
                continue
            changed = False
            if not org.city and meta.get("city"):
                org.city = meta["city"]
                changed = True
            if not org.phone and meta.get("phone"):
                org.phone = meta["phone"]
                changed = True
            if (not org.summary or not str(org.summary).strip()) and meta.get("summary"):
                org.summary = meta["summary"]
                changed = True
            # gallery/wholesaler demos need address for mandatory readiness
            if oid in ("org-mehr", "org-parsa", "org-zomorod", "org-noor", "org-vault"):
                if not org.address:
                    org.address = f"آدرس عملیاتی {meta.get('city') or 'تهران'}"
                    changed = True
            if meta.get("profile"):
                merged = {**(org.profile or {}), **meta["profile"]}
                # keep existing trust_tier if already set
                if (org.profile or {}).get("trust_tier"):
                    merged["trust_tier"] = org.profile["trust_tier"]
                if merged != (org.profile or {}):
                    org.profile = merged
                    changed = True
            if changed:
                added += 1

        # Trust tiers for Iran informal settle (idempotent merge)
        for oid, tier in (
            ("org-mehr", "open_account"),
            ("org-parsa", "phone_ok"),
            ("org-zomorod", "cash_only"),
        ):
            org = db.get(Organization, oid)
            if org and (org.profile or {}).get("trust_tier") != tier:
                org.profile = {**(org.profile or {}), "trust_tier": tier}
                added += 1
        # Placeholder images for SKUs/assets created without a photo (verify page)
        from app.services.uploads import DEFAULT_PRODUCT_IMAGE

        for sku in db.query(Sku).filter((Sku.image_url == None) | (Sku.image_url == "")).all():  # noqa: E711
            sku.image_url = DEFAULT_PRODUCT_IMAGE
            added += 1
        for asset in (
            db.query(Asset)
            .filter((Asset.image_url == None) | (Asset.image_url == ""))  # noqa: E711
            .all()
        ):
            asset.image_url = DEFAULT_PRODUCT_IMAGE
            added += 1
        if db.query(Organization).filter(Organization.id == "org-factory-yazd").first() is None:
            db.add(
                Organization(
                    id="org-factory-yazd",
                    name="کارخانه یزد زرین",
                    kind="factory",
                    status="active",
                    city="یزد",
                    phone="035-=======",
                    summary="تولید عمده و ذوب برای بنکداران",
                    profile={
                        "capabilities": ["تولید عمده", "ذوب / ریخته‌گری", "سفارش ساخت"],
                        "karat_range": "18-24",
                        "monthly_capacity_grams": 80000,
                    },
                )
            )
            added += 1
        ensure_system_roles(db)
        if db.query(PartyMembership).count() == 0:
            for mid, uid, oid, title in (
                ("pm-u1", "u1", "org-hq", "مدیر سیستم"),
                ("pm-u3", "u3", "org-mehr", "خریدار گالری"),
                ("pm-u4", "u4", "org-field", "ایجنت میدانی"),
                ("pm-u4-parsa", "u4", "org-parsa", "ایجنت پوشش"),
                ("pm-u9", "u9", "org-parsa", "مدیر بنکداری"),
                ("pm-u11", "u11", "org-atelier", "صاحب کارگاه"),
            ):
                if db.get(User, uid) and db.get(Organization, oid):
                    db.add(
                        PartyMembership(
                            id=mid,
                            user_id=uid,
                            org_id=oid,
                            title=title,
                            status="active",
                            created_label=now_label(),
                        )
                    )
                    added += 1
        else:
            # Ensure key demo memberships exist even if table was partially seeded
            for mid, uid, oid, title in (
                ("pm-u11", "u11", "org-atelier", "صاحب کارگاه"),
                ("pm-u4-parsa", "u4", "org-parsa", "ایجنت پوشش"),
            ):
                if (
                    db.get(User, uid)
                    and db.get(Organization, oid)
                    and db.query(PartyMembership)
                    .filter(PartyMembership.user_id == uid, PartyMembership.org_id == oid)
                    .first()
                    is None
                ):
                    db.add(
                        PartyMembership(
                            id=mid,
                            user_id=uid,
                            org_id=oid,
                            title=title,
                            status="active",
                            created_label=now_label(),
                        )
                    )
                    added += 1
        if db.query(UserRoleGrant).filter(UserRoleGrant.id == "urg-u4-wh").first() is None and db.get(User, "u4"):
            db.add(
                UserRoleGrant(
                    id="urg-u4-wh",
                    user_id="u4",
                    role_code="warehouse",
                    status="active",
                    created_label=now_label(),
                )
            )
            added += 1
        if db.query(User).filter(User.id == "u11").first() is None:
            if db.query(Organization).filter(Organization.id == "org-atelier").first() is None:
                db.add(Organization(id="org-atelier", name="آتلیه نوا", kind="atelier", status="active", city="تهران", summary="کارگاه طراحی و ساخت سفارشی", profile={"capabilities": ["طراحی مدل", "ساخت سفارشی"]}))
                db.flush()
            db.add(
                User(
                    id="u11",
                    name="آرش نوایی",
                    username="arash",
                    email="arash@atelier-nova.com",
                    password_hash=pwd.hash("didar123"),
                    role="producer",
                    org_id="org-atelier",
                    status="active",
                    last_active_label="۱۵ دقیقه پیش",
                    avatar_hue=95,
                )
            )
            added += 1
        if db.query(CrmContact).count() == 0:
            db.add(
                CrmContact(
                    id="crm-seed-1",
                    name="سارا مهربان",
                    phone="09120000003",
                    email="sara@didargold.com",
                    party_org_id="org-mehr",
                    role_label="buyer",
                    notes="مخاطب اصلی گالری مهر",
                    created_label=now_label(),
                )
            )
            db.add(
                CrmContact(
                    id="crm-seed-2",
                    name="کیان پارسا",
                    phone="09120000009",
                    email="kian@didargold.com",
                    party_org_id="org-parsa",
                    role_label="buyer",
                    notes="بنکداری پارسا",
                    created_label=now_label(),
                )
            )
            added += 2
        if db.query(Campaign).count() == 0:
            db.add(
                Campaign(
                    id="camp-seed-1",
                    name="یادآوری سفارش جدید",
                    channel="sms",
                    status="active",
                    trigger_event="order.submitted",
                    created_label=now_label(),
                )
            )
            added += 1
        if db.query(Delivery).count() == 0:
            for d in (
                ("d1", "DLV-8841", "نوید رستمی", "خزانه تهران-الف", "گالری مهر طلا", 6, 54.2, "awaiting_otp", True, "امروز · ۱۶:۳۰"),
                ("d2", "DLV-8836", "نوید رستمی", "خزانه تهران-الف", "بنکداری پارسا", 14, 198.4, "packing", True, "امروز · ۱۸:۰۰"),
                ("d3", "DLV-8820", "مینا سلطانی", "خزانه دبی-ب", "بوتيك نور", 4, 31.8, "completed", True, "۱۰ مرداد · ۱۱:۲۰"),
                ("d4", "DLV-8848", "نوید رستمی", "کارگاه آتلیه نوا", "خزانه تهران-الف", 18, 240.0, "picking", False, "۱۶ مرداد · ۰۹:۰۰"),
                ("d5", "DLV-8852", "نوید رستمی", "خزانه تهران-الف", "گالری مهر طلا", 3, 22.1, "handover", True, "امروز · ۱۴:۰۰"),
            ):
                db.add(
                    Delivery(
                        id=d[0],
                        code=d[1],
                        agent=d[2],
                        from_location=d[3],
                        to_location=d[4],
                        pieces=d[5],
                        weight_grams=d[6],
                        status=d[7],
                        otp_required=d[8],
                        scheduled_label=d[9],
                    )
                )
            added += 5
        if db.query(Order).count() == 0:
            for o in (
                ("o1", "ORD-24081", "گالری مهر طلا", 12, 186.4, 1_684_000_000, "confirmed", "۱۴۰۵/۰۵/۱۴", "۱۷ مرداد"),
                ("o2", "ORD-24077", "بنکداری پارسا", 28, 412.1, 3_642_000_000, "picking", "۱۴۰۵/۰۵/۱۳", "۱۶ مرداد"),
                ("o3", "ORD-24070", "گالری مهر طلا", 6, 54.2, 498_000_000, "shipped", "۱۴۰۵/۰۵/۱۲", "۱۵ مرداد"),
                ("o4", "ORD-24061", "بوتيك نور", 4, 31.8, 289_000_000, "delivered", "۱۴۰۵/۰۵/۰۷", "۱۰ مرداد"),
                ("o5", "ORD-24088", "بنکداری پارسا", 9, 98.5, 912_000_000, "submitted", "۱۴۰۵/۰۵/۱۵", "۱۹ مرداد"),
                ("o6", "ORD-24055", "بوتيك نور", 2, 14.1, 126_000_000, "cancelled", "۱۴۰۵/۰۵/۰۳", "—"),
            ):
                db.add(
                    Order(
                        id=o[0],
                        code=o[1],
                        retailer=o[2],
                        items=o[3],
                        total_weight=o[4],
                        value=o[5],
                        status=o[6],
                        created_label=o[7],
                        eta_label=o[8],
                    )
                )
            added += 6
        if db.query(Adjustment).count() == 0:
            db.add(
                Adjustment(
                    id="adj1",
                    code="ADJ-014",
                    reason="اصلاح خطای توزین شیفت قبل",
                    weight_delta=-0.12,
                    irr_delta=-2_200_000_000,
                    created_by="کامبیز نوری",
                    created_label="۱۴۰۵/۰۵/۰۹",
                )
            )
            added += 1
        if added:
            db.commit()
        return {"skipped": 1, "organizations": existing, "top_up": added}

    if force:
        for table in (
            ProformaLine,
            Proforma,
            DualLedgerEntry,
            AuditEvent,
            CreditDocument,
            CreditAccount,
            RateRequest,
            CraftFeeRule,
            QcInspection,
            Asset,
            Sku,
            InventoryLocation,
            Adjustment,
            Delivery,
            Order,
            PartyMembership,
            UserRoleGrant,
            User,
            CustomRole,
            Campaign,
            CrmContact,
            SystemSettingsRow,
            Organization,
        ):
            db.query(table).delete()
        db.commit()

    password_hash = pwd.hash("didar123")

    for row in ORGS:
        oid, name, kind, city, phone, summary, profile = row
        db.add(
            Organization(
                id=oid,
                name=name,
                kind=kind,
                status="active",
                city=city,
                phone=phone,
                summary=summary,
                profile=profile,
            )
        )
    db.flush()

    for row in USERS:
        uid, name, username, email, role, org_id, status, last, hue = row
        db.add(
            User(
                id=uid,
                name=name,
                username=username,
                email=email,
                password_hash=password_hash,
                role=role,
                org_id=org_id,
                status=status,
                last_active_label=last,
                avatar_hue=hue,
            )
        )
    db.flush()

    # Primary home memberships (stores may still have zero — زمرد / نور / کارخانه)
    memberships = [
        ("pm-u1", "u1", "org-hq", "مدیر سیستم"),
        ("pm-u2", "u2", "org-qc", "بازرس QC"),
        ("pm-u3", "u3", "org-mehr", "خریدار گالری"),
        ("pm-u4", "u4", "org-field", "ایجنت میدانی"),
        ("pm-u5", "u5", "org-vault", "انباردار"),
        ("pm-u6", "u6", "org-pricing", "کارشناس قیمت"),
        ("pm-u7", "u7", "org-finance", "مالی"),
        ("pm-u9", "u9", "org-parsa", "مدیر بنکداری"),
        ("pm-u11", "u11", "org-atelier", "صاحب کارگاه"),
        # Multi-store: agent also covers پارسا
        ("pm-u4-parsa", "u4", "org-parsa", "ایجنت پوشش"),
        # Multi-role will be grants below
    ]
    for mid, uid, oid, title in memberships:
        db.add(
            PartyMembership(
                id=mid,
                user_id=uid,
                org_id=oid,
                title=title,
                status="active",
                created_label=now_label(),
            )
        )

    ensure_system_roles(db)
    # Multi-role example: نوید = agent + warehouse view grant
    db.add(
        UserRoleGrant(
            id="urg-u4-wh",
            user_id="u4",
            role_code="warehouse",
            status="active",
            created_label=now_label(),
        )
    )

    db.add(
        SystemSettingsRow(
            id=1,
            weight_tolerance_grams=0.05,
            price_lock_minutes=3,
            proforma_ttl_minutes=15,
            default_karat=18,
            rate_source="tgju",
            currency="IRT",
        )
    )

    for s in SKUS:
        db.add(
            Sku(
                id=s[0],
                name=s[1],
                category=s[2],
                sku_code=s[3],
                karat=s[4],
                catalog_weight=s[5],
                status=s[6],
                collection=s[7],
                image_url=s[8],
                created_label=s[9],
            )
        )

    for q in QC:
        db.add(
            QcInspection(
                id=q[0],
                sku_id=q[1],
                physical_code=q[2],
                measured_weight=q[3],
                result=q[4],
                notes=q[5],
                inspected_label=q[6],
                inspector_name=q[7],
            )
        )

    for a in ASSETS:
        db.add(Asset(**a, producer="خانه ساخت دیدار گلد"))

    for inv in INVENTORY:
        db.add(
            InventoryLocation(
                id=inv[0],
                location=inv[1],
                type=inv[2],
                pieces=inv[3],
                weight_grams=inv[4],
                reserved_grams=inv[5],
                available_grams=inv[6],
                utilization=inv[7],
            )
        )

    for c in (
        ("cfr1", "اجرت درصدی النگو (گرید A)", "bracelet", "percent", 14.5, True, "رویال"),
        ("cfr2", "اجرت ثابت زنجیر ظریف", "necklace", "fixed_per_gram", 120_000, True, None),
        ("cfr3", "اجرت شمش شرکتی", "bar", "percent", 2, False, None),
        ("cfr4", "اجرت انگشتر امضا", "ring", "percent", 18, True, "امضای دیدار"),
    ):
        db.add(
            CraftFeeRule(
                id=c[0],
                name=c[1],
                category=c[2],
                method=c[3],
                value=c[4],
                active=c[5],
                collection=c[6],
            )
        )

    gold = settings.live_gold_price_per_gram
    for r in (
        ("rr1", gold, 18_450_000, "نوسانات شدید ارزی غیررسمی", "pending", "نیما شریفی", "امروز ۱۰:۱۲", "پایان شیفت"),
        ("rr2", gold, 18_600_000, "تنظیم رقابتی بازار منطقه", "pending", "نیما شریفی", "دیروز ۱۶:۴۰", "۲۴ ساعت"),
    ):
        db.add(
            RateRequest(
                id=r[0],
                current_rate=r[1],
                proposed_rate=r[2],
                reason=r[3],
                status=r[4],
                requested_by=r[5],
                created_label=r[6],
                valid_until_label=r[7],
            )
        )

    for ca in CREDIT_ACCOUNTS:
        db.add(
            CreditAccount(
                id=ca[0],
                org_id=ca[1],
                retailer_name=ca[2],
                ceiling_grams=ca[3],
                used_grams=ca[4],
                ceiling_irr=ca[5],
                used_irr=ca[6],
                overdue_grams=ca[7],
                blocked=ca[8],
            )
        )
    for cd in CREDIT_DOCS:
        db.add(
            CreditDocument(
                id=cd[0],
                account_id=cd[1],
                code=cd[2],
                retailer_name=cd[3],
                amount_irr=cd[4],
                weight_grams=cd[5],
                due_date_label=cd[6],
                overdue_days=cd[7],
                status=cd[8],
            )
        )

    pf = Proforma(
        id="pf1",
        code="PF-1405-018",
        retailer_name="گالری مهر طلا",
        agent_name="نوید رستمی",
        rate_per_gram=gold,
        lock_id=None,
        lock_expires_at=None,
        status="issued",
        total_irr=152_000_000,
        created_label="امروز ۰۹:۲۰",
    )
    db.add(pf)
    db.flush()
    db.add(
        ProformaLine(
            proforma_id="pf1",
            uid="DDR-18K-ATR01",
            name="گردنبند آترین",
            weight_grams=7.2,
            craft_fee_pct=14,
        )
    )

    for dl in (
        ("dl1", "DOC-9021", "شمش / قطعه خزانه", "خزانه مرکزی", 1500, 0, 27_867_300_000_000, 0, "receipt", "۱۴۰۵/۰۵/۱۲"),
        ("dl2", "DOC-9018", "حواله فروش عمده", "شعبه بازار", 0, 450.25, 0, 8_360_000_000_000, "sale", "۱۴۰۵/۰۵/۱۱"),
        ("dl3", "DOC-9015", "انتقال به گالری سیار", "خزانه مرکزی", 0, 86.4, 0, 1_605_000_000_000, "transfer", "۱۴۰۵/۰۵/۱۰"),
        # Receipt matching seeded ATR01 UID seal
        ("dl4", "UID-ATR01", "گردنبند آترین", "خزانه مرکزی", 7.2, 0, round(7.2 * gold * settings.irt_to_irr), 0, "receipt", "۱۴۰۵/۰۵/۱۰"),
        # Sale matching seeded proforma (IRT total * IRT_TO_IRR)
        ("dl5", "PF-1405-018", "پیش‌فاکتور گالری مهر طلا", "گالری سیار", 0, 7.2, 0, round(152_000_000 * settings.irt_to_irr), "sale", "۱۴۰۵/۰۵/۱۵"),
    ):
        db.add(
            DualLedgerEntry(
                id=dl[0],
                doc_code=dl[1],
                entity=dl[2],
                warehouse=dl[3],
                weight_debit=dl[4],
                weight_credit=dl[5],
                irr_debit=dl[6],
                irr_credit=dl[7],
                kind=dl[8],
                locked=True,
                date_label=dl[9],
            )
        )

    for ae in (
        ("ae1", "قیمت‌گذاری", "نیما شریفی", "کارشناس قیمت‌گذاری", "درخواست تغییر دستی نرخ", "نرخ ۱۸ عیار", "10.0.12.44", "ok", "۱۴۰۵/۰۵/۱۵ ۱۴:۳۲"),
        ("ae2", "کنترل کیفیت", "مریم کاظمی", "عملیات کاتالوگ و QC", "تایید کیفی قطعه", "PHY-8824-B", "10.0.12.18", "ok", "۱۴۰۵/۰۵/۱۵ ۱۰:۴۵"),
        ("ae3", "انبار", "حسین پاکروان", "مسئول UID و انبار", "صدور دسته UID", "۵۰ عدد", "10.0.12.21", "ok", "۱۴۰۵/۰۵/۱۵ ۰۹:۳۰"),
        ("ae4", "سیستم", "سیستم", "خودکار", "همگام‌سازی قیمت با بازار", "TGJU", "—", "error", "۱۴۰۵/۰۵/۱۴ ۱۶:۲۰"),
    ):
        db.add(
            AuditEvent(
                id=ae[0],
                module=ae[1],
                actor=ae[2],
                role=ae[3],
                action=ae[4],
                entity=ae[5],
                ip=ae[6],
                status=ae[7],
                timestamp_label=ae[8],
            )
        )

    db.add(
        Adjustment(
            id="adj1",
            code="ADJ-014",
            reason="اصلاح خطای توزین شیفت قبل",
            weight_delta=-0.12,
            irr_delta=-2_200_000_000,
            created_by="کامبیز نوری",
            created_label="۱۴۰۵/۰۵/۰۹",
        )
    )

    for d in (
        ("d1", "DLV-8841", "نوید رستمی", "خزانه تهران-الف", "گالری مهر طلا", 6, 54.2, "awaiting_otp", True, "امروز · ۱۶:۳۰"),
        ("d2", "DLV-8836", "نوید رستمی", "خزانه تهران-الف", "بنکداری پارسا", 14, 198.4, "packing", True, "امروز · ۱۸:۰۰"),
        ("d3", "DLV-8820", "مینا سلطانی", "خزانه دبی-ب", "بوتيك نور", 4, 31.8, "completed", True, "۱۰ مرداد · ۱۱:۲۰"),
        ("d4", "DLV-8848", "نوید رستمی", "کارگاه آتلیه نوا", "خزانه تهران-الف", 18, 240.0, "picking", False, "۱۶ مرداد · ۰۹:۰۰"),
        ("d5", "DLV-8852", "نوید رستمی", "خزانه تهران-الف", "گالری مهر طلا", 3, 22.1, "handover", True, "امروز · ۱۴:۰۰"),
    ):
        db.add(
            Delivery(
                id=d[0],
                code=d[1],
                agent=d[2],
                from_location=d[3],
                to_location=d[4],
                pieces=d[5],
                weight_grams=d[6],
                status=d[7],
                otp_required=d[8],
                scheduled_label=d[9],
            )
        )

    for o in (
        ("o1", "ORD-24081", "گالری مهر طلا", 12, 186.4, 1_684_000_000, "confirmed", "۱۴۰۵/۰۵/۱۴", "۱۷ مرداد"),
        ("o2", "ORD-24077", "بنکداری پارسا", 28, 412.1, 3_642_000_000, "picking", "۱۴۰۵/۰۵/۱۳", "۱۶ مرداد"),
        ("o3", "ORD-24070", "گالری مهر طلا", 6, 54.2, 498_000_000, "shipped", "۱۴۰۵/۰۵/۱۲", "۱۵ مرداد"),
        ("o4", "ORD-24061", "بوتيك نور", 4, 31.8, 289_000_000, "delivered", "۱۴۰۵/۰۵/۰۷", "۱۰ مرداد"),
        ("o5", "ORD-24088", "بنکداری پارسا", 9, 98.5, 912_000_000, "submitted", "۱۴۰۵/۰۵/۱۵", "۱۹ مرداد"),
        ("o6", "ORD-24055", "بوتيك نور", 2, 14.1, 126_000_000, "cancelled", "۱۴۰۵/۰۵/۰۳", "—"),
    ):
        db.add(
            Order(
                id=o[0],
                code=o[1],
                retailer=o[2],
                items=o[3],
                total_weight=o[4],
                value=o[5],
                status=o[6],
                created_label=o[7],
                eta_label=o[8],
            )
        )

    if db.query(ProducerSettlement).count() == 0:
        db.add(
            ProducerSettlement(
                id="ps1",
                code="PS-1001",
                producer="آتلیه نوا",
                weight_grams=412.5,
                amount_irr=3_850_000_000,
                status="pending",
                period_label="مرداد ۱۴۰۵",
                created_label="۱۴۰۵/۰۵/۱۰",
            )
        )
        db.add(
            ProducerSettlement(
                id="ps2",
                code="PS-1000",
                producer="خانه ساخت دیدار گلد",
                weight_grams=980.0,
                amount_irr=9_120_000_000,
                status="settled",
                period_label="تیر ۱۴۰۵",
                created_label="۱۴۰۵/۰۴/۲۸",
                settled_label="۱۴۰۵/۰۵/۰۲",
            )
        )

    if db.query(Promotion).count() == 0:
        db.add(
            Promotion(
                id="promo1",
                name="جشنواره امضای دیدار",
                collection="امضای دیدار",
                discount_pct=2.5,
                active=True,
                status="active",
                created_label="۱۴۰۵/۰۵/۰۱",
            )
        )

    db.commit()
    return {
        "organizations": len(ORGS),
        "users": len(USERS),
        "skus": len(SKUS),
        "assets": len(ASSETS),
        "proformas": 1,
        "credit_accounts": len(CREDIT_ACCOUNTS),
    }
