import type {
  AdjustmentDoc,
  AuditEvent,
  CraftFeeMethod,
  CraftFeeRule,
  CreditAccount,
  CreditDocument,
  DualLedgerEntry,
  PermissionKey,
  Proforma,
  QcInspection,
  RateRequest,
  RoleId,
  SkuItem,
  SystemSettings,
} from "./types";

export const systemSettingsSeed: SystemSettings = {
  weightToleranceGrams: 0.05,
  priceLockMinutes: 3,
  proformaTtlMinutes: 15,
  defaultKarat: 18,
  rateSource: "tgju",
  currency: "IRT",
};

export const skuItemsSeed: SkuItem[] = [
  {
    id: "sku1",
    name: "انگشتر رز روژان",
    category: "ring",
    skuCode: "RG-RJN-18K",
    karat: 18,
    catalogWeight: 4.2,
    status: "awaiting_qc",
    collection: "روژان",
    imageUrl: "/products/product-03.jpg",
    createdAt: "۱۴۰۵/۰۵/۱۲",
  },
  {
    id: "sku2",
    name: "گردنبند مهتاب",
    category: "necklace",
    skuCode: "NK-MHT-18K",
    karat: 18,
    catalogWeight: 7.1,
    status: "awaiting_qc",
    collection: "مهتاب",
    imageUrl: "/products/product-06.jpg",
    createdAt: "۱۴۰۵/۰۵/۱۱",
  },
  {
    id: "sku3",
    name: "دستبند ویرا کلاسیک",
    category: "bracelet",
    skuCode: "BR-VIR-18K",
    karat: 18,
    catalogWeight: 11.5,
    status: "needs_rework",
    collection: "امضای دیدار",
    imageUrl: "/products/product-02.jpg",
    createdAt: "۱۴۰۵/۰۵/۰۹",
  },
  {
    id: "sku4",
    name: "گوشواره نادیا",
    category: "earring",
    skuCode: "ER-NAD-18K",
    karat: 18,
    catalogWeight: 5.6,
    status: "approved",
    collection: "مراسم",
    imageUrl: "/products/product-04.jpg",
    createdAt: "۱۴۰۵/۰۵/۰۸",
  },
  {
    id: "sku5",
    name: "انگشتر لیلا",
    category: "ring",
    skuCode: "RG-LEI-18K",
    karat: 18,
    catalogWeight: 4.2,
    status: "draft",
    collection: "امضای دیدار",
    imageUrl: "/products/product-05.jpg",
    createdAt: "۱۴۰۵/۰۵/۱۴",
  },
  {
    id: "sku6",
    name: "گردنبند آترین",
    category: "necklace",
    skuCode: "NK-ATR-18K",
    karat: 18,
    catalogWeight: 7.2,
    status: "approved",
    collection: "امضای دیدار",
    imageUrl: "/products/product-01.jpg",
    createdAt: "۱۴۰۵/۰۵/۰۷",
  },
];

export const qcQueueSeed: QcInspection[] = [
  {
    id: "qc1",
    skuId: "sku1",
    physicalCode: "PHY-8823-A",
  },
  {
    id: "qc2",
    skuId: "sku2",
    physicalCode: "PHY-8824-B",
  },
  {
    id: "qc3",
    skuId: "sku3",
    physicalCode: "PHY-8801-C",
    measuredWeight: 11.62,
    result: "rework",
    notes: "اختلاف وزن بیش از تلورانس",
    inspectedAt: "۱۴۰۵/۰۵/۱۰",
    inspector: "مریم کاظمی",
  },
];

export const craftFeeRulesSeed: CraftFeeRule[] = [
  {
    id: "cfr1",
    name: "اجرت درصدی النگو (گرید A)",
    category: "bracelet",
    method: "percent",
    value: 14.5,
    active: true,
    collection: "رویال",
  },
  {
    id: "cfr2",
    name: "اجرت ثابت زنجیر ظریف",
    category: "necklace",
    method: "fixed_per_gram",
    value: 120_000,
    active: true,
  },
  {
    id: "cfr3",
    name: "اجرت شمش شرکتی",
    category: "bar",
    method: "percent",
    value: 2,
    active: false,
  },
  {
    id: "cfr4",
    name: "اجرت انگشتر امضا",
    category: "ring",
    method: "percent",
    value: 18,
    active: true,
    collection: "امضای دیدار",
  },
];

