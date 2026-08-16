"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  Layers,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  retailerAccountsSeed,
  producerAccountsSeed,
  supplierAccountsSeed,
  salesAgentsSeed,
  deliveryCouriersSeed,
  endCustomersSeed,
} from "@/data/mock";
import { formatMoney, formatNumber } from "@/lib/utils";
import { Badge, Button, Input, Modal, Panel, Stat } from "@/components/ui";
import { useToast } from "@/components/toast";
import { ActionModal } from "@/components/action-modal";

interface ExternalPartyItem {
  id: string;
  name: string;
  storeName?: string;
  mobile: string;
  city: string;
  partyType:
    | "retailer"
    | "wholesaler"
    | "producer"
    | "supplier"
    | "agent"
    | "courier"
    | "customer";
  partyTypeLabel: string;
  verificationStatus: "pending" | "approved" | "needs_docs" | "rejected";
  licenseNumber?: string;
  hasUploadedDocs: boolean;
  totalPurchaseGrams?: number;
  totalPurchaseIrr?: number;
  registeredAt: string;
  source: "web_checkout" | "direct_onboarding" | "system_seed";
}

export default function AllCustomersAndPartiesPage() {
  const { toast } = useToast();

  const [parties, setParties] = useState<ExternalPartyItem[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [verifyModalParty, setVerifyModalParty] =
    useState<ExternalPartyItem | null>(null);
  const [profileDrawerParty, setProfileDrawerParty] =
    useState<ExternalPartyItem | null>(null);

  // New Party Form
  const [formData, setFormData] = useState({
    name: "",
    storeName: "",
    mobile: "",
    city: "تهران",
    partyType: "retailer" as ExternalPartyItem["partyType"],
    licenseNumber: "",
    creditLimitIrr: "1000000000",
  });

  // Load from seeds + localStorage (checkout registrations)
  useEffect(() => {
    const list: ExternalPartyItem[] = [];

    // 1. Check localStorage for web registrations / orders
    try {
      const storedUsersRaw = window.localStorage.getItem("didar.session.user");
      const storedLocalOrdersRaw = window.localStorage.getItem("didar.orders.local");
      const localOrders = storedLocalOrdersRaw ? JSON.parse(storedLocalOrdersRaw) : [];

      if (storedUsersRaw) {
        const u = JSON.parse(storedUsersRaw);
        if (u.role === "retailer" || u.entityType === "retailer_user") {
          list.push({
            id: `reg-${u.id}`,
            name: u.name,
            storeName: u.org || "گالری ثبت‌شده از وب‌سایت",
            mobile: u.username || "09120000000",
            city: "تهران",
            partyType: "retailer",
            partyTypeLabel: "خرده‌فروش (ثبت‌نام آنلاین)",
            verificationStatus: "pending",
            hasUploadedDocs: true,
            registeredAt: "امروز (آنلاین)",
            source: "web_checkout",
            totalPurchaseIrr: localOrders[0]?.value || 0,
            totalPurchaseGrams: localOrders[0]?.totalWeight || 0,
          });
        }
      }
    } catch {
      /* ignore */
    }

    // 2. Retailers from seed
    for (const r of retailerAccountsSeed) {
      list.push({
        id: r.id,
        name: r.managerName,
        storeName: r.storeName,
        mobile: r.mobile,
        city: r.city,
        partyType: r.businessType === "wholesaler" ? "wholesaler" : "retailer",
        partyTypeLabel: r.businessType === "wholesaler" ? "بنکدار طلا" : "گالری / خرده‌فروش",
        verificationStatus: r.verificationStatus,
        licenseNumber: r.licenseNumber,
        hasUploadedDocs: r.verificationStatus === "approved",
        totalPurchaseGrams: r.totalPurchaseGrams,
        totalPurchaseIrr: r.totalPurchaseIrr,
        registeredAt: r.createdAt,
        source: "system_seed",
      });
    }

    // 3. Producers
    for (const p of producerAccountsSeed) {
      list.push({
        id: p.id,
        name: p.managerName,
        storeName: p.brandName,
        mobile: p.mobile,
        city: p.city,
        partyType: "producer",
        partyTypeLabel: "کارخانه / کارگاه تولیدی",
        verificationStatus: p.verificationStatus === "verified" ? "approved" : "pending",
        hasUploadedDocs: true,
        totalPurchaseGrams: p.productionVolumeGrams,
        registeredAt: "۱۴۰۴/۰۳/۱۰",
        source: "system_seed",
      });
    }

    // 4. Suppliers
    for (const s of supplierAccountsSeed) {
      list.push({
        id: s.id,
        name: s.managerName,
        storeName: s.businessName,
        mobile: s.mobile,
        city: "تهران",
        partyType: "supplier",
        partyTypeLabel: "تامین‌کننده شمش و سنگ",
        verificationStatus: s.verificationStatus === "verified" ? "approved" : "pending",
        hasUploadedDocs: true,
        registeredAt: "۱۴۰۳/۱۱/۱۵",
        source: "system_seed",
      });
    }

    // 5. Agents
    for (const a of salesAgentsSeed) {
      list.push({
        id: a.id,
        name: a.name,
        storeName: `ایجنت کد ${a.agentCode}`,
        mobile: a.mobile,
        city: "تهران",
        partyType: "agent",
        partyTypeLabel: "ایجنت فروش میدانی",
        verificationStatus: "approved",
        hasUploadedDocs: true,
        registeredAt: "۱۴۰۳/۰۸/۰۱",
        source: "system_seed",
      });
    }

    // 6. End Customers
    for (const c of endCustomersSeed) {
      list.push({
        id: c.id,
        name: c.name || "مشتری نهایی",
        storeName: `شناسه: ${c.systemCustomerId}`,
        mobile: c.mobile,
        city: "تهران",
        partyType: "customer",
        partyTypeLabel: "مشتری نهایی (خریدار)",
        verificationStatus: c.contactVerification ? "approved" : "pending",
        hasUploadedDocs: false,
        registeredAt: "۱۴۰۴/۰۹/۲۰",
        source: "system_seed",
      });
    }

    setParties(list);
  }, []);

  // Separate pending/unverified parties for pinning at top
  const pendingParties = useMemo(() => {
    return parties.filter((p) => p.verificationStatus === "pending" || p.verificationStatus === "needs_docs");
  }, [parties]);

  const filteredParties = useMemo(() => {
    return parties.filter((p) => {
      const matchesType =
        filterType === "all"
          ? true
          : filterType === "pending"
            ? p.verificationStatus === "pending" || p.verificationStatus === "needs_docs"
            : p.partyType === filterType;

      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.storeName && p.storeName.toLowerCase().includes(q)) ||
        p.mobile.includes(q) ||
        p.city.toLowerCase().includes(q);

      return matchesType && matchesSearch;
    });
  }, [parties, filterType, searchQuery]);

  const handleCreateParty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim()) {
      toast("نام و شماره تماس الزامی است.", "warn");
      return;
    }

    const typeLabels: Record<string, string> = {
      retailer: "گالری / خرده‌فروش",
      wholesaler: "بنکدار طلا",
      producer: "کارخانه / کارگاه",
      supplier: "تامین‌کننده",
      agent: "ایجنت فروش",
      courier: "سفیر تحویل",
      customer: "مشتری نهایی",
    };

    const newParty: ExternalPartyItem = {
      id: `party-${Date.now()}`,
      name: formData.name.trim(),
      storeName: formData.storeName.trim() || undefined,
      mobile: formData.mobile.trim(),
      city: formData.city.trim(),
      partyType: formData.partyType,
      partyTypeLabel: typeLabels[formData.partyType] || "طرف شبکه",
      verificationStatus: "approved",
      licenseNumber: formData.licenseNumber.trim() || undefined,
      hasUploadedDocs: Boolean(formData.licenseNumber),
      registeredAt: "هم‌اکنون",
      source: "direct_onboarding",
    };

    setParties([newParty, ...parties]);
    setCreateModalOpen(false);
    setFormData({
      name: "",
      storeName: "",
      mobile: "",
      city: "تهران",
      partyType: "retailer",
      licenseNumber: "",
      creditLimitIrr: "1000000000",
    });
    toast(`پروفایل «${newParty.name}» با موفقیت ایجاد شد.`, "ok");
  };

  const handleApproveDocs = (partyId: string) => {
    setParties((prev) =>
      prev.map((p) =>
        p.id === partyId
          ? { ...p, verificationStatus: "approved", hasUploadedDocs: true }
          : p,
      ),
    );
    setVerifyModalParty(null);
    toast("مدارک صنفی تایید شد و حساب فعال گردید.", "ok");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--gold-deep)]">
            <Users size={16} />
            <span>پایگاه جامع طرف‌های خارجی و مشتریان دیدار گلد</span>
          </div>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
            تمام مشتریان و طرف‌های شبکه
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--muted)]">
            نمایشگر و دایرکتوری تمامی اشخاص و کسب‌وکارهای خارج از سازمان، مدیریت مدارک و احراز هویت.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setCreateModalOpen(true)}>
            <UserPlus size={16} />
            ثبت طرف جدید / ایجاد پروفایل
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="کل طرف‌های ثبت‌شده" value={formatNumber(parties.length)} hint="شخص و کسب‌وکار" />
        <Stat
          label="در انتظار تایید مدارک"
          value={formatNumber(pendingParties.length)}
          hint="ثبت‌نام‌های نیازمند اقدام"
          trend={pendingParties.length > 0 ? "نیازمند اقدام" : undefined}
        />
        <Stat
          label="گالری‌ها و بنکداران فعال"
          value={formatNumber(
            parties.filter((p) => (p.partyType === "retailer" || p.partyType === "wholesaler") && p.verificationStatus === "approved").length,
          )}
          hint="دارای سقف اعتبار"
        />
        <Stat
          label="کارگاه‌ها و تامین‌کنندگان"
          value={formatNumber(
            parties.filter((p) => p.partyType === "producer" || p.partyType === "supplier").length,
          )}
          hint="زنجیره تامین طلا"
        />
      </div>

      {/* PINNED SECTION: NEW REGISTRATIONS & PENDING VERIFICATION QUEUE */}
      {pendingParties.length > 0 && (
        <section className="rounded-3xl border-2 border-amber-400/50 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 p-5 sm:p-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-200 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500 text-white font-bold text-sm shadow-sm">
                !
              </span>
              <div>
                <h2 className="font-bold text-base text-amber-950">
                  ثبت‌نام‌های جدید و در انتظار تایید مدارک ({formatNumber(pendingParties.length)} مورد)
                </h2>
                <p className="text-xs text-amber-800 mt-0.5">
                  این افراد از طریق سایت ثبت‌نام کرده یا سفارش داده‌اند و تا زمان تایید مدارک در بالای لیست قرار دارند.
                </p>
              </div>
            </div>

            <Badge tone="warn">نیاز به تایید ادمین</Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pendingParties.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-amber-700">
                        {p.partyTypeLabel}
                      </p>
                      <h3 className="font-bold text-base text-[var(--ink)]">
                        {p.name}
                      </h3>
                      {p.storeName && (
                        <p className="text-xs font-medium text-[var(--muted)]">
                          {p.storeName}
                        </p>
                      )}
                    </div>
                    <Badge tone="warn">در انتظار تایید</Badge>
                  </div>

                  <div className="rounded-xl bg-amber-50/60 p-2.5 text-xs text-[var(--ink)] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">شماره تماس:</span>
                      <span className="font-mono font-semibold" dir="ltr">
                        {p.mobile}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">شهر:</span>
                      <span>{p.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">زمان ثبت:</span>
                      <span>{p.registeredAt}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyModalParty(p)}
                    className="flex-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-3 py-2 text-xs font-bold transition-colors text-center"
                  >
                    بررسی مدارک و تایید
                  </button>
                  <Button
                    variant="secondary"
                    className="text-xs px-3"
                    onClick={() => setProfileDrawerParty(p)}
                  >
                    پروفایل
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FILTER & SEARCH CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "all", label: "همه طرف‌ها" },
            { id: "pending", label: "در انتظار مدارک" },
            { id: "retailer", label: "گالری و خرده‌فروش" },
            { id: "wholesaler", label: "بنکداران" },
            { id: "producer", label: "کارگاه و تولیدکننده" },
            { id: "supplier", label: "تامین‌کننده" },
            { id: "agent", label: "ایجنت فروش" },
            { id: "customer", label: "مشتری نهایی" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterType(f.id)}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                filterType === f.id
                  ? "bg-[var(--ink)] text-white shadow-sm"
                  : "bg-white text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--mist)]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="جستجوی نام، تلفن، فروشگاه یا شهر…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-xs"
          />
        </div>
      </div>

      {/* MAIN DIRECTORY LIST */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredParties.map((p) => {
          const isApproved = p.verificationStatus === "approved";
          return (
            <div
              key={p.id}
              className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm hover:border-[var(--gold-deep)]/40 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-[var(--gold-deep)]">
                      {p.partyTypeLabel}
                    </span>
                    <h3 className="font-bold text-base text-[var(--ink)] mt-0.5">
                      {p.name}
                    </h3>
                    {p.storeName && (
                      <p className="text-xs font-medium text-[var(--muted)]">
                        {p.storeName}
                      </p>
                    )}
                  </div>
                  <Badge tone={isApproved ? "ok" : "warn"}>
                    {isApproved ? "تایید شده" : "در انتظار مدارک"}
                  </Badge>
                </div>

                <div className="rounded-xl bg-[var(--mist)] p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">موبایل:</span>
                    <span className="font-mono font-semibold" dir="ltr">
                      {p.mobile}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">شهر و منطقه:</span>
                    <span>{p.city}</span>
                  </div>
                  {p.totalPurchaseGrams ? (
                    <div className="flex justify-between">
                      <span className="text-[var(--muted)]">مجموع حجم مبادلات:</span>
                      <span className="font-semibold text-emerald-800">
                        {formatNumber(p.totalPurchaseGrams)} گرم طلا
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">تاریخ پیوستن:</span>
                    <span className="text-[11px] text-[var(--muted)]">
                      {p.registeredAt}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between gap-2">
                <Link href={`/app/network/parties/${p.id}`} className="flex-1">
                  <Button variant="secondary" className="w-full text-xs">
                    <Eye size={14} />
                    داشبورد و مدارک UID
                  </Button>
                </Link>
                {!isApproved ? (
                  <Button
                    className="text-xs bg-amber-600 hover:bg-amber-700"
                    onClick={() => setVerifyModalParty(p)}
                  >
                    تایید مدارک
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    className="text-xs px-2.5"
                    onClick={() => setProfileDrawerParty(p)}
                  >
                    پیش‌نمایش
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredParties.length === 0 && (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-12 text-center space-y-3">
          <Users size={36} className="mx-auto text-[var(--muted)]" />
          <h3 className="font-semibold text-base">موردی با این فیلتر یافت نشد</h3>
          <p className="text-xs text-[var(--muted)]">
            جستجو را پاک کنید یا فیلتر دیگری را انتخاب فرمایید.
          </p>
        </div>
      )}

      {/* CREATE NEW PARTY MODAL */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="ثبت طرف جدید و ایجاد پروفایل"
        subtitle="تعریف بنکدار، گالری، کارگاه تولیدی یا مشتری جدید در شبکه دیدار"
        size="lg"
      >
        <form onSubmit={handleCreateParty} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--ink)]">
                نوع طرف شبکه <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none focus:border-[var(--gold-deep)]"
                value={formData.partyType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    partyType: e.target.value as ExternalPartyItem["partyType"],
                  })
                }
              >
                <option value="retailer">گالری و خرده‌فروش طلا</option>
                <option value="wholesaler">بنکدار و پخش عمده</option>
                <option value="producer">کارخانه / کارگاه تولیدی طلا</option>
                <option value="supplier">تامین‌کننده شمش و سنگ</option>
                <option value="agent">ایجنت فروش میدانی</option>
                <option value="customer">مشتری نهایی (خریدار عمومی)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--ink)]">
                نام و نام خانوادگی مسئول <span className="text-red-500">*</span>
              </label>
              <Input
                required
                placeholder="مثال: کیان پارسا"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--ink)]">
                نام فروشگاه / برند تجاری
              </label>
              <Input
                placeholder="مثال: گالری طلای پارسا"
                value={formData.storeName}
                onChange={(e) =>
                  setFormData({ ...formData, storeName: e.target.value })
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--ink)]">
                شماره تلفن همراه <span className="text-red-500">*</span>
              </label>
              <Input
                required
                type="tel"
                dir="ltr"
                placeholder="09123456789"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value })
                }
                className="text-left font-mono"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--ink)]">
                شهر
              </label>
              <Input
                placeholder="مثال: تهران"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--ink)]">
                شماره پروانه کسب / جواز اتحادیه طلا
              </label>
              <Input
                placeholder="مثال: TR-9821-GOLD"
                value={formData.licenseNumber}
                onChange={(e) =>
                  setFormData({ ...formData, licenseNumber: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--line)]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setCreateModalOpen(false)}
            >
              انصراف
            </Button>
            <Button type="submit">ایجاد و ثبت پروفایل</Button>
          </div>
        </form>
      </Modal>

      {/* DOCUMENT VERIFICATION MODAL */}
      {verifyModalParty && (
        <Modal
          open={Boolean(verifyModalParty)}
          onClose={() => setVerifyModalParty(null)}
          title={`بررسی و تایید مدارک: ${verifyModalParty.name}`}
          subtitle={`نام فروشگاه: ${verifyModalParty.storeName || "—"} · شماره تماس: ${verifyModalParty.mobile}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--mist)] p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">نوع طرف:</span>
                <span className="font-semibold">{verifyModalParty.partyTypeLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">شهر:</span>
                <span>{verifyModalParty.city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">تاریخ ثبت‌نام آنلاین:</span>
                <span>{verifyModalParty.registeredAt}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-white p-4 space-y-3">
              <h4 className="font-bold text-sm text-[var(--ink)] flex items-center gap-2">
                <FileCheck size={18} className="text-[var(--gold-deep)]" />
                مدارک بارگذاری‌شده جهت احراز هویت
              </h4>

              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
                  <FileText size={20} className="mx-auto text-emerald-700 mb-1" />
                  <p className="font-semibold">تصویر پروانه کسب</p>
                  <p className="text-[11px] text-emerald-700 mt-1 font-mono">
                    ✓ license_scan.pdf
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
                  <FileText size={20} className="mx-auto text-emerald-700 mb-1" />
                  <p className="font-semibold">کارت ملی مسئول</p>
                  <p className="text-[11px] text-emerald-700 mt-1 font-mono">
                    ✓ national_id.jpg
                  </p>
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
                  <FileText size={20} className="mx-auto text-emerald-700 mb-1" />
                  <p className="font-semibold">تابلوی فروشگاه</p>
                  <p className="text-[11px] text-emerald-700 mt-1 font-mono">
                    ✓ store_front.jpg
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 leading-6">
              با تایید این مدارک، حساب خرده‌فروش فعال شده، سقف اعتبار تجاری فعال می‌گردد و پیش‌فاکتورهای سفارش برای تحویل امن به واحد لجستیک ارسال می‌شوند.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--line)]">
              <Button
                variant="secondary"
                onClick={() => setVerifyModalParty(null)}
              >
                انصراف
              </Button>
              <Button
                onClick={() => handleApproveDocs(verifyModalParty.id)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 size={16} />
                تایید مدارک و فعال‌سازی کامل حساب
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* PARTY DETAIL / PROFILE MODAL */}
      {profileDrawerParty && (
        <Modal
          open={Boolean(profileDrawerParty)}
          onClose={() => setProfileDrawerParty(null)}
          title={`پروفایل طرف شبکه: ${profileDrawerParty.name}`}
          subtitle={profileDrawerParty.partyTypeLabel}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <Panel className="p-4 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[var(--muted)]">نام و مسئول</p>
                <p className="font-bold text-sm mt-0.5">{profileDrawerParty.name}</p>
              </div>
              <div>
                <p className="text-[var(--muted)]">فروشگاه / برند</p>
                <p className="font-bold text-sm mt-0.5">{profileDrawerParty.storeName || "—"}</p>
              </div>
              <div>
                <p className="text-[var(--muted)]">شماره تماس</p>
                <p className="font-mono font-semibold mt-0.5" dir="ltr">
                  {profileDrawerParty.mobile}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted)]">شهر</p>
                <p className="font-semibold mt-0.5">{profileDrawerParty.city}</p>
              </div>
              <div>
                <p className="text-[var(--muted)]">وضعیت تاییدیه</p>
                <p className="font-bold mt-0.5">
                  {profileDrawerParty.verificationStatus === "approved"
                    ? "✓ فعال و تایید شده"
                    : "در انتظار بررسی مدارک"}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted)]">مجموع حجم مبادلات</p>
                <p className="font-semibold mt-0.5">
                  {profileDrawerParty.totalPurchaseGrams
                    ? `${formatNumber(profileDrawerParty.totalPurchaseGrams)} گرم`
                    : "—"}
                </p>
              </div>
            </Panel>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--line)]">
              <Button
                variant="secondary"
                onClick={() => setProfileDrawerParty(null)}
              >
                بستن
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
