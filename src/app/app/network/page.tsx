"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  ChevronLeft,
  Coins,
  Factory,
  FileCheck,
  Filter,
  Info,
  Layers,
  MapPin,
  Phone,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Store,
  Truck,
  UserCheck,
  UserPlus,
  Users,
  Vault,
} from "lucide-react";
import {
  DomainLinkButton,
  DomainOverviewPage,
} from "@/components/domain-overview";
import { ActionModal } from "@/components/action-modal";
import { Badge, Button, Field, Input, Modal, Panel, Stat } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useSession } from "@/context/session-context";
import { roleHasPermission } from "@/data/domains";
import { apiEnabled, didarApi } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import {
  retailerAccountsSeed,
  producerAccountsSeed,
  supplierAccountsSeed,
  salesAgentsSeed,
  deliveryCouriersSeed,
} from "@/data/mock";

export type PartyTypeGuide = {
  kind: string;
  label_fa: string;
  subtitle: string;
  href: string;
  icon: typeof Factory;
  what_they_do: string;
  capabilities: string[];
  color: string;
  tag: string;
};

export const IRAN_PARTY_TYPES_GUIDE: PartyTypeGuide[] = [
  {
    kind: "producer",
    label_fa: "کارخانه / کارگاه طلا",
    subtitle: "تولید و ساخت مصنوعات",
    href: "/app/network/producers",
    icon: Factory,
    what_they_do:
      "تولیدکننده مصنوعات طلا و جواهر، ریخته‌گری، آتلیه‌های طراحی اختصاصی و ورود محصولات به چرخه کنترل کیفیت دیدار.",
    capabilities: ["ثبت طرح و قالب", "ارسال به QC", "مدیریت ظرفیت کارگاه"],
    color: "from-amber-600/10 to-amber-700/5 text-amber-800 border-amber-300",
    tag: "زنجیره ساخت",
  },
  {
    kind: "wholesaler",
    label_fa: "بنکدار طلا و پخش عمده",
    subtitle: "توزیع B2B و بنکداری راسته طلا",
    href: "/app/network/wholesalers",
    icon: Coins,
    what_they_do:
      "توزیع عمده در بازار بزرگ و راسته طلافروشان، تامین کیفی طلا، ارتباط با گالری‌ها و بهره‌مندی از تسویه اعتباری دیدار.",
    capabilities: ["سفارشات تناژ و تیراژ", "حساب باز و اعتبار بنکداری", "تخصیص کیفی"],
    color: "from-blue-600/10 to-blue-700/5 text-blue-800 border-blue-300",
    tag: "توزیع عمده",
  },
  {
    kind: "retailer",
    label_fa: "گالری و خرده‌فروش طلا",
    subtitle: "ویترین‌های شهری و بوتیک‌ها",
    href: "/app/network/retailers",
    icon: Store,
    what_they_do:
      "ویترین‌ها و طلافروشی‌های سطح شهر، سفارش کاتالوگ ۱۸ عیار شناسنامه‌دار، استعلام اصالت و ثبت سفارش آنلاین.",
    capabilities: ["سفارش کاتالوگ", "اعتبار خرید", "مدیریت چند شعبه"],
    color: "from-emerald-600/10 to-emerald-700/5 text-emerald-800 border-emerald-300",
    tag: "ویترین فروشگاهی",
  },
  {
    kind: "vault",
    label_fa: "خزانه و صندوق امانات",
    subtitle: "حفاظت فیزیکی و امانات",
    href: "/app/network/vaults",
    icon: Vault,
    what_they_do:
      "انبارش امنیتی مصنوعات طلا و شمش، صدور شناسنامه UID، پلمپ ترانزیت و نگهداری موجودی فیزیکی پشتیبان پلتفرم.",
    capabilities: ["تخصیص و صدور UID", "پلمپ و تحویل امن", "ممیزی موجودی فیزیکی"],
    color: "from-slate-600/10 to-slate-700/5 text-slate-800 border-slate-300",
    tag: "امنیت دارایی",
  },
  {
    kind: "agent",
    label_fa: "ایجنت و ویزیتور فروش",
    subtitle: "نمایندگان فروش میدانی",
    href: "/app/network/agents",
    icon: UserCheck,
    what_they_do:
      "بازاریابی و ارتباط حضوری با بنکداران و گالری‌ها، هماهنگی سبد سیار، ثبت پیش‌فاکتور با قفل قیمت زنده و تحویل حضوری.",
    capabilities: ["صدور پیش‌فاکتور", "سبد سیار آزمایشی", "مدیریت قلمرو"],
    color: "from-teal-600/10 to-teal-700/5 text-teal-800 border-teal-300",
    tag: "فروش میدانی",
  },
  {
    kind: "service_partner",
    label_fa: "همکاران خدمات و لجستیک",
    subtitle: "ترانزیت امن، اسکورت و ری‌گری",
    href: "/app/network/partners",
    icon: Truck,
    what_they_do:
      "شرکت‌های ترانزیت مسلح و زره‌پوش، آزمایشگاه‌های عیارسنجی (ری‌گری) و نهادهای بیمه امنیتی طلا.",
    capabilities: ["ترانزیت زره‌پوش", "تاییدیه عیارسنجی", "پوشش بیمه کلان"],
    color: "from-indigo-600/10 to-indigo-700/5 text-indigo-800 border-indigo-300",
    tag: "لجستیک امن",
  },
  {
    kind: "customer",
    label_fa: "تمام مشتریان و طرف‌های شبکه",
    subtitle: "پایگاه جامع اشخاص خارج از سازمان",
    href: "/app/network/customers",
    icon: Users,
    what_they_do:
      "دایرکتوری سراسری تمامی افراد، خریداران، ثبت‌نام‌های آنلاین جدید و صف تایید مدارک و فعال‌سازی حساب.",
    capabilities: ["صف تایید مدارک", "ثبت پروفایل جدید", "سوابق مبادلات"],
    color: "from-amber-500/20 to-amber-600/10 text-amber-950 border-amber-400 font-bold",
    tag: "پایگاه جامع",
  },
];