export const rateRequestsSeed: RateRequest[] = [
  {
    id: "rr1",
    currentRate: 18_578_200,
    proposedRate: 18_450_000,
    reason: "نوسانات شدید ارزی غیررسمی",
    status: "pending",
    requestedBy: "نیما شریفی",
    createdAt: "امروز ۱۰:۱۲",
    validUntil: "پایان شیفت",
  },
  {
    id: "rr2",
    currentRate: 18_578_200,
    proposedRate: 18_600_000,
    reason: "تنظیم رقابتی بازار منطقه",
    status: "pending",
    requestedBy: "نیما شریفی",
    createdAt: "دیروز ۱۶:۴۰",
    validUntil: "۲۴ ساعت",
  },
];

export const creditAccountsSeed: CreditAccount[] = [
  {
    id: "ca1",
    retailer: "گالری مهر طلا",
    ceilingGrams: 12_500,
    usedGrams: 4_300,
    ceilingIrr: 5_000_000_000_000,
    usedIrr: 1_720_000_000_000,
    overdueGrams: 0,
    blocked: false,
  },
  {
    id: "ca2",
    retailer: "گالری زمرد",
    ceilingGrams: 8_000,
    usedGrams: 6_800,
    ceilingIrr: 3_200_000_000_000,
    usedIrr: 2_720_000_000_000,
    overdueGrams: 150,
    blocked: true,
  },
  {
    id: "ca3",
    retailer: "بنکداری پارسا",
    ceilingGrams: 20_000,
    usedGrams: 9_100,
    ceilingIrr: 8_000_000_000_000,
    usedIrr: 3_640_000_000_000,
    overdueGrams: 40,
    blocked: false,
  },
];

export const creditDocumentsSeed: CreditDocument[] = [
  {
    id: "cd1",
    code: "DOC-8942",
    retailer: "گالری زمرد",
    amountIrr: 420_000_000_000,
    weightGrams: 120,
    dueDate: "۱۴۰۵/۰۲/۱۸",
    overdueDays: 72,
    status: "overdue",
  },
  {
    id: "cd2",
    code: "DOC-9011",
    retailer: "بنکداری پارسا",
    amountIrr: 85_000_000_000,
    weightGrams: 40,
    dueDate: "۱۴۰۵/۰۴/۰۲",
    overdueDays: 18,
    status: "overdue",
  },
  {
    id: "cd3",
    code: "DOC-9102",
    retailer: "گالری مهر طلا",
    amountIrr: 210_000_000_000,
    weightGrams: 95,
    dueDate: "۱۴۰۵/۰۶/۰۱",
    overdueDays: 0,
    status: "open",
  },
];

export const proformasSeed: Proforma[] = [
  {
    id: "pf1",
    code: "PF-1405-018",
    retailer: "گالری مهر طلا",
    agent: "نوید رستمی",
    lines: [
      {
        uid: "DDR-18K-ATR01",
        name: "گردنبند آترین",
        weightGrams: 7.2,
        craftFeePct: 14,
      },
    ],
    ratePerGram: 18_578_200,
    lockExpiresAt: null,
    status: "issued",
    createdAt: "امروز ۰۹:۲۰",
    totalIrr: 152_000_000,
  },
];

export const dualLedgerSeed: DualLedgerEntry[] = [
  {
    id: "dl1",
    docCode: "DOC-9021",
    entity: "شمش / قطعه خزانه",
    warehouse: "خزانه مرکزی",
    weightDebit: 1_500,
    weightCredit: 0,
    irrDebit: 27_867_300_000_000,
    irrCredit: 0,
    kind: "receipt",
    locked: true,
    date: "۱۴۰۵/۰۵/۱۲",
  },
  {
    id: "dl2",
    docCode: "DOC-9018",
    entity: "حواله فروش عمده",
    warehouse: "شعبه بازار",
    weightDebit: 0,
    weightCredit: 450.25,
    irrDebit: 0,
    irrCredit: 8_360_000_000_000,
    kind: "sale",
    locked: true,
    date: "۱۴۰۵/۰۵/۱۱",
  },
  {
    id: "dl3",
    docCode: "DOC-9015",
    entity: "انتقال به گالری سیار",
    warehouse: "خزانه مرکزی",
    weightDebit: 0,
    weightCredit: 86.4,
    irrDebit: 0,
    irrCredit: 1_605_000_000_000,
    kind: "transfer",
    locked: true,
    date: "۱۴۰۵/۰۵/۱۰",
  },
];

