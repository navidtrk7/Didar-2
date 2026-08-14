import type { RoleId } from "./types";

export interface ShortcutItem {
  id: string;
  title: string;
  href: string;
  icon: string;
  domainId: string;
  category: string;
  description: string;
  allowedRoles: RoleId[];
}

export const ALL_SHORTCUTS: ShortcutItem[] = [
  // Network
  {
    id: "net-retailers",
    title: "فهرست خرده‌فروشان",
    href: "/app/network/retailers",
    icon: "Users",
    domainId: "network",
    category: "شبکه",
    description: "مشاهده و مدیریت گالری‌ها و فروشگاه‌های طلا",
    allowedRoles: ["admin", "agent", "finance"],
  },
  {
    id: "net-producers",
    title: "تولیدکنندگان و کارگاه‌ها",
    href: "/app/network/producers",
    icon: "Building2",
    domainId: "network",
    category: "شبکه",
    description: "ارزیابی و رتبه‌بندی کیفی کارگاه‌های طلاسازی",
    allowedRoles: ["admin", "qc", "finance"],
  },
  {
    id: "net-agents",
    title: "فهرست ایجنت‌های فروش",
    href: "/app/network/agents",
    icon: "UserCheck",
    domainId: "network",
    category: "شبکه",
    description: "پایش عملکرد میدانی و تخصیص منطقه ایجنت‌ها",
    allowedRoles: ["admin"],
  },
  {
    id: "net-onboarding",
    title: "درخواست‌های عضویت",
    href: "/app/network/onboarding",
    icon: "UserPlus",
    domainId: "network",
    category: "شبکه",
    description: "بررسی مدارک و تایید صلاحیت گالری‌های جدید",
    allowedRoles: ["admin", "agent"],
  },

  // Product
  {
    id: "prod-skus",
    title: "تعریف محصول و SKU",
    href: "/app/product/skus",
    icon: "PackagePlus",
    domainId: "product",
    category: "محصول",
    description: "ثبت شناسه فنی کاتالوگ، عیار و وزن استاندارد",
    allowedRoles: ["admin", "producer", "qc"],
  },
  {
    id: "prod-collections",
    title: "کالکشن‌ها و مدل‌ها",
    href: "/app/product/collections",
    icon: "Sparkles",
    domainId: "product",
    category: "محصول",
    description: "مدیریت آلبوم‌ها و کلکسیون‌های فصلی طلا",
    allowedRoles: ["admin", "retailer", "agent"],
  },
  {
    id: "prod-qc",
    title: "صف کنترل کیفیت (QC)",
    href: "/app/product/qc",
    icon: "CheckCircle2",
    domainId: "product",
    category: "محصول",
    description: "بررسی عیار، وزن دقیق و صدور تاییدیه ورود",
    allowedRoles: ["admin", "qc"],
  },
  {
    id: "prod-gallery",
    title: "مدیریت تصاویر کاتالوگ",
    href: "/app/product/gallery",
    icon: "Image",
    domainId: "product",
    category: "محصول",
    description: "بارگذاری و ادیت تصاویر رسمی محصولات",
    allowedRoles: ["admin", "qc"],
  },

  // Inventory & UID
  {
    id: "inv-uids",
    title: "صدور UID و پلمب امنیتی",
    href: "/app/inventory/uids",
    icon: "QrCode",
    domainId: "inventory",
    category: "موجودی و UID",
    description: "تولید کارت پلمب DDR با بارکد اختصاصی",
    allowedRoles: ["admin", "warehouse"],
  },
  {
    id: "inv-vault",
    title: "انبار مرکزی و خزانه امن",
    href: "/app/inventory/vault",
    icon: "Boxes",
    domainId: "inventory",
    category: "موجودی و UID",
    description: "موجودی فیزیکی گاوصندوق‌ها و پلمب‌های امن",
    allowedRoles: ["admin", "warehouse", "finance"],
  },
  {
    id: "inv-allocations",
    title: "تخصیص و سبد سیار",
    href: "/app/inventory/allocations",
    icon: "Briefcase",
    domainId: "inventory",
    category: "موجودی و UID",
    description: "انتقال مسئولیت طلا به سبد سیار ایجنت‌ها",
    allowedRoles: ["admin", "warehouse", "agent"],
  },
  {
    id: "inv-discrepancies",
    title: "مغایرت‌های انبار و وزن",
    href: "/app/inventory/discrepancies",
    icon: "AlertTriangle",
    domainId: "inventory",
    category: "موجودی و UID",
    description: "تراز کسری و مغایرت‌های سنجش وزن طلا",
    allowedRoles: ["admin", "warehouse", "finance"],
  },

  // Commerce
  {
    id: "comm-catalog",
    title: "گالری و ویترین سفارش عمده",
    href: "/app/commerce/catalog",
    icon: "ShoppingBag",
    domainId: "commerce",
    category: "تجارت",
    description: "ویترین محصولات لوکس و کاتالوگ فروش B2B",
    allowedRoles: ["admin", "retailer", "agent"],
  },
  {
    id: "comm-pricing",
    title: "موتور قیمت‌گذاری و اجرت",
    href: "/app/commerce/pricing",
    icon: "TrendingUp",
    domainId: "commerce",
    category: "تجارت",
    description: "نرخ زنده طلا ۱۸ و ۲۴ عیار + فرمول سود و کارمزد",
    allowedRoles: ["admin", "pricing", "finance"],
  },
  {
    id: "comm-orders",
    title: "سفارش‌ها و پیش‌فاکتور",
    href: "/app/commerce/orders",
    icon: "FileText",
    domainId: "commerce",
    category: "تجارت",
    description: "مدیریت سفارشات خرده‌فروش و پیش‌فاکتور ایجنت",
    allowedRoles: ["admin", "retailer", "agent", "finance"],
  },
  {
    id: "comm-promotions",
    title: "پروموشن و تخفیف اجرت",
    href: "/app/commerce/promotions",
    icon: "Tag",
    domainId: "commerce",
    category: "تجارت",
    description: "جشنواره‌های کسر از اجرت برای گالری‌های ممتاز",
    allowedRoles: ["admin", "retailer", "pricing"],
  },

  // Fulfillment
  {
    id: "ful-picking",
    title: "برداشت و پکینگ فیزیکی",
    href: "/app/fulfillment/picking",
    icon: "PackageCheck",
    domainId: "fulfillment",
    category: "تحقق سفارش",
    description: "آماده‌سازی بسته طلا و پلمب در کیف امنیتی",
    allowedRoles: ["admin", "warehouse"],
  },
  {
    id: "ful-deliveries",
    title: "تحویل نهایی با کد OTP",
    href: "/app/fulfillment/deliveries",
    icon: "KeyRound",
    domainId: "fulfillment",
    category: "تحقق سفارش",
    description: "انتقال رسمی مالکیت با تایید رمز یکبارمصرف",
    allowedRoles: ["admin", "agent", "retailer"],
  },
  {
    id: "ful-missions",
    title: "مأموریت‌های حمل و لجستیک",
    href: "/app/fulfillment/missions",
    icon: "Truck",
    domainId: "fulfillment",
    category: "تحقق سفارش",
    description: "پایش موقعیت ایجنت‌ها و تحویل‌های در مسیر",
    allowedRoles: ["admin", "agent", "warehouse"],
  },

  // Finance
  {
    id: "fin-credit",
    title: "اعتبار و Exposure گالری‌ها",
    href: "/app/finance/credit",
    icon: "CreditCard",
    domainId: "finance",
    category: "مالی",
    description: "مدیریت سقف خط اعتباری و وثایق گالری‌ها",
    allowedRoles: ["admin", "finance", "retailer"],
  },
  {
    id: "fin-receivables",
    title: "تجزیه سنی مطالبات طلا",
    href: "/app/finance/receivables",
    icon: "Clock",
    domainId: "finance",
    category: "مالی",
    description: "راس‌گیری بدهی‌های سررسیدشده و برنامه وصول",
    allowedRoles: ["admin", "finance", "agent"],
  },
  {
    id: "fin-settlements",
    title: "تسویه زرین و نقدی",
    href: "/app/finance/settlements",
    icon: "BadgeDollarSign",
    domainId: "finance",
    category: "مالی",
    description: "تسویه حساب تولیدکنندگان و درگاه پرداخت",
    allowedRoles: ["admin", "finance", "producer"],
  },
  {
    id: "fin-ledger",
    title: "دفتر کل دوگانه (Dual Ledger)",
    href: "/app/finance/ledger",
    icon: "BookOpen",
    domainId: "finance",
    category: "مالی",
    description: "تراز همزمان بدهی وزنی طلا و مبالغ ریالی",
    allowedRoles: ["admin", "finance"],
  },

  // Service & Lifecycle
  {
    id: "srv-warranty",
    title: "گارانتی و شناسنامه دیجیتال",
    href: "/app/service/warranty",
    icon: "ShieldCheck",
    domainId: "service",
    category: "خدمات",
    description: "فعال‌سازی گارانتی و صدور شناسنامه اصالت طلا",
    allowedRoles: ["admin", "retailer", "customer"],
  },
  {
    id: "srv-buyback",
    title: "بازخرید آنلاین طلا (Buyback)",
    href: "/app/service/buyback",
    icon: "RefreshCw",
    domainId: "service",
    category: "خدمات",
    description: "استعلام قیمت روز بازخرید و تایید نهایی ستاد",
    allowedRoles: ["admin", "retailer", "customer"],
  },
  {
    id: "srv-lifecycle",
    title: "تاریخچه مالکیت UID",
    href: "/app/service/lifecycle",
    icon: "History",
    domainId: "service",
    category: "خدمات",
    description: "ردپای زنجیره تامین از کارگاه تا خریدار نهایی",
    allowedRoles: ["admin", "retailer", "warehouse", "customer"],
  },

  // Relationship & CRM
  {
    id: "crm-customers",
    title: "پروفایل مشتریان نهایی",
    href: "/app/relationship/customers",
    icon: "Users",
    domainId: "relationship",
    category: "ارتباطات",
    description: "پرونده خریداران، سابقه خرید و سلیقه مشتری",
    allowedRoles: ["admin", "agent", "retailer"],
  },
  {
    id: "crm-loyalty",
    title: "سطوح وفاداری و باشگاه",
    href: "/app/relationship/loyalty",
    icon: "Crown",
    domainId: "relationship",
    category: "ارتباطات",
    description: "امتیازات اعتباری، تخفیف پلکانی الماس/طلا/نقره",
    allowedRoles: ["admin", "retailer"],
  },
  {
    id: "crm-notes",
    title: "یادداشت‌های میدانی ایجنت",
    href: "/app/relationship/notes",
    icon: "NotebookPen",
    domainId: "relationship",
    category: "ارتباطات",
    description: "ثبت گزارش بازدید حضوری از گالری‌ها",
    allowedRoles: ["admin", "agent"],
  },

  // Intelligence
  {
    id: "int-sales",
    title: "گزارش فروش و عملکرد",
    href: "/app/intelligence/sales",
    icon: "BarChart3",
    domainId: "intelligence",
    category: "هوش تجاری",
    description: "تحلیل وزنی طلا، درآمد ریالی و روند رشد فروش",
    allowedRoles: ["admin", "finance", "pricing"],
  },
  {
    id: "int-forecast",
    title: "پیش‌بینی تقاضا و هوش ساخت",
    href: "/app/intelligence/forecast",
    icon: "LineChart",
    domainId: "intelligence",
    category: "هوش تجاری",
    description: "پیش‌بینی تقاضای ماه بعد و هوش سفارش کارگاه",
    allowedRoles: ["admin", "producer", "pricing"],
  },

  // Governance
  {
    id: "gov-users",
    title: "کاربران و دسترسی‌ها",
    href: "/app/governance/users",
    icon: "Users",
    domainId: "governance",
    category: "تنظیمات مدیریتی",
    description: "مدیریت پرسنل، نقش‌های سیستمی و دسترسی‌ها",
    allowedRoles: ["admin"],
  },
  {
    id: "gov-profile",
    title: "پروفایل من و ذینفعان",
    href: "/app/governance/profile",
    icon: "UserCheck",
    domainId: "governance",
    category: "تنظیمات مدیریتی",
    description: "مشخصات هویتی، تماس، مدارک و عضویت چندذینفعی",
    allowedRoles: ["admin", "agent", "retailer", "producer", "warehouse", "finance", "qc", "pricing", "customer"],
  },
  {
    id: "gov-roles",
    title: "مدیریت نقش‌ها",
    href: "/app/governance/roles",
    icon: "Shield",
    domainId: "governance",
    category: "تنظیمات مدیریتی",
    description: "تعریف نقش‌های تخصصی و دسترسی‌های ذینفعان",
    allowedRoles: ["admin"],
  },
  {
    id: "gov-permissions",
    title: "ماتریس دسترسی دامنه‌ها",
    href: "/app/governance/permissions",
    icon: "Key",
    domainId: "governance",
    category: "تنظیمات مدیریتی",
    description: "ماتریس ۱۰ دامنه و مجوزهای دسترسی نقش‌ها",
    allowedRoles: ["admin"],
  },
  {
    id: "gov-audit",
    title: "گزارش فعالیت‌ها (Audit Log)",
    href: "/app/governance/audit",
    icon: "History",
    domainId: "governance",
    category: "تنظیمات مدیریتی",
    description: "لاگ امنیتی ورود، تغییرات و رویدادهای تراکنش",
    allowedRoles: ["admin"],
  },
];

