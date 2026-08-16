"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Clock,
  Coins,
  Download,
  Eye,
  Factory,
  FileCheck,
  FileText,
  HelpCircle,
  Phone,
  Plus,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Store,
  Truck,
  Upload,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { Badge, Button, Input, Modal, Panel, Stat } from "@/components/ui";
import { useToast } from "@/components/toast";
import { formatNumber } from "@/lib/utils";

interface PendingApplicant {
  id: string;
  name: string;
  storeName: string;
  partyType: "retailer" | "wholesaler" | "producer" | "agent" | "service_partner";
  partyTypeLabel: string;
  mobile: string;
  city: string;
  registeredAt: string;
  status: "pending_review" | "docs_uploaded" | "needs_revision";
  uploadedDocs: {
    id: string;
    title: string;
    fileName: string;
    uploadedAt: string;
    verified: boolean;
  }[];
}

const REQUIRED_DOCS_GUIDE = [
  {
    type: "producer",
    title: "کارخانه / کارگاه طلا",
    icon: Factory,
    color: "border-amber-300 bg-amber-50/50 text-amber-900",
    docs: [
      { name: "پروانه بهره‌برداری صمت", mandatory: true, note: "دارای اعتبار جاری" },
      { name: "تاییدیه عیارسنجی (ری‌گری) معتبر", mandatory: true, note: "اثبات عیار ۷۵۰ (۱۸K)" },
      { name: "کد کارگاهی رسمی اتحادیه طلا", mandatory: true, note: "کد منقوش روی مصنوعات" },
      { name: "کارت ملی و شناسنامه مدیر کارگاه", mandatory: true, note: "احراز هویت فردی" },
    ],
  },
  {
    type: "wholesaler",
    title: "بنکدار طلا و پخش عمده",
    icon: Coins,
    color: "border-blue-300 bg-blue-50/50 text-blue-900",
    docs: [
      { name: "جواز کسب بنکداری اتحادیه طلا", mandatory: true, note: "رسته بنکداری / عمده‌فروشی" },
      { name: "سند مالکیت یا اجاره‌نامه رسمی", mandatory: true, note: "محل معتبر در راسته بازار" },
      { name: "احراز حساب تجاری یا مرجع زرین", mandatory: true, note: "جهت تسویه اعتباری" },
      { name: "معرفی‌نامه رابطان خرید و بنکداری", mandatory: false, note: "اختیاری" },
    ],
  },
  {
    type: "retailer",
    title: "گالری و خرده‌فروش طلا",
    icon: Store,
    color: "border-emerald-300 bg-emerald-50/50 text-emerald-900",
    docs: [
      { name: "پروانه کسب طلافروشی از اتحادیه", mandatory: true, note: "مجوز معتبر صنف طلا" },
      { name: "تصویر تابلوی فروشگاه و ویترین", mandatory: true, note: "عکس باکیفیت روز" },
      { name: "کارت ملی صاحب پروانه", mandatory: true, note: "احراز هویت مدیر" },
      { name: "تعهدنامه پذیرش استاندارد دیدار", mandatory: true, note: "امضای دیجیتال یا فیزیکی" },
    ],
  },
  {
    type: "agent",
    title: "ایجنت و ویزیتور فروش",
    icon: UserCheck,
    color: "border-teal-300 bg-teal-50/50 text-teal-900",
    docs: [
      { name: "قرارداد عاملیت فروش میدانی", mandatory: true, note: "امضای قرارداد همکاری" },
      { name: "سفته ضمانت حسن انجام کار", mandatory: true, note: "پشتیبان سبد سیار طلا" },
      { name: "گواهی عدم سوءپیشینه و احراز سکونت", mandatory: true, note: "تاییدیه اماکن" },
      { name: "تصویر مدارک هویتی", mandatory: true, note: "شناسنامه و کارت ملی" },
    ],
  },
  {
    type: "service_partner",
    title: "همکاران خدمات و ترانزیت امن",
    icon: Truck,
    color: "border-indigo-300 bg-indigo-50/50 text-indigo-900",
    docs: [
      { name: "مجوز ترانزیت امن و اسکورت مسلح", mandatory: true, note: "صادره از مراجع ذیصلاح" },
      { name: "بیمه‌نامه جامع مسئولیت و بار طلا", mandatory: true, note: "پوشش کامل شمش و مصنوعات" },
      { name: "معرفی‌نامه پرسنل تحویل و رانندگان", mandatory: true, note: "همراه با کارت پرسنلی" },
    ],
  },
];