type Party = {
  id: string;
  name: string;
  kind: string;
  kind_label: string;
  status: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  union_license: string | null;
  summary: string | null;
  member_count: number;
  capabilities: string[];
  what_they_do: string;
  readiness?: string;
  readiness_label?: string;
};

export default function NetworkDomainPage({
  initialFilter,
}: { initialFilter?: string } = {}) {
  const { toast } = useToast();
  const { role } = useSession();
  const canManage = roleHasPermission(role, "network.manage");

  const [kindFilter, setKindFilter] = useState<string>(initialFilter || "all");
  const [searchQuery, setSearchQuery] = useState("");
  const [parties, setParties] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [openCreate, setOpenCreate] = useState(false);

  // Form State for Quick Party Creation
  const [formKind, setFormKind] = useState("retailer");
  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("تهران");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formLicense, setFormLicense] = useState("");

  // Seed default parties from data
  useEffect(() => {
    const loaded: Party[] = [];

    // Retailers & Wholesalers
    for (const r of retailerAccountsSeed) {
      loaded.push({
        id: r.id,
        name: r.storeName,
        kind: r.businessType === "wholesaler" ? "wholesaler" : "retailer",
        kind_label:
          r.businessType === "wholesaler" ? "بنکدار طلا" : "گالری / خرده‌فروش",
        status: r.cooperationStatus,
        city: r.city,
        address: r.address,
        phone: r.mobile,
        union_license: r.licenseNumber || null,
        summary: `مدیریت: ${r.managerName} · حجم خرید: ${formatNumber(r.totalPurchaseGrams)} گرم`,
        member_count: 2,
        capabilities: ["سفارش کاتالوگ", "اعتبار خرید", "تسویه اعتباری"],
        what_they_do: "خرید طلا و توزیع در ویترین‌های خرده‌فروشی و بنکداری.",
        readiness: r.verificationStatus === "approved" ? "ready" : "pending",
        readiness_label:
          r.verificationStatus === "approved" ? "تایید شده" : "در انتظار مدارک",
      });
    }

    // Producers
    for (const p of producerAccountsSeed) {
      loaded.push({
        id: p.id,
        name: p.brandName,
        kind: "producer",
        kind_label: "کارخانه / کارگاه طلا",
        status: p.status,
        city: p.city,
        address: p.productionLocation,
        phone: p.mobile,
        union_license: "PR-7701-GOLD",
        summary: `مسئول: ${p.managerName} · تولید ماهانه: ${formatNumber(p.productionVolumeGrams)} گرم`,
        member_count: 1,
        capabilities: ["طراحی", "ریخته‌گری", "ارسال به صف QC"],
        what_they_do: "تولید و ساخت مصنوعات طلای ۱۸ عیار استاندارد.",
        readiness: "ready",
        readiness_label: "فعال در زنجیره",
      });
    }

    // Agents
    for (const a of salesAgentsSeed) {
      loaded.push({
        id: a.id,
        name: `${a.name} (کد ${a.agentCode})`,
        kind: "agent",
        kind_label: "ایجنت فروش",
        status: a.status,
        city: "تهران",
        address: a.territory.join(" · "),
        phone: a.mobile,
        union_license: null,
        summary: `تعداد بازدیدها: ${a.visitsCount} · نرخ تبدیل: ${a.conversionRate}٪`,
        member_count: 1,
        capabilities: ["پیش‌فاکتور", "سبد سیار", "قفل نرخ"],
        what_they_do: "ویزیت و بازاریابی میدانی بنکداران و گالری‌ها.",
        readiness: "ready",
        readiness_label: "فعال",
      });
    }

    setParties(loaded);
  }, []);

  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      const matchKind = kindFilter === "all" ? true : p.kind === kindFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q));
      return matchKind && matchSearch;
    });
  }, [parties, kindFilter, searchQuery]);

  const handleCreateParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) {
      toast("نام و شماره تماس الزامی است.", "warn");
      return;
    }

    const typeMeta = IRAN_PARTY_TYPES_GUIDE.find((t) => t.kind === formKind);

    const newParty: Party = {
      id: `party-${Date.now()}`,
      name: formName.trim(),
      kind: formKind,
      kind_label: typeMeta?.label_fa || "طرف شبکه",
      status: "active",
      city: formCity.trim(),
      address: formAddress.trim() || null,
      phone: formPhone.trim(),
      union_license: formLicense.trim() || null,
      summary: typeMeta?.what_they_do || null,
      member_count: 1,
      capabilities: typeMeta?.capabilities || [],
      what_they_do: typeMeta?.what_they_do || "",
      readiness: "ready",
      readiness_label: "تایید شده",
    };

    setParties([newParty, ...parties]);
    setOpenCreate(false);
    setFormName("");
    setFormPhone("");
    setFormAddress("");
    setFormLicense("");
    toast(`طرف شبکه «${newParty.name}» با موفقیت اضافه شد.`, "ok");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--gold-deep)]">
            <Building2 size={16} />
            <span>اکوسیستم و شبکه یکپارچه صنف طلا و جواهر دیدار</span>
          </div>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
            راهنمای انواع طرفین و شبکه همکاران
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--muted)]">
            راهنمای جامع نقش‌ها و طرفین صنف طلا در بازار ایران، پروفایل کارتی بازیگران و اتصال مستقیم به هر حوزه.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/app/network/customers">
            <Button variant="secondary">
              <Users size={16} />
              مشاهده تمام مشتریان و طرف‌ها
            </Button>
          </Link>
          <Button onClick={() => setOpenCreate(true)}>
            <Plus size={16} />
            افزودن طرف شبکه
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="کل بازیگران شبکه" value={formatNumber(parties.length + 8)} hint="شامل کارگاه، بنکدار، گالری" />
        <Stat label="انواع طرف در ایران" value="۷ دسته اصلی" hint="از تولید تا مشتری نهایی" />
        <Stat label="پوشش جغرافیایی" value="۵ استان کلیدی" hint="تهران، اصفهان، مشهد، تبریز..." />
        <Stat label="احراز هویت و تایید" value="۱۰۰٪ شناسنامه‌دار" hint="پروانه کسب اتحادیه" />
      </div>

      {/* SECTION 1: INTERACTIVE IRAN GOLD MARKET ECOSYSTEM GUIDE BLOCKS (ROOT /app/network ONLY) */}
      {(!initialFilter || initialFilter === "all") && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
                <Layers size={20} className="text-[var(--gold-deep)]" />
                راهنمای انواع طرف در بازار طلای ایران
              </h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                با انتخاب هر بلوک مستقیماً به پنل و مدیریت طرف‌های آن حوزه وارد شوید:
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {IRAN_PARTY_TYPES_GUIDE.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.kind}
                  href={item.href}
                  className="group relative flex flex-col justify-between rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm hover:border-[var(--gold-deep)] hover:shadow-lg transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} border shadow-xs`}>
                        <Icon size={22} />
                      </div>
                      <span className="rounded-full bg-[var(--mist)] px-2.5 py-1 text-[10px] font-semibold text-[var(--ink)]">
                        {item.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-[var(--ink)] group-hover:text-[var(--gold-deep)] transition-colors">
                        {item.label_fa}
                      </h3>
                      <p className="text-xs text-[var(--muted)] font-medium mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>

                    <p className="text-xs leading-5 text-[var(--muted)]">
                      {item.what_they_do}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between text-xs font-bold text-[var(--gold-deep)] group-hover:text-amber-700">
                    <span>ورود به این بخش</span>
                    <ChevronLeft size={16} className="transform group-hover:-translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 2: CARD-BASED PROFILES SHOWCASE */}
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--ink)]">
              پروفایل کارتی طرفین شبکه
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              نمایش مشخصات، وضعیت تایید، شهر و قابلیت‌های هر طرف شبکه
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs text-[var(--ink)] outline-none"
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
            >
              <option value="all">همه دسته‌ها</option>
              <option value="retailer">گالری و خرده‌فروش</option>
              <option value="wholesaler">بنکدار طلا</option>
              <option value="producer">کارخانه / کارگاه</option>
              <option value="agent">ایجنت فروش</option>
            </select>

            <div className="w-48 sm:w-60">
              <Input
                placeholder="جستجوی نام یا شهر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs py-1.5"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredParties.map((p) => {
            const isReady = p.readiness === "ready";
            return (
              <div
                key={p.id}
                className="rounded-3xl border border-[var(--line)] bg-white p-5 shadow-sm hover:border-[var(--gold-deep)]/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-semibold text-[var(--gold-deep)]">
                        {p.kind_label}
                      </span>
                      <h3 className="font-bold text-base text-[var(--ink)] mt-0.5">
                        {p.name}
                      </h3>
                      {p.city && (
                        <p className="text-xs text-[var(--muted)] flex items-center gap-1 mt-0.5">
                          <MapPin size={12} />
                          {p.city}
                        </p>
                      )}
                    </div>

                    <Badge tone={isReady ? "ok" : "warn"}>
                      {p.readiness_label || "فعال"}
                    </Badge>
                  </div>

                  {p.summary && (
                    <p className="text-xs text-[var(--muted)] leading-5 bg-[var(--mist)]/60 rounded-xl p-2.5">
                      {p.summary}
                    </p>
                  )}

                  {p.capabilities?.length ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {p.capabilities.map((c) => (
                        <span
                          key={c}
                          className="rounded-lg bg-[var(--cream)] px-2 py-1 text-[10px] font-medium text-[var(--ink)] ring-1 ring-[var(--line)]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between gap-2">
                  <Link href={`/app/network/parties/${p.id}`} className="flex-1">
                    <Button variant="secondary" className="w-full text-xs">
                      داشبورد و پروفایل UID
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="text-xs px-2.5"
                    onClick={() => setSelectedParty(p)}
                  >
                    پیش‌نمایش
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredParties.length === 0 && (
          <div className="rounded-2xl border border-[var(--line)] bg-white p-10 text-center text-xs text-[var(--muted)]">
            طرفی با این مشخصات یافت نشد.
          </div>
        )}
      </section>

      {/* QUICK CREATE MODAL */}
      <Modal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="افزودن طرف جدید به شبکه دیدار"
        subtitle="تعریف کارگاه، بنکدار، گالری یا ایجنت"
      >
        <form onSubmit={handleCreateParty} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-[var(--ink)]">
              نوع طرف شبکه
            </label>
            <select
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none"
              value={formKind}
              onChange={(e) => setFormKind(e.target.value)}
            >
              <option value="retailer">گالری و خرده‌فروش طلا</option>
              <option value="wholesaler">بنکدار طلا و پخش عمده</option>
              <option value="producer">کارخانه / کارگاه طلا</option>
              <option value="agent">ایجنت فروش میدانی</option>
              <option value="vault">خزانه و امانات</option>
              <option value="service_partner">همکار ترانزیت و خدمات</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-[var(--ink)]">
              نام کسب‌وکار یا برند <span className="text-red-500">*</span>
            </label>
            <Input
              required
              placeholder="مثال: گالری طلای زروان"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-[var(--ink)]">
                شهر
              </label>
              <Input
                placeholder="تهران"
                value={formCity}
                onChange={(e) => setFormCity(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block font-semibold text-[var(--ink)]">
                شماره تماس <span className="text-red-500">*</span>
              </label>
              <Input
                required
                dir="ltr"
                placeholder="0912..."
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-[var(--ink)]">
              شماره پروانه کسب / شناسه اتحادیه
            </label>
            <Input
              placeholder="مثال: TR-4421"
              value={formLicense}
              onChange={(e) => setFormLicense(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-[var(--ink)]">
              آدرس
            </label>
            <Input
              placeholder="نشانی فروشگاه یا کارگاه..."
              value={formAddress}
              onChange={(e) => setFormAddress(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line)]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpenCreate(false)}
            >
              انصراف
            </Button>
            <Button type="submit">ثبت و ایجاد پروفایل</Button>
          </div>
        </form>
      </Modal>

      {/* PARTY DETAILS MODAL */}
      {selectedParty && (
        <Modal
          open={Boolean(selectedParty)}
          onClose={() => setSelectedParty(null)}
          title={selectedParty.name}
          subtitle={selectedParty.kind_label}
        >
          <div className="space-y-4 text-xs">
            <div className="rounded-2xl bg-[var(--mist)] p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">شهر:</span>
                <span className="font-semibold">{selectedParty.city || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">نشانی:</span>
                <span>{selectedParty.address || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">شماره تماس:</span>
                <span className="font-mono font-semibold" dir="ltr">
                  {selectedParty.phone || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">جواز اتحادیه طلا:</span>
                <span className="font-mono">
                  {selectedParty.union_license || "—"}
                </span>
              </div>
            </div>

            <div>
              <p className="font-bold text-[var(--ink)] mb-1">شرح فعالیت:</p>
              <p className="text-[var(--muted)] leading-6">
                {selectedParty.what_they_do}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line)]">
              <Button
                variant="secondary"
                onClick={() => setSelectedParty(null)}
              >
                بستن
              </Button>
              <Link href="/app/network/customers">
                <Button>مدیریت کامل در لیست مشتریان</Button>
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