// Default pinned shortcuts per role
export const ROLE_DEFAULT_SHORTCUTS: Record<RoleId, string[]> = {
  admin: ["gov-users", "int-sales", "inv-discrepancies", "srv-buyback", "fin-ledger", "net-onboarding"],
  agent: ["comm-orders", "inv-allocations", "crm-notes", "fin-receivables", "comm-catalog", "ful-deliveries"],
  retailer: ["comm-catalog", "comm-orders", "fin-credit", "srv-buyback", "srv-warranty", "crm-loyalty"],
  warehouse: ["inv-uids", "inv-vault", "ful-picking", "inv-allocations", "inv-discrepancies", "srv-lifecycle"],
  finance: ["fin-credit", "fin-receivables", "fin-settlements", "fin-ledger", "int-sales", "inv-discrepancies"],
  qc: ["prod-qc", "prod-skus", "prod-gallery", "inv-vault"],
  pricing: ["comm-pricing", "comm-promotions", "int-sales", "int-forecast"],
  producer: ["prod-skus", "prod-qc", "fin-settlements", "int-forecast"],
  customer: ["srv-warranty", "srv-buyback", "srv-lifecycle", "gov-profile"],
};

// Daily Summary Cards & Pulse per role
export interface RoleDailySummary {
  badge: string;
  metric1: { label: string; value: string; hint: string };
  metric2: { label: string; value: string; hint: string };
  pendingTasks: { id: string; title: string; href: string; tone: "ok" | "warn" | "danger" | "gold" }[];
  mostUsed: { title: string; href: string; uses: string; icon: string }[];
}

