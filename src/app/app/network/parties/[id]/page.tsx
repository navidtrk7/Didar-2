"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Download,
  Eye,
  FileCheck,
  FileText,
  History,
  Layers,
  MapPin,
  Package,
  Phone,
  Plus,
  Shield,
  ShieldCheck,
  Store,
  Tag,
  Truck,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";
import {
  retailerAccountsSeed,
  storeBranchesSeed,
  producerAccountsSeed,
  supplierAccountsSeed,
  salesAgentsSeed,
  deliveryCouriersSeed,
  endCustomersSeed,
  ordersSeed,
} from "@/data/mock";
import { formatMoney, formatNumber } from "@/lib/utils";
import { Badge, Button, Input, Modal, Panel, Stat } from "@/components/ui";
import { useToast } from "@/components/toast";

interface PartyDocument {
  id: string;
  title: string;
  fileName: string;
  category: string;
  uploadedAt: string;
  status: "verified" | "pending" | "needs_update";
  size: string;
}

interface PartyTransaction {
  id: string;
  orderCode: string;
  type: "purchase" | "consignment" | "settlement" | "proforma";
  typeLabel: string;
  weightGrams: number;
  valueIrr: number;
  date: string;
  status: "completed" | "processing" | "delivered" | "issued";
  statusLabel: string;
  itemsCount: number;
}

