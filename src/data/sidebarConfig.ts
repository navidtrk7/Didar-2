export interface SidebarSubItem {
  id: string;
  label: string;
  href: string;
  requiredPermission?: string;
  badge?: string;
}

export interface SidebarDomainItem {
  id: string;
  label: string;
  href: string;
  iconName: string;
  requiredPermission: string;
  subItems: SidebarSubItem[];
}

export const SIDEBAR_DOMAINS: SidebarDomainItem[] = [
  {
    id: "network",
    label: "۱. شبکه",
    href: "/app/network",
    iconName: "Users",
    requiredPermission: "network.view",
    subItems: [
      { id: "retailers", label: "خرده‌فروشان", href: "/app/network/retailers", requiredPermission: "network.view" },
      { id: "producers", label: "تولیدکنندگان", href: "/app/network/producers", requiredPermission: "network.view" },
      { id: "agents", label: "ایجنت‌ها", href: "/app/network/agents", requiredPermission: "network.view" },
      { id: "onboarding", label: "درخواست‌های عضویت", href: "/app/network/onboarding", requiredPermission: "network.manage" },
    ],
  },
  {
    id: "product",
    label: "۲. محصول",
    href: "/app/product",
    iconName: "Package",
    requiredPermission: "product.view",
    subItems: [
      { id: "skus", label: "تعریف محصول و SKU", href: "/app/product/skus", requiredPermission: "product.view" },
      { id: "collections", label: "کالکشن‌ها", href: "/app/product/collections", requiredPermission: "product.view" },
      { id: "gallery", label: "مدیریت تصاویر", href: "/app/product/gallery", requiredPermission: "product.view" },
      { id: "qc", label: "کنترل کیفیت QC", href: "/app/product/qc", requiredPermission: "product.qc_approve", badge: "QC" },
      { id: "approvals", label: "تأیید نهایی ورود", href: "/app/product/approvals", requiredPermission: "product.qc_approve" },
    ],
  },
  {
    id: "inventory",
    label: "۳. موجودی و UID",
    href: "/app/inventory",
    iconName: "Boxes",
    requiredPermission: "inventory.view",
    subItems: [
      { id: "uids", label: "صدور UID", href: "/app/inventory/uids", requiredPermission: "inventory.uid_issue" },
      { id: "vault", label: "انبار مرکزی", href: "/app/inventory/vault", requiredPermission: "inventory.view" },
      { id: "allocations", label: "تخصیص و سبد سیار", href: "/app/inventory/allocations", requiredPermission: "inventory.allocate" },
      { id: "custody", label: "تاریخچه Custody", href: "/app/inventory/custody", requiredPermission: "inventory.custody" },
      { id: "discrepancies", label: "مغایرت انبار", href: "/app/inventory/discrepancies", requiredPermission: "inventory.view" },
    ],
  },
  {
    id: "commerce",
    label: "۴. تجارت",
    href: "/app/commerce",
    iconName: "ShoppingCart",
    requiredPermission: "commerce.view",
    subItems: [
      { id: "catalog", label: "گالری محصول", href: "/app/commerce/catalog", requiredPermission: "commerce.view" },
      { id: "pricing", label: "قیمت‌گذاری و اجرت", href: "/app/commerce/pricing", requiredPermission: "commerce.pricing" },
      { id: "orders", label: "سفارش‌ها و پیش‌فاکتور", href: "/app/commerce/orders", requiredPermission: "commerce.order" },
      { id: "promotions", label: "پروموشن", href: "/app/commerce/promotions", requiredPermission: "commerce.promotion" },
    ],
  },
  {
    id: "fulfillment",
    label: "۵. تحقق سفارش",
    href: "/app/fulfillment",
    iconName: "Truck",
    requiredPermission: "fulfillment.view",
    subItems: [
      { id: "picking", label: "Pick & Pack", href: "/app/fulfillment/picking", requiredPermission: "fulfillment.stage" },
      { id: "handover", label: "تحویل به ایجنت", href: "/app/fulfillment/handover", requiredPermission: "fulfillment.deliver" },
      { id: "deliveries", label: "تحویل و OTP", href: "/app/fulfillment/deliveries", requiredPermission: "fulfillment.deliver" },
      { id: "missions", label: "وضعیت مأموریت‌ها", href: "/app/fulfillment/missions", requiredPermission: "fulfillment.view" },
    ],
  },
  {
    id: "finance",
    label: "۶. مالی",
    href: "/app/finance",
    iconName: "CreditCard",
    requiredPermission: "finance.view",
    subItems: [
      { id: "credit", label: "اعتبار و Exposure", href: "/app/finance/credit", requiredPermission: "finance.credit" },
      { id: "receivables", label: "مطالبات و تجزیه سنی", href: "/app/finance/receivables", requiredPermission: "finance.view" },
      { id: "settlements", label: "تسویه زرین/نقدی", href: "/app/finance/settlements", requiredPermission: "finance.settlement" },
      { id: "ledger", label: "دفتر کل دوگانه (Dual Ledger)", href: "/app/finance/ledger", requiredPermission: "finance.ledger" },
      { id: "discrepancies", label: "مغایرت مالی", href: "/app/finance/discrepancies", requiredPermission: "finance.ledger" },
    ],
  },
  {
    id: "service",
    label: "۷. خدمات و چرخه عمر",
    href: "/app/service",
    iconName: "ShieldCheck",
    requiredPermission: "service.view",
    subItems: [
      { id: "warranty", label: "گارانتی و وارانتی", href: "/app/service/warranty", requiredPermission: "service.warranty" },
      { id: "returns", label: "مرجوعی", href: "/app/service/returns", requiredPermission: "service.view" },
      { id: "buyback", label: "بازخرید طلا", href: "/app/service/buyback", requiredPermission: "service.view" },
      { id: "lifecycle", label: "تاریخچه مالکیت UID", href: "/app/service/lifecycle", requiredPermission: "service.lifecycle" },
    ],
  },
  {
    id: "relationship",
    label: "۸. مشتری و ارتباطات",
    href: "/app/relationship",
    iconName: "UserCheck",
    requiredPermission: "relationship.view",
    subItems: [
      { id: "customers", label: "پروفایل مشتریان", href: "/app/relationship/customers", requiredPermission: "relationship.view" },
      { id: "loyalty", label: "سطوح وفاداری", href: "/app/relationship/loyalty", requiredPermission: "relationship.view" },
      { id: "notes", label: "یادداشت‌های ایجنت", href: "/app/relationship/notes", requiredPermission: "relationship.manage" },
      { id: "campaigns", label: "کمپین و مارکتینگ", href: "/app/relationship/campaigns", requiredPermission: "relationship.manage" },
    ],
  },
  {
    id: "intelligence",
    label: "۹. داده و هوش تجاری",
    href: "/app/intelligence",
    iconName: "BarChart3",
    requiredPermission: "intelligence.view",
    subItems: [
      { id: "sales", label: "گزارش فروش و عملکرد", href: "/app/intelligence/sales", requiredPermission: "intelligence.view" },
      { id: "behavior", label: "تحلیل رفتار", href: "/app/intelligence/behavior", requiredPermission: "intelligence.view" },
      { id: "forecast", label: "پیش‌بینی تقاضا", href: "/app/intelligence/forecast", requiredPermission: "intelligence.view" },
      { id: "recommendations", label: "پیشنهاد محصول", href: "/app/intelligence/recommendations", requiredPermission: "intelligence.view" },
    ],
  },
  {
    id: "governance",
    label: "۱۰. تنظیمات مدیریتی",
    href: "/app/governance",
    iconName: "ShieldAlert",
    requiredPermission: "governance.view",
    subItems: [
      { id: "users", label: "مدیریت کاربران", href: "/app/governance/users", requiredPermission: "governance.users" },
      { id: "profile", label: "پروفایل - Profile Management", href: "/app/governance/profile", requiredPermission: "governance.view" },
      { id: "roles", label: "مدیریت نقش‌ها", href: "/app/governance/roles", requiredPermission: "governance.users" },
      { id: "permissions", label: "سطوح دسترسی", href: "/app/governance/permissions", requiredPermission: "governance.users" },
      { id: "audit", label: "گزارش فعالیت", href: "/app/governance/audit", requiredPermission: "governance.audit" },
    ],
  },
];