export default function OnboardingPage() {
  const { toast } = useToast();

  const [applicants, setApplicants] = useState<PendingApplicant[]>([
    {
      id: "app-101",
      name: "امیرحسین جواهری",
      storeName: "گالری طلای پرنیا",
      partyType: "retailer",
      partyTypeLabel: "گالری طلا",
      mobile: "09129876543",
      city: "اصفهان",
      registeredAt: "امروز ۱۰:۱۵",
      status: "docs_uploaded",
      uploadedDocs: [
        {
          id: "doc-1",
          title: "پروانه کسب اتحادیه طلا اصفهان",
          fileName: "parnia_union_license.pdf",
          uploadedAt: "امروز ۱۰:۲۰",
          verified: true,
        },
        {
          id: "doc-2",
          title: "کارت ملی مدیر فروشگاه",
          fileName: "national_id_front.jpg",
          uploadedAt: "امروز ۱۰:۲۲",
          verified: true,
        },
        {
          id: "doc-3",
          title: "عکس تابلوی فروشگاه",
          fileName: "storefront_photo.jpg",
          uploadedAt: "امروز ۱۰:۲۵",
          verified: false,
        },
      ],
    },
    {
      id: "app-102",
      name: "حاج ابوالفضل کاشانی",
      storeName: "بنکداری طلا کاشانی و شرکا",
      partyType: "wholesaler",
      partyTypeLabel: "بنکدار طلا",
      mobile: "09121239988",
      city: "تهران (بازار بزرگ)",
      registeredAt: "دیروز ۱۶:۴۰",
      status: "pending_review",
      uploadedDocs: [
        {
          id: "doc-4",
          title: "جواز کسب بنکداری",
          fileName: "kashani_license.pdf",
          uploadedAt: "دیروز ۱۷:۰۰",
          verified: true,
        },
        {
          id: "doc-5",
          title: "سند سرای خرد پلاک ۴",
          fileName: "sanad_bazar.pdf",
          uploadedAt: "دیروز ۱۷:۰۵",
          verified: false,
        },
      ],
    },
    {
      id: "app-103",
      name: "مهندس فرزاد فرهمند",
      storeName: "کارگاه زرگری نوین آرت",
      partyType: "producer",
      partyTypeLabel: "کارخانه / کارگاه",
      mobile: "09125551144",
      city: "تهران",
      registeredAt: "۲ روز پیش",
      status: "needs_revision",
      uploadedDocs: [
        {
          id: "doc-6",
          title: "کد کارگاهی اتحادیه",
          fileName: "workshop_code_t78.jpg",
          uploadedAt: "۲ روز پیش",
          verified: true,
        },
      ],
    },
  ]);

  // Modal States
  const [manualUploadOpen, setManualUploadOpen] = useState(false);
  const [inspectModalApplicant, setInspectModalApplicant] =
    useState<PendingApplicant | null>(null);

  // Manual Upload Form
  const [uploadTargetId, setUploadTargetId] = useState("");
  const [docCategory, setDocCategory] = useState("پروانه کسب اتحادیه طلا");
  const [docFileName, setDocFileName] = useState("");
  const [docRefCode, setDocRefCode] = useState("");

  const handleManualUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTargetId || !docCategory.trim()) {
      toast("لطفاً طرف شبکه و نوع مدرک را مشخص کنید.", "warn");
      return;
    }

    const newDoc = {
      id: `doc-${Date.now()}`,
      title: docCategory,
      fileName: docFileName.trim() || `${docCategory.replace(/\s+/g, "_")}.pdf`,
      uploadedAt: "هم‌اکنون (توسط کارشناس ستاد)",
      verified: true,
    };

    setApplicants((prev) =>
      prev.map((a) =>
        a.id === uploadTargetId
          ? {
              ...a,
              status: "docs_uploaded",
              uploadedDocs: [...a.uploadedDocs, newDoc],
            }
          : a,
      ),
    );

    setManualUploadOpen(false);
    setUploadTargetId("");
    setDocFileName("");
    setDocRefCode("");
    toast("مدرک با موفقیت توسط پرسنل ستادی ثبت و تایید گردید.", "ok");
  };

  const handleApproveApplicant = (id: string) => {
    setApplicants((prev) => prev.filter((a) => a.id !== id));
    setInspectModalApplicant(null);
    toast("عضویت متقاضی تایید شد و حساب کاربری او فعال گردید.", "ok");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--gold-deep)]">
            <ShieldCheck size={16} />
            <span>مدیریت پذیرش، احراز هویت و اسناد شبکه طلا</span>
          </div>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
            درخواست‌های عضویت، مدارک و احراز هویت
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--muted)]">
            بررسی پرونده‌های در انتظار، راهنمای مدارک الزامی هر صنف، و امکان آپلود دستی اسناد توسط پرسنل ستادی دیدار.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setManualUploadOpen(true)}>
            <Upload size={16} />
            آپلود دستی مدارک (ویژه ستاد)
          </Button>
          <Link href="/app/network/customers">
            <Button variant="secondary">مشاهده همه طرف‌ها</Button>
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat
          label="پرونده‌های در انتظار"
          value={formatNumber(applicants.length)}
          hint="نیازمند بررسی کارشناس"
          trend="اقدام فوری"
        />
        <Stat
          label="مدارک بارگذاری‌شده"
          value={formatNumber(
            applicants.reduce((acc, a) => acc + a.uploadedDocs.length, 0),
          )}
          hint="اسناد موجود در صف"
        />
        <Stat
          label="پذیرش‌های این ماه"
          value="۴۸ طرف"
          hint="گالری، بنکدار، کارگاه"
        />
        <Stat
          label="میانگین زمان بررسی"
          value="۱.۵ ساعت"
          hint="احراز هویت هوشمند"
        />
      </div>

      {/* SECTION 1: PENDING APPLICANTS QUEUE */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
            <Clock size={20} className="text-amber-600" />
            لیست افراد و کسب‌وکارهای در انتظار تایید ({formatNumber(applicants.length)} مورد)
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {applicants.map((a) => (
            <div
              key={a.id}
              className="rounded-3xl border border-amber-200 bg-white p-5 shadow-sm hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-amber-700">
                      {a.partyTypeLabel}
                    </span>
                    <h3 className="font-bold text-base text-[var(--ink)] mt-0.5">
                      {a.name}
                    </h3>
                    <p className="text-xs font-medium text-[var(--muted)]">
                      {a.storeName}
                    </p>
                  </div>
                  <Badge tone={a.status === "needs_revision" ? "danger" : "warn"}>
                    {a.status === "docs_uploaded"
                      ? "مدارک کامل"
                      : a.status === "needs_revision"
                        ? "نیازمند اصلاح"
                        : "در انتظار بررسی"}
                  </Badge>
                </div>

                <div className="rounded-2xl bg-[var(--mist)] p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">موبایل:</span>
                    <span className="font-mono font-semibold" dir="ltr">
                      {a.mobile}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">شهر:</span>
                    <span>{a.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted)]">تعداد اسناد ارسالی:</span>
                    <span className="font-semibold text-emerald-800">
                      {formatNumber(a.uploadedDocs.length)} مدرک
                    </span>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <p className="text-[11px] font-semibold text-[var(--muted)]">
                    اسناد الصاق‌شده:
                  </p>
                  <ul className="space-y-1 text-xs">
                    {a.uploadedDocs.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex items-center justify-between rounded-xl bg-white border border-[var(--line)] p-2"
                      >
                        <span className="truncate max-w-[170px] flex items-center gap-1.5">
                          <FileText size={13} className="text-[var(--gold-deep)]" />
                          {doc.title}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold">
                          {doc.verified ? "✓ تایید" : "در انتظار"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center gap-2">
                <Button
                  className="flex-1 text-xs bg-amber-600 hover:bg-amber-700"
                  onClick={() => setInspectModalApplicant(a)}
                >
                  <FileCheck size={14} />
                  بررسی و تایید نهایی
                </Button>
              </div>
            </div>
          ))}
        </div>

        {applicants.length === 0 && (
          <div className="rounded-3xl border border-[var(--line)] bg-white p-12 text-center space-y-2">
            <CheckCircle2 size={40} className="mx-auto text-emerald-600" />
            <h3 className="font-bold text-base">تمامی پرونده‌ها بررسی و تایید شده‌اند</h3>
            <p className="text-xs text-[var(--muted)]">
              در حال حاضر متقاضی جدیدی در صف انتظار نیست.
            </p>
          </div>
        )}
      </section>

      {/* SECTION 2: COMPREHENSIVE REQUIRED DOCUMENTS GUIDE PER PARTY TYPE */}
      <section className="space-y-4 pt-4 border-t border-[var(--line)]">
        <div>
          <h2 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
            <HelpCircle size={20} className="text-[var(--gold-deep)]" />
            راهنمای جامع مدارک الزامی به تفکیک نوع طرف در بازار ایران
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            چک‌لیست مدارک موردنیاز قبل از شروع همکاری و فعال‌سازی سقف اعتبار تجاری دیدار
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REQUIRED_DOCS_GUIDE.map((g) => {
            const Icon = g.icon;
            return (
              <div
                key={g.type}
                className={`rounded-3xl border ${g.color} p-5 shadow-xs flex flex-col justify-between`}
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-xs">
                      <Icon size={20} />
                    </div>
                    <h3 className="font-bold text-base">{g.title}</h3>
                  </div>

                  <ul className="space-y-2 text-xs">
                    {g.docs.map((d, i) => (
                      <li
                        key={i}
                        className="rounded-2xl bg-white/80 border border-[var(--line)] p-2.5 flex items-start justify-between gap-2"
                      >
                        <div>
                          <p className="font-bold text-[var(--ink)]">{d.name}</p>
                          <p className="text-[11px] text-[var(--muted)] mt-0.5">
                            {d.note}
                          </p>
                        </div>
                        {d.mandatory && (
                          <Badge tone="warn" className="text-[10px] shrink-0">
                            اجباری
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-3 border-t border-black/10 text-[11px] text-[var(--muted)]">
                  تکمیل این اسناد برای فعال‌سازی سقف اعتبار الزامی است.
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MODAL: MANUAL STAFF DOCUMENT UPLOAD */}
      <Modal
        open={manualUploadOpen}
        onClose={() => setManualUploadOpen(false)}
        title="ثبت و آپلود دستی مدارک (پرسنل ستادی دیدار)"
        subtitle="الصاق مستقیم مدارک دریافتی از طریق فکس، پیام‌رسان یا تحویل حضوری"
        size="lg"
      >
        <form onSubmit={handleManualUploadSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-[var(--ink)]">
              انتخاب متقاضی یا طرف شبکه <span className="text-red-500">*</span>
            </label>
            <select
              required
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none"
              value={uploadTargetId}
              onChange={(e) => setUploadTargetId(e.target.value)}
            >
              <option value="">انتخاب پرونده متقاضی...</option>
              {applicants.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.storeName} - {a.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-[var(--ink)]">
              نوع مدرک الصاقی <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none"
              value={docCategory}
              onChange={(e) => setDocCategory(e.target.value)}
            >
              <option value="پروانه کسب اتحادیه طلا">پروانه کسب اتحادیه طلا</option>
              <option value="تصویر کارت ملی و شناسنامه">تصویر کارت ملی و شناسنامه</option>
              <option value="عکس تابلوی فروشگاه و ویترین">عکس تابلوی فروشگاه و ویترین</option>
              <option value="سند یا اجاره‌نامه رسمی محل">سند یا اجاره‌نامه رسمی محل</option>
              <option value="کد کارگاهی و تاییدیه ری‌گری">کد کارگاهی و تاییدیه ری‌گری</option>
              <option value="قرارداد و سفته ضمانت">قرارداد و سفته ضمانت</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-[var(--ink)]">
              نام فایل یا شماره رهگیری سند
            </label>
            <Input
              placeholder="مثال: license_scan_approved_1405.pdf"
              value={docFileName}
              onChange={(e) => setDocFileName(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-[var(--ink)]">
              کد ثبت در بایگانی فیزیکی ستاد
            </label>
            <Input
              placeholder="مثال: ARCH-1405-BOX-12"
              value={docRefCode}
              onChange={(e) => setDocRefCode(e.target.value)}
            />
          </div>

          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[var(--mist)]/40 p-6 text-center">
            <Upload size={32} className="mx-auto text-[var(--gold-deep)] mb-2" />
            <p className="font-semibold text-sm">بارگذاری فایل اسکن‌شده</p>
            <p className="text-[11px] text-[var(--muted)] mt-1">
              فرمت‌های مجاز: PDF، JPG، PNG تا سقف ۲۰ مگابایت
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line)]">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setManualUploadOpen(false)}
            >
              انصراف
            </Button>
            <Button type="submit">ثبت و تایید مستقیم مدرک</Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: INSPECT & APPROVE APPLICANT */}
      {inspectModalApplicant && (
        <Modal
          open={Boolean(inspectModalApplicant)}
          onClose={() => setInspectModalApplicant(null)}
          title={`بررسی پرونده: ${inspectModalApplicant.name}`}
          subtitle={`${inspectModalApplicant.storeName} · ${inspectModalApplicant.city}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="rounded-2xl bg-[var(--mist)] p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">شماره تماس مسئول:</span>
                <span className="font-mono font-semibold" dir="ltr">
                  {inspectModalApplicant.mobile}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">رسته صنفی:</span>
                <span className="font-semibold">
                  {inspectModalApplicant.partyTypeLabel}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">زمان ثبت درخواست:</span>
                <span>{inspectModalApplicant.registeredAt}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-sm text-[var(--ink)]">
                اسناد بررسی‌شده در این پرونده:
              </h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {inspectModalApplicant.uploadedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-2xl border border-[var(--line)] bg-white p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">{doc.title}</span>
                      <CheckCircle2 size={16} className="text-emerald-600" />
                    </div>
                    <p className="text-[11px] font-mono text-[var(--muted)]">
                      {doc.fileName}
                    </p>
                    <p className="text-[10px] text-[var(--muted)]">
                      تاریخ بارگذاری: {doc.uploadedAt}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-900 leading-6">
              با تایید این پرونده، طرف شبکه با شناسه یکتا فعال شده، سقف اعتبار پایه برقرار گشته و امکان ثبت سفارش عمده و تحویل طلا فعال می‌شود.
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line)]">
              <Button
                variant="secondary"
                onClick={() => setInspectModalApplicant(null)}
              >
                انصراف
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleApproveApplicant(inspectModalApplicant.id)}
              >
                <CheckCircle2 size={16} />
                تایید نهایی و صدور مجوز فعالیت
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