export const adjustmentsSeed: AdjustmentDoc[] = [
  {
    id: "adj1",
    code: "ADJ-014",
    reason: "اصلاح خطای توزین شیفت قبل",
    weightDelta: -0.12,
    irrDelta: -2_200_000_000,
    createdBy: "کامبیز نوری",
    createdAt: "۱۴۰۵/۰۵/۰۹",
  },
];

export const auditEventsSeed: AuditEvent[] = [
  {
    id: "ae1",
    module: "قیمت‌گذاری",
    actor: "نیما شریفی",
    role: "کارشناس قیمت‌گذاری",
    action: "درخواست تغییر دستی نرخ",
    entity: "نرخ ۱۸ عیار",
    ip: "10.0.12.44",
    status: "ok",
    timestamp: "۱۴۰۵/۰۵/۱۵ ۱۴:۳۲",
  },
  {
    id: "ae2",
    module: "کنترل کیفیت",
    actor: "مریم کاظمی",
    role: "عملیات کاتالوگ و QC",
    action: "تایید کیفی قطعه",
    entity: "PHY-8824-B",
    ip: "10.0.12.18",
    status: "ok",
    timestamp: "۱۴۰۵/۰۵/۱۵ ۱۰:۴۵",
  },
  {
    id: "ae3",
    module: "انبار",
    actor: "حسین پاکروان",
    role: "مسئول UID و انبار",
    action: "صدور دسته UID",
    entity: "۵۰ عدد",
    ip: "10.0.12.21",
    status: "ok",
    timestamp: "۱۴۰۵/۰۵/۱۵ ۰۹:۳۰",
  },
  {
    id: "ae4",
    module: "سیستم",
    actor: "سیستم",
    role: "خودکار",
    action: "همگام‌سازی قیمت با بازار",
    entity: "TGJU",
    ip: "—",
    status: "error",
    timestamp: "۱۴۰۵/۰۵/۱۴ ۱۶:۲۰",
  },
];

export const permissionMatrixSeed: Record<
  PermissionKey,
  Partial<Record<RoleId, boolean>>
> = {
  sku_create: { admin: true, qc: true },
  qc_approve: { admin: true, qc: true },
  uid_issue: { admin: true, warehouse: true },
  manual_rate: { admin: true, pricing: true },
  view_ledger: { admin: true, finance: true },
  view_catalog: {
    admin: true,
    qc: true,
    warehouse: true,
    pricing: true,
    agent: true,
    retailer: true,
    finance: true,
    customer: true,
  },
  issue_proforma: { admin: true, agent: true },
  manage_credit: { admin: true, finance: true },
};

export const permissionLabels: Record<PermissionKey, string> = {
  sku_create: "ایجاد SKU جدید",
  qc_approve: "تایید کنترل کیفیت",
  uid_issue: "صدور شناسه یکتا",
  manual_rate: "تغییر دستی قیمت",
  view_ledger: "مشاهده دفتر کل",
  view_catalog: "مشاهده کاتالوگ",
  issue_proforma: "صدور پیش‌فاکتور",
  manage_credit: "مدیریت اعتبار",
};

/** محاسبه قیمت شبیه‌ساز اجرت */
export function simulatePrice(input: {
  weightGrams: number;
  ratePerGram: number;
  craftMethod: CraftFeeMethod;
  craftValue: number;
  sellerMarginPct?: number;
  vatPct?: number;
}) {
  const metal = input.weightGrams * input.ratePerGram;
  const craft =
    input.craftMethod === "percent"
      ? metal * (input.craftValue / 100)
      : input.weightGrams * input.craftValue;
  const marginPct = input.sellerMarginPct ?? 7;
  const vatPct = input.vatPct ?? 9;
  const margin = (metal + craft) * (marginPct / 100);
  const vatBase = craft + margin;
  const vat = vatBase * (vatPct / 100);
  const total = metal + craft + margin + vat;
  return { metal, craft, margin, vat, total };
}

export function proformaTotal(
  lines: { weightGrams: number; craftFeePct: number }[],
  ratePerGram: number,
) {
  return lines.reduce((sum, line) => {
    const metal = line.weightGrams * ratePerGram;
    const craft = metal * (line.craftFeePct / 100);
    return sum + metal + craft;
  }, 0);
}