export const ROLE_DAILY_SUMMARIES: Record<RoleId, RoleDailySummary> = {
  admin: {
    badge: "مدیریت ارشد ستاد دیدار",
    metric1: { label: "سفارشات جدید امروز", value: "۱۲ سفارش", hint: "حجم کل: ۳۴.۵ گرم طلا" },
    metric2: { label: "موجودی کل خزانه طلا", value: "۴۸.۲ کیلوگرم", hint: "وضعیت پلمب: ۱۰۰٪ سالم" },
    pendingTasks: [
      { id: "t1", title: "۳ سفارش نیازمند تایید اعتبار مالی", href: "/app/commerce/orders", tone: "warn" },
      { id: "t2", title: "۱ درخواست بازخرید آنلاین در صف ارزیابی", href: "/app/service/buyback", tone: "gold" },
      { id: "t3", title: "۲ مغایرت وزنی انبار در شعبه اصفهان", href: "/app/inventory/discrepancies", tone: "danger" },
    ],
    mostUsed: [
      { title: "تنظیمات کاربران و دسترسی‌ها", href: "/app/governance/users", uses: "۴۲ بار در ماه", icon: "Users" },
      { title: "دفتر کل دوگانه طلا و ریال", href: "/app/finance/ledger", uses: "۲۸ بار در ماه", icon: "BookOpen" },
      { title: "گزارش فروش و عملکرد", href: "/app/intelligence/sales", uses: "۲۵ بار در ماه", icon: "BarChart3" },
    ],
  },
  agent: {
    badge: "شبکه میدانی و ویزیتوری",
    metric1: { label: "برنامه بازدیدهای امروز", value: "۵ گالری", hint: "منطقه ۱ و بازار بزرگ" },
    metric2: { label: "طلا در سبد سیار من", value: "۱۸.۵ گرم", hint: "۳ قطعه پلمب DDR آماده تحویل" },
    pendingTasks: [
      { id: "t1", title: "۱ سفارش در انتظار تایید OTP تحویل به گالری مهر", href: "/app/fulfillment/deliveries", tone: "warn" },
      { id: "t2", title: "وصول مطالبات سررسیدشده بنکداری آریا", href: "/app/finance/receivables", tone: "danger" },
    ],
    mostUsed: [
      { title: "ثبت سفارش جدید Act-as", href: "/app/commerce/orders", uses: "۶۵ بار در ماه", icon: "FileText" },
      { title: "ثبت یادداشت و بازخورد ویزیت", href: "/app/relationship/notes", uses: "۵۸ بار در ماه", icon: "NotebookPen" },
      { title: "سبد سیار و تخصیص", href: "/app/inventory/allocations", uses: "۴۲ بار در ماه", icon: "Briefcase" },
    ],
  },
  retailer: {
    badge: "گالری طلا و خرده‌فروش B2B",
    metric1: { label: "اعتبار خرید باقیمانده", value: "۱۲۰,۰۰۰,۰۰۰ تومان", hint: "سقف کل: ۵۰۰ میلیون" },
    metric2: { label: "سفارشات در راه تحویل", value: "۲ بسته DDR", hint: "تحویل با ایجنت تا ساعت ۱۶" },
    pendingTasks: [
      { id: "t1", title: "۴ قطعه طلای خریداری‌شده نیازمند فعال‌سازی گارانتی", href: "/app/service/warranty", tone: "warn" },
      { id: "t2", title: "پیش‌فاکتور جدید شماره PF-1405 آماده تایید", href: "/app/commerce/orders", tone: "gold" },
    ],
    mostUsed: [
      { title: "گالری ویترین و کاتالوگ فروش", href: "/app/commerce/catalog", uses: "۳۱ بار در ماه", icon: "ShoppingBag" },
      { title: "فعال‌سازی گارانتی و شناسنامه", href: "/app/service/warranty", uses: "۱۹ بار در ماه", icon: "ShieldCheck" },
      { title: "وضعیت خط اعتبار و بدهی", href: "/app/finance/credit", uses: "۱۶ بار در ماه", icon: "CreditCard" },
    ],
  },
  warehouse: {
    badge: "خزانه مرکزی و انبار طلا",
    metric1: { label: "ماموریت‌های پکینگ فعال", value: "۴ بسته", hint: "نیازمند بسته‌بندی در کیف امنیتی" },
    metric2: { label: "پلمب‌های صادرشده امروز", value: "۲۸ پلمب DDR", hint: "عیار ۱۸ استاندارد" },
    pendingTasks: [
      { id: "t1", title: "۳ قطعه تاییدشده QC آماده صدور کارت UID", href: "/app/inventory/uids", tone: "warn" },
      { id: "t2", title: "تحویل فیزیکی سبد سیار به نوید محمدی (ایجنت)", href: "/app/inventory/allocations", tone: "gold" },
    ],
    mostUsed: [
      { title: "صدور UID و پلمب امنیتی", href: "/app/inventory/uids", uses: "۴۵ بار در ماه", icon: "QrCode" },
      { title: "صف پکینگ و آماده‌سازی", href: "/app/fulfillment/picking", uses: "۳۸ بار در ماه", icon: "PackageCheck" },
      { title: "موجودی گاوصندوق مرکزی", href: "/app/inventory/vault", uses: "۳۰ بار در ماه", icon: "Boxes" },
    ],
  },
  finance: {
    badge: "مدیریت مالی و حسابداری طلا",
    metric1: { label: "تراز دفتر کل دوگانه", value: "۱۰۰٪ متوازن", hint: "طلا: ۴۸.۲kg / ریال: متوازن" },
    metric2: { label: "مطالبات سررسید امروز", value: "۶۵.۷ گرم طلا", hint: "پیگیری توسط ایجنت‌ها" },
    pendingTasks: [
      { id: "t1", title: "۲ درخواست تسویه تولیدکننده نیازمند تایید پرداخت", href: "/app/finance/settlements", tone: "warn" },
      { id: "t2", title: "بررسی سقف اعتبار گالری زمرد (نزدیک به لیمیت)", href: "/app/finance/credit", tone: "danger" },
    ],
    mostUsed: [
      { title: "دفتر کل دوگانه طلا و ریال", href: "/app/finance/ledger", uses: "۵۲ بار در ماه", icon: "BookOpen" },
      { title: "تجزیه سنی مطالبات", href: "/app/finance/receivables", uses: "۴۴ بار در ماه", icon: "Clock" },
      { title: "تسویه حساب زرین و کارگاه‌ها", href: "/app/finance/settlements", uses: "۳۶ بار در ماه", icon: "BadgeDollarSign" },
    ],
  },
  qc: {
    badge: "آزمایشگاه عیارسنجی و کنترل کیفیت",
    metric1: { label: "اقلام در صف بازرسی QC", value: "۳ قطعه طلا", hint: "ارسالی از آتلیه نوا" },
    metric2: { label: "نرخ تایید کیفی ماه", value: "۹۶.۸٪", hint: "عیار ۷۵۰ دقیق" },
    pendingTasks: [
      { id: "t1", title: "بررسی عیار انگشتر روژان (کد فنی PHY-8823)", href: "/app/product/qc", tone: "warn" },
    ],
    mostUsed: [
      { title: "صف بازرسی و کنترل کیفیت", href: "/app/product/qc", uses: "۶۸ بار در ماه", icon: "CheckCircle2" },
      { title: "تعریف مشخصات SKU", href: "/app/product/skus", uses: "۲۴ بار در ماه", icon: "PackagePlus" },
    ],
  },
  pricing: {
    badge: "میز قیمت‌گذاری و نرخ طلا",
    metric1: { label: "نرخ لحظه‌ای ۱۸ عیار", value: "۴,۳۵۰,۰۰۰ تومان", hint: "به‌روزرسانی خودکار TGJU" },
    metric2: { label: "پروموشن‌های فعال اجرت", value: "۳ جشنواره", hint: "میانگین تخفیف: ۲.۱٪" },
    pendingTasks: [
      { id: "t1", title: "بررسی درخواست تخفیف حجمی بنکداری پارسا", href: "/app/commerce/promotions", tone: "gold" },
    ],
    mostUsed: [
      { title: "موتور قیمت‌گذاری و فرمول اجرت", href: "/app/commerce/pricing", uses: "۵۰ بار در ماه", icon: "TrendingUp" },
      { title: "گزارش فروش و درآمد", href: "/app/intelligence/sales", uses: "۲۲ بار در ماه", icon: "BarChart3" },
    ],
  },
  producer: {
    badge: "کارگاه و آتلیه ساخت طلا",
    metric1: { label: "ظرفیت ساخت هفتگی", value: "۲,۵۰۰ گرم", hint: "مصرف‌شده: ۱,۲۰۰ گرم" },
    metric2: { label: "طلب طلا از ستاد", value: "۴۵.۲ گرم", hint: "آماده تسویه زرین" },
    pendingTasks: [
      { id: "t1", title: "۱ قطعه نیازمند اصلاح در QC (اختلاف وزن)", href: "/app/product/qc", tone: "warn" },
      { id: "t2", title: "ثبت مشخصات طرح جدید کلکسیون نور", href: "/app/product/skus", tone: "gold" },
    ],
    mostUsed: [
      { title: "تعریف محصول و SKU", href: "/app/product/skus", uses: "۲۸ بار در ماه", icon: "PackagePlus" },
      { title: "تسویه حساب کارگاه", href: "/app/finance/settlements", uses: "۱۹ بار در ماه", icon: "BadgeDollarSign" },
    ],
  },
  customer: {
    badge: "پورتال مشتری نهایی دیدار",
    metric1: { label: "طلاهای خریداری‌شده", value: "۳ قطعه", hint: "دارای شناسنامه امنیتی DDR" },
    metric2: { label: "وضعیت گارانتی", value: "معتبر و فعال", hint: "گارانتی تعویض و اصالت" },
    pendingTasks: [
      { id: "t1", title: "مشاهده پیشنهاد بازخرید آنلاین طلا به نرخ روز", href: "/app/service/buyback", tone: "gold" },
    ],
    mostUsed: [
      { title: "استعلام گارانتی و شناسنامه", href: "/app/service/warranty", uses: "۱۲ بار در ماه", icon: "ShieldCheck" },
      { title: "بازخرید آنلاین طلا", href: "/app/service/buyback", uses: "۸ بار در ماه", icon: "RefreshCw" },
    ],
  },
};