export default function PartyProfileDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const partyId = resolvedParams.id;
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<
    "transactions" | "documents" | "details" | "audit"
  >("transactions");

  const [uploadDocModalOpen, setUploadDocModalOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("پروانه کسب معتبر اتحادیه طلا");
  const [newDocFile, setNewDocFile] = useState("");

  // Look up party in seeds or local storage
  const party = useMemo(() => {
    // 1. Check retailer accounts
    const ret = retailerAccountsSeed.find((r) => r.id === partyId);
    if (ret) {
      return {
        id: ret.id,
        uidCode: `UID-DDR-RET-${ret.id.toUpperCase()}`,
        name: ret.managerName,
        storeName: ret.storeName,
        partyType: ret.businessType === "wholesaler" ? "wholesaler" : "retailer",
        partyTypeLabel:
          ret.businessType === "wholesaler" ? "بنکدار طلا و پخش عمده" : "گالری و خرده‌فروش طلا",
        mobile: ret.mobile,
        city: ret.city,
        address: ret.address,
        licenseNumber: ret.licenseNumber || "TR-8821-GOLD",
        verificationStatus: ret.verificationStatus,
        totalPurchaseGrams: ret.totalPurchaseGrams,
        totalPurchaseIrr: ret.totalPurchaseIrr,
        creditCeilingIrr: 5_000_000_000,
        usedCreditIrr: 1_200_000_000,
        registeredAt: ret.createdAt,
        branches: storeBranchesSeed.filter((s) => s.retailerId === ret.id),
      };
    }

    // 2. Check producer accounts
    const prod = producerAccountsSeed.find((p) => p.id === partyId);
    if (prod) {
      return {
        id: prod.id,
        uidCode: `UID-DDR-PRD-${prod.id.toUpperCase()}`,
        name: prod.managerName,
        storeName: prod.brandName,
        partyType: "producer" as const,
        partyTypeLabel: "کارخانه / کارگاه تولیدی طلا",
        mobile: prod.mobile,
        city: prod.city,
        address: prod.productionLocation,
        licenseNumber: "PR-7701-GOLD",
        verificationStatus: prod.verificationStatus === "verified" ? "approved" : "pending",
        totalPurchaseGrams: prod.productionVolumeGrams,
        totalPurchaseIrr: prod.productionVolumeGrams * 18_500_000,
        creditCeilingIrr: 15_000_000_000,
        usedCreditIrr: 3_400_000_000,
        registeredAt: "۱۴۰۴/۰۳/۱۰",
        branches: [],
      };
    }

    // 3. Fallback generic profile
    return {
      id: partyId,
      uidCode: `UID-DDR-PTY-${partyId.toUpperCase()}`,
      name: "طرف شبکه دیدار",
      storeName: "گالری / بنکداری فعال",
      partyType: "retailer" as const,
      partyTypeLabel: "طرف شبکه",
      mobile: "09121112233",
      city: "تهران",
      address: "تهران، بازار بزرگ، راسته طلافروشان",
      licenseNumber: "TR-9900-GOLD",
      verificationStatus: "approved" as const,
      totalPurchaseGrams: 450.5,
      totalPurchaseIrr: 8_200_000_000,
      creditCeilingIrr: 2_000_000_000,
      usedCreditIrr: 450_000_000,
      registeredAt: "۱۴۰۴/۰۱/۱۵",
      branches: [],
    };
  }, [partyId]);

  // Documents list state
  const [documents, setDocuments] = useState<PartyDocument[]>([
    {
      id: "doc-101",
      title: "پروانه کسب اتحادیه طلا و جواهر",
      fileName: "union_trade_license_1405.pdf",
      category: "مجوز صنفی",
      uploadedAt: "۱۴۰۴/۰۲/۱۵",
      status: "verified",
      size: "۲.۴ مگابایت",
    },
    {
      id: "doc-102",
      title: "کارت ملی و شناسنامه مسئول واحد",
      fileName: "national_identity_card.jpg",
      category: "هویتی",
      uploadedAt: "۱۴۰۴/۰۲/۱۵",
      status: "verified",
      size: "۱.۱ مگابایت",
    },
    {
      id: "doc-103",
      title: "عکس تابلوی فروشگاه و ویترین رسمی",
      fileName: "storefront_photo_verified.jpg",
      category: "مکان فیزیکی",
      uploadedAt: "۱۴۰۴/۰۲/۱۶",
      status: "verified",
      size: "۳.۵ مگابایت",
    },
    {
      id: "doc-104",
      title: "قرارداد پذیرش و تضمین اصالت دیدار",
      fileName: "didar_signed_agreement.pdf",
      category: "حقوقی",
      uploadedAt: "۱۴۰۴/۰۲/۱۸",
      status: "verified",
      size: "۱.۸ مگابایت",
    },
  ]);

  // Transactions list
  const [transactions, setTransactions] = useState<PartyTransaction[]>([
    {
      id: "tx-1",
      orderCode: "DG-1405-882",
      type: "purchase",
      typeLabel: "خرید کاتالوگ ۱۸ عیار",
      weightGrams: 142.5,
      valueIrr: 2_640_000_000,
      date: "امروز ۱۰:۳۰",
      status: "delivered",
      statusLabel: "تحویل موفق در شعبه",
      itemsCount: 6,
    },
    {
      id: "tx-2",
      orderCode: "DG-1405-794",
      type: "purchase",
      typeLabel: "خرید عمده نیم‌ست و النگو",
      weightGrams: 280.0,
      valueIrr: 5_190_000_000,
      date: "۳ روز پیش",
      status: "completed",
      statusLabel: "تسویه کامل نقدی",
      itemsCount: 12,
    },
    {
      id: "tx-3",
      orderCode: "DG-1405-641",
      type: "proforma",
      typeLabel: "پیش‌فاکتور با قفل نرخ",
      weightGrams: 98.0,
      valueIrr: 1_820_000_000,
      date: "هفته گذشته",
      status: "completed",
      statusLabel: "نهایی‌شده و تبدیل به سفارش",
      itemsCount: 4,
    },
  ]);

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    const newDoc: PartyDocument = {
      id: `doc-${Date.now()}`,
      title: newDocTitle,
      fileName: newDocFile.trim() || `${newDocTitle.replace(/\s+/g, "_")}.pdf`,
      category: "اسناد تکمیلی",
      uploadedAt: "هم‌اکنون",
      status: "verified",
      size: "۱.۵ مگابایت",
    };
    setDocuments([newDoc, ...documents]);
    setUploadDocModalOpen(false);
    setNewDocFile("");
    toast(`سند «${newDoc.title}» با موفقیت پیوست و تایید شد.`, "ok");
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <Link
            href="/app/network"
            className="hover:text-[var(--ink)] flex items-center gap-1 transition-colors"
          >
            <Building2 size={14} />
            شبکه دیدار
          </Link>
          <span>/</span>
          <Link
            href="/app/network/customers"
            className="hover:text-[var(--ink)] transition-colors"
          >
            تمام مشتریان و طرف‌ها
          </Link>
          <span>/</span>
          <span className="font-bold text-[var(--ink)]">{party.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/app/network/customers">
            <Button variant="secondary" className="text-xs">
              <ArrowRight size={14} />
              بازگشت به لیست
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Profile Header Banner */}
      <div className="rounded-3xl border border-[var(--line)] bg-gradient-to-br from-white via-[var(--cream)]/40 to-amber-50/30 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-xl bg-[var(--ink)] px-3 py-1 font-mono text-xs font-bold text-amber-300 shadow-xs">
                {party.uidCode}
              </span>
              <Badge tone={party.verificationStatus === "approved" ? "ok" : "warn"}>
                {party.verificationStatus === "approved"
                  ? "✓ احراز هویت و تایید شده"
                  : "در انتظار مدارک"}
              </Badge>
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--gold-deep)] border border-[var(--line)]">
                {party.partyTypeLabel}
              </span>
            </div>

            <h1 className="font-[family-name:var(--font-display)] text-2xl sm:text-4xl font-bold text-[var(--ink)]">
              {party.storeName || party.name}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--muted)] pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Store size={14} className="text-[var(--gold-deep)]" />
                مسئول: <strong className="text-[var(--ink)]">{party.name}</strong>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Phone size={14} className="text-[var(--gold-deep)]" />
                شماره تماس:{" "}
                <strong className="text-[var(--ink)] font-mono" dir="ltr">
                  {party.mobile}
                </strong>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin size={14} className="text-[var(--gold-deep)]" />
                شهر: <strong className="text-[var(--ink)]">{party.city}</strong>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <FileCheck size={14} className="text-[var(--gold-deep)]" />
                پروانه اتحادیه:{" "}
                <strong className="text-[var(--ink)] font-mono">
                  {party.licenseNumber}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => setUploadDocModalOpen(true)}>
              <Upload size={16} />
              الصاق مدرک جدید
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label="کل حجم مبادلات طلا"
          value={`${formatNumber(party.totalPurchaseGrams)} گرم`}
          hint="طلای ۱۸ عیار استاندارد"
        />
        <Stat
          label="مجموع ارزش مبادلات"
          value={`${formatNumber(Math.round(party.totalPurchaseIrr / 10_000_000))} م.ت`}
          hint="تومان نقد و اعتباری"
        />
        <Stat
          label="سقف اعتبار تجاری"
          value={`${formatNumber(Math.round(party.creditCeilingIrr / 10_000_000))} م.ت`}
          hint={`مصرف‌شده: ${formatNumber(Math.round(party.usedCreditIrr / 10_000_000))} م.ت`}
        />
        <Stat
          label="تعداد سفارش‌ها و اسناد"
          value={formatNumber(transactions.length)}
          hint="تراکنش‌های ثبت‌شده"
        />
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex border-b border-[var(--line)] gap-2">
        {[
          {
            id: "transactions",
            label: "داشبورد تراکنش‌ها و سفارشات",
            icon: Coins,
            count: transactions.length,
          },
          {
            id: "documents",
            label: "اسناد و مدارک آپلودشده",
            icon: FileText,
            count: documents.length,
          },
          {
            id: "details",
            label: "اطلاعات حقوقی، شعب و آدرس‌ها",
            icon: Building2,
            count: party.branches.length,
          },
          {
            id: "audit",
            label: "سوابق و لاگ حسابرسی",
            icon: History,
          },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
                isActive
                  ? "border-[var(--ink)] text-[var(--ink)]"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              <Icon size={16} />
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className="rounded-full bg-[var(--mist)] px-2 py-0.5 text-[10px] text-[var(--ink)]">
                  {formatNumber(t.count)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: TRANSACTIONS & ORDERS HISTORY */}
      {activeTab === "transactions" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-[var(--ink)]">
              سوابق خرید، سفارشات و پیش‌فاکتورهای ثبت‌شده
            </h2>
            <Badge tone="ok">ثبت سیستمی و معتبر</Badge>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[var(--mist)] border-b border-[var(--line)] text-[var(--muted)]">
                  <tr>
                    <th className="py-3 px-4">کد سفارش</th>
                    <th className="py-3 px-4">شرح تراکنش</th>
                    <th className="py-3 px-4">تعداد اقلام</th>
                    <th className="py-3 px-4">وزن طلا (گرم)</th>
                    <th className="py-3 px-4">ارزش کل (تومان)</th>
                    <th className="py-3 px-4">تاریخ ثبت</th>
                    <th className="py-3 px-4">وضعیت</th>
                    <th className="py-3 px-4 text-center">شناسنامه / اقدام</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] text-[var(--ink)]">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-[var(--cream)]/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[var(--gold-deep)]">
                        {tx.orderCode}
                      </td>
                      <td className="py-3.5 px-4 font-semibold">{tx.typeLabel}</td>
                      <td className="py-3.5 px-4">{formatNumber(tx.itemsCount)} قطعه</td>
                      <td className="py-3.5 px-4 font-mono font-semibold">
                        {formatNumber(tx.weightGrams)} گرم
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-emerald-800">
                        {formatMoney(tx.valueIrr)}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--muted)]">{tx.date}</td>
                      <td className="py-3.5 px-4">
                        <Badge tone="ok">{tx.statusLabel}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link href="/app/commerce/orders">
                          <Button variant="ghost" className="text-xs py-1 px-2.5">
                            مشاهده سند
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: UPLOADED DOCUMENTS & CERTIFICATES */}
      {activeTab === "documents" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-[var(--ink)]">
              مدارک هویتی، پروانه‌های صنفی و اسناد آپلودشده
            </h2>
            <Button onClick={() => setUploadDocModalOpen(true)} className="text-xs">
              <Plus size={14} />
              افزودن مدرک جدید
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <FileCheck size={20} />
                    </div>
                    <Badge tone="ok">تایید شده</Badge>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-[var(--ink)]">
                      {doc.title}
                    </h3>
                    <p className="text-[11px] font-mono text-[var(--muted)] truncate mt-0.5">
                      {doc.fileName}
                    </p>
                  </div>

                  <div className="rounded-xl bg-[var(--mist)] p-2 text-[11px] text-[var(--muted)] space-y-1">
                    <div className="flex justify-between">
                      <span>دسته‌بندی:</span>
                      <span className="font-semibold text-[var(--ink)]">{doc.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>حجم فایل:</span>
                      <span>{doc.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>تاریخ ثبت:</span>
                      <span>{doc.uploadedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toast(`پیش‌نمایش سند «${doc.title}» باز شد.`, "ok")}
                    className="flex items-center gap-1 text-xs font-bold text-[var(--gold-deep)] hover:text-amber-800"
                  >
                    <Eye size={13} />
                    مشاهده سند
                  </button>
                  <button
                    type="button"
                    onClick={() => toast(`دانلود فایل ${doc.fileName} آغاز شد.`, "ok")}
                    className="text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    <Download size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 3: DETAILS, BRANCHES & STORES */}
      {activeTab === "details" && (
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Panel className="p-5 space-y-3">
              <h3 className="font-bold text-sm text-[var(--ink)] flex items-center gap-2">
                <Store size={16} className="text-[var(--gold-deep)]" />
                مشخصات کسب‌وکار و آدرس اصلی
              </h3>
              <div className="rounded-xl bg-[var(--mist)] p-3 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">نام رسمی:</span>
                  <span className="font-bold">{party.storeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">مسئول صاحب پروانه:</span>
                  <span className="font-semibold">{party.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">تلفن همراه:</span>
                  <span className="font-mono font-bold" dir="ltr">
                    {party.mobile}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">شماره پروانه کسب:</span>
                  <span className="font-mono">{party.licenseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">شهر و استان:</span>
                  <span>{party.city}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--muted)]">نشانی پستی:</span>
                  <span>{party.address}</span>
                </div>
              </div>
            </Panel>

            <Panel className="p-5 space-y-3">
              <h3 className="font-bold text-sm text-[var(--ink)] flex items-center gap-2">
                <Building2 size={16} className="text-[var(--gold-deep)]" />
                شعب تحت پوشش ({formatNumber(party.branches.length)} شعبه)
              </h3>
              {party.branches.length > 0 ? (
                <div className="space-y-2">
                  {party.branches.map((b) => (
                    <div
                      key={b.id}
                      className="rounded-xl border border-[var(--line)] bg-white p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-[var(--ink)]">
                          {b.branchName}
                        </span>
                        <Badge tone="ok">{b.branchCode}</Badge>
                      </div>
                      <p className="text-[11px] text-[var(--muted)]">{b.address}</p>
                      <div className="flex justify-between pt-1 text-[11px]">
                        <span>تماس تحویل: {b.mainContact}</span>
                        <span className="font-mono" dir="ltr">
                          {b.mobile}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl bg-[var(--mist)] p-4 text-center text-xs text-[var(--muted)]">
                  شعبه مجزایی تعریف نشده است (شعبه اصلی فعال است).
                </div>
              )}
            </Panel>
          </div>
        </section>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === "audit" && (
        <section className="space-y-3">
          <h3 className="font-bold text-sm text-[var(--ink)]">
            تاریخچه رویدادها، تایید مدارک و فعالیت‌ها
          </h3>
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5 space-y-3 text-xs">
            <div className="flex items-start gap-3 pb-3 border-b border-[var(--line)]">
              <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-bold text-[var(--ink)]">
                  تکمیل و تایید کلیه مدارک صنفی و فعال‌سازی سقف اعتبار تجاری
                </p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">
                  توسط کارشناس ستاد دیدار · دیروز ۱۵:۳۰
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pb-3 border-b border-[var(--line)]">
              <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-bold text-[var(--ink)]">
                  ثبت سفارش خرید کاتالوگ ۱۸ عیار با شناسه DG-1405-882
                </p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">
                  ثبت از طریق درگاه سفارشات خرده‌فروشی · دیروز ۱۱:۰۰
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <p className="font-bold text-[var(--ink)]">
                  ایجاد اولیه پروفایل و ثبت اطلاعات هویتی
                </p>
                <p className="text-[11px] text-[var(--muted)] mt-0.5">
                  ثبت در سامانه · {party.registeredAt}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* UPLOAD NEW DOCUMENT MODAL */}
      <Modal
        open={uploadDocModalOpen}
        onClose={() => setUploadDocModalOpen(false)}
        title="الصاق مدرک جدید به پرونده"
        subtitle={`متقاضی: ${party.name} (${party.storeName}) · شناسه: ${party.uidCode}`}
      >
        <form onSubmit={handleUploadDoc} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-[var(--ink)]">
              عنوان مدرک
            </label>
            <select
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none"
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
            >
              <option value="پروانه کسب معتبر اتحادیه طلا">پروانه کسب معتبر اتحادیه طلا</option>
              <option value="کارت ملی و شناسنامه مسئول">کارت ملی و شناسنامه مسئول</option>
              <option value="عکس تابلوی فروشگاه و ویترین">عکس تابلوی فروشگاه و ویترین</option>
              <option value="سند مالکیت یا اجاره‌نامه رسمی">سند مالکیت یا اجاره‌نامه رسمی</option>
              <option value="تاییدیه عیارسنجی ری‌گری">تاییدیه عیارسنجی ری‌گری</option>
              <option value="قرارداد و سفته ضمانت">قرارداد و سفته ضمانت</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-[var(--ink)]">
              نام فایل اسکن‌شده
            </label>
            <Input
              placeholder="مثال: updated_license_1405.pdf"
              value={newDocFile}
              onChange={(e) => setNewDocFile(e.target.value)}
            />
          </div>

          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--mist)]/50 p-6 text-center">
            <Upload size={30} className="mx-auto text-[var(--gold-deep)] mb-1.5" />
            <p className="font-semibold text-xs">انتخاب فایل از رایانه</p>
            <p className="text-[11px] text-[var(--muted)] mt-1">
              فرمت‌های مجاز: PDF، JPG، PNG تا سقف ۲۰ مگابایت
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line)]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setUploadDocModalOpen(false)}
            >
              انصراف
            </Button>
            <Button type="submit">پیوست و تایید مدرک</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
