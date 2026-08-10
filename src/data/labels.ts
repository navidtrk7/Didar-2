import type {
  AssetStatus,
  DeliveryStatus,
  OrderStatus,
  RoleId,
  SkuStatus,
  ProformaStatus,
  RateRequestStatus,
} from "./types";

export const roleLabels: Record<RoleId, string> = {
  admin: "مدیر کل سیستم",
  qc: "عملیات کاتالوگ و QC",
  warehouse: "مسئول UID و انبار",
  pricing: "کارشناس قیمت‌گذاری",
  agent: "ایجنت فروش",
  retailer: "خرده‌فروش",
  finance: "مدیر مالی",
  customer: "مشتری نهایی",
  producer: "تولیدکننده",
};

export const assetStatusLabels: Record<AssetStatus, string> = {
  pending_qc: "منتظر QC",
  awaiting_uid: "منتظر UID",
  available: "موجود",
  reserved: "رزرو شده",
  in_transit: "در حال انتقال",
  delivered: "تحویل‌شده",
  qc_hold: "توقف کیفی",
  discrepancy: "اختلاف فیزیکی",
  buyback: "بازخرید",
  returned: "مرجوعی",
  secondary: "بازار ثانویه",
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  draft: "پیش‌نویس",
  submitted: "ثبت‌شده",
  confirmed: "تأییدشده",
  picking: "در حال آماده‌سازی",
  shipped: "ارسال‌شده",
  delivered: "تحویل کامل",
  cancelled: "لغو شده",
};

export const deliveryStatusLabels: Record<DeliveryStatus, string> = {
  scheduled: "زمان‌بندی‌شده",
  picking: "برداشت",
  packing: "بسته‌بندی",
  handover: "تحویل به ایجنت",
  en_route: "در مسیر",
  awaiting_otp: "در انتظار کد تأیید",
  completed: "تکمیل‌شده",
  failed: "ناموفق",
};

export const skuStatusLabels: Record<SkuStatus, string> = {
  draft: "پیش‌نویس",
  awaiting_qc: "منتظر QC",
  needs_rework: "نیازمند اصلاح",
  approved: "تأییدشده",
};

export const proformaStatusLabels: Record<ProformaStatus, string> = {
  draft: "پیش‌نویس",
  issued: "صادرشده",
  expired: "منقضی",
  cancelled: "لغو شده",
};

export const rateRequestStatusLabels: Record<RateRequestStatus, string> = {
  pending: "در انتظار",
  approved: "تأییدشده",
  rejected: "ردشده",
};

export const categoryLabels = {
  ring: "انگشتر",
  necklace: "گردنبند",
  bracelet: "دستبند",
  earring: "گوشواره",
  bar: "شمش",
  coin: "سکه",
  plaque: "پلاک هنری",
} as const;

export const inventoryTypeLabels = {
  vault: "خزانه",
  branch: "شعبه",
  mobile: "گالری سیار",
  workshop: "کارگاه",
} as const;

export const userStatusLabels = {
  active: "فعال",
  invited: "دعوت‌شده",
  suspended: "معلق",
} as const;

export const designStatusLabels = {
  live: "فعال",
  review: "در بررسی",
  paused: "متوقف",
} as const;

export const ledgerTypeLabels = {
  weight: "وزنی",
  custody: "مسئولیت",
  order: "سفارش",
  financial: "مالی",
  qc: "کیفی",
} as const;
