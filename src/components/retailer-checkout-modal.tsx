"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  FileCheck,
  FileText,
  Lock,
  Phone,
  ShieldCheck,
  Store,
  Upload,
  User as UserIcon,
  X,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useSession } from "@/context/session-context";
import { usePlatform } from "@/context/platform-context";
import { formatMoney, formatNumber, formatWeight } from "@/lib/utils";
import { Button, Input, Modal } from "@/components/ui";
import { useToast } from "@/components/toast";

interface RetailerCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  goldRate: number;
}

export function RetailerCheckoutModal({
  open,
  onClose,
  goldRate,
}: RetailerCheckoutModalProps) {
  const { items, calculateTotals, clearCart } = useCart();
  const { user, isAuthenticated, registerRetailer } = useSession();
  const { createOrder } = usePlatform();
  const { toast } = useToast();

  const totals = calculateTotals(goldRate);

  const [step, setStep] = useState<1 | 2>(1);
  const [createdOrderCode, setCreatedOrderCode] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Step 1 Form Data
  const [formData, setFormData] = useState({
    name: user?.name ?? "",
    phone: user?.username ?? "",
    storeName: user?.org ?? "",
    province: "تهران",
    city: "تهران",
    address: "",
    notes: "",
  });

  // Sync formData when user or modal open changes
  useEffect(() => {
    if (user && open) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        phone: prev.phone || user.username || "",
        storeName: prev.storeName || user.org || "",
      }));
    }
  }, [user, open]);

  // Step 2 Documents Data
  const [docData, setDocData] = useState({
    licenseNumber: "",
    licenseFile: null as string | null,
    nationalCardFile: null as string | null,
    storeFrontFile: null as string | null,
    docUploaded: false,
  });

  if (!open) return null;

  const handleSubmitStep1 = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = (formData.name || user?.name || "").trim();
    const phone = (formData.phone || user?.username || "").trim();
    const storeName = (formData.storeName || user?.org || "").trim();

    if (!name || !phone || !storeName) {
      toast("لطفاً نام، شماره تماس و نام فروشگاه را تکمیل فرمایید.", "warn");
      return;
    }

    setLoading(true);
    try {
      let activeRetailerName = name;
      let activeStoreName = storeName;

      // Register retailer if not logged in
      if (!isAuthenticated) {
        try {
          const regRes = await registerRetailer({
            name,
            phone,
            storeName,
            province: formData.province,
            city: formData.city,
          });

          if (regRes.ok && regRes.user) {
            activeRetailerName = regRes.user.name;
            activeStoreName = regRes.user.org;
          }
        } catch (regErr) {
          console.warn("Register retailer fallback:", regErr);
        }
      }

      // Generate Order code
      const orderCode = `DG-1405-${Math.floor(100 + Math.random() * 900)}`;

      // Register order into Platform State (with safe fallback)
      try {
        await createOrder({
          retailer: `${activeStoreName} (${activeRetailerName})`,
          items: totals.totalItems || 1,
          totalWeight: Number((totals.totalWeightGrams || 1).toFixed(2)),
          value: totals.grandTotal || 0,
          uids: items.map((i) => i.product.uidCode),
        });
      } catch (orderErr) {
        console.warn("Platform createOrder fallback to local storage:", orderErr);
      }

      // Save order in local orders store
      try {
        const key = "didar.orders.local";
        const raw = window.localStorage.getItem(key);
        const list = raw ? JSON.parse(raw) : [];
        list.unshift({
          code: orderCode,
          retailer: `${activeStoreName} (${activeRetailerName})`,
          phone,
          items: totals.totalItems,
          totalWeight: totals.totalWeightGrams,
          value: totals.grandTotal,
          createdAt: "امروز",
          status: "submitted",
        });
        window.localStorage.setItem(key, JSON.stringify(list));
      } catch {
        /* ignore */
      }

      setCreatedOrderCode(orderCode);
      clearCart();
      toast(`سفارش ${orderCode} با موفقیت ثبت شد!`, "ok");
      setStep(2);
    } catch (err) {
      console.error("Order finalization error:", err);
      const errMsg =
        err instanceof Error
          ? err.message
          : "خطا در نهایی‌سازی سفارش. لطفاً دوباره تلاش کنید.";
      toast(errMsg, "warn");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFakeDoc = (type: "license" | "national" | "front") => {
    if (type === "license") {
      setDocData((prev) => ({
        ...prev,
        licenseFile: "license_scan_gold_guild.pdf",
      }));
      toast("فایل تصویر پروانه کسب بارگذاری شد.", "info");
    } else if (type === "national") {
      setDocData((prev) => ({
        ...prev,
        nationalCardFile: "national_id_card.jpg",
      }));
      toast("تصویر کارت ملی بارگذاری شد.", "info");
    } else {
      setDocData((prev) => ({
        ...prev,
        storeFrontFile: "store_front_view.jpg",
      }));
      toast("تصویر تابلوی فروشگاه بارگذاری شد.", "info");
    }
  };

  const handleSubmitStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setDocData((prev) => ({ ...prev, docUploaded: true }));
    toast(
      "مدارک صنفی شما ثبت شد و پس از بررسی کارشناس دیدار تایید خواهد شد.",
      "ok",
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        step === 1
          ? "نهایی‌سازی سفارش و ثبت مشخصات خرده‌فروشی"
          : "سفارش شما ثبت شد · احراز هویت صنفی (اختیاری)"
      }
      subtitle={
        step === 1
          ? "ورود اطلاعات پایه فروشگاه و دریافت پیش‌فاکتور رسمی"
          : `کد پیگیری سفارش: ${createdOrderCode}`
      }
      size="lg"
    >
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4 text-xs font-semibold">
          <div
            className={`flex items-center gap-2 ${
              step >= 1 ? "text-[var(--gold-deep)]" : "text-[var(--muted)]"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step >= 1
                  ? "bg-[var(--gold-deep)] text-white"
                  : "border border-[var(--line)] bg-[var(--mist)] text-[var(--muted)]"
              }`}
            >
              ۱
            </span>
            <span>اطلاعات پایه و ثبت سفارش</span>
          </div>

          <div className="h-0.5 flex-1 mx-4 bg-[var(--line)]" />

          <div
            className={`flex items-center gap-2 ${
              step === 2 ? "text-[var(--gold-deep)]" : "text-[var(--muted)]"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                step === 2
                  ? "bg-[var(--gold-deep)] text-white"
                  : "border border-[var(--line)] bg-[var(--mist)] text-[var(--muted)]"
              }`}
            >
              ۲
            </span>
            <span>بارگذاری مدارک صنف طلا</span>
          </div>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSubmitStep1} className="space-y-5">
            {/* Order Brief Box */}
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--mist)] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <p className="text-xs text-[var(--muted)]">اقلام انتخابی:</p>
                  <p className="font-semibold text-[var(--ink)]">
                    {formatNumber(totals.totalItems)} قطعه طلا
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">مجموع وزن طلا:</p>
                  <p className="font-semibold text-[var(--ink)] tabular-nums">
                    {formatWeight(totals.totalWeightGrams)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--muted)]">مبلغ کل برآورد شده:</p>
                  <p className="font-bold text-[var(--gold-deep)] tabular-nums">
                    {formatMoney(totals.grandTotal)}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--ink)]">
                  نام و نام خانوادگی مسئول <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <UserIcon
                    size={16}
                    className="absolute right-3 top-3.5 text-[var(--muted)]"
                  />
                  <Input
                    required
                    placeholder="مثال: کیان پارسا"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="pr-9"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--ink)]">
                  شماره موبایل جهت هماهنگی و لاگین <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute right-3 top-3.5 text-[var(--muted)]"
                  />
                  <Input
                    required
                    type="tel"
                    dir="ltr"
                    placeholder="09123456789"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="pr-9 text-left font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--ink)]">
                  نام فروشگاه یا گالری طلا <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Store
                    size={16}
                    className="absolute right-3 top-3.5 text-[var(--muted)]"
                  />
                  <Input
                    required
                    placeholder="مثال: گالری طلای پارسا"
                    value={formData.storeName}
                    onChange={(e) =>
                      setFormData({ ...formData, storeName: e.target.value })
                    }
                    className="pr-9"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[var(--ink)]">
                  استان و شهر
                </label>
                <div className="relative">
                  <Building2
                    size={16}
                    className="absolute right-3 top-3.5 text-[var(--muted)]"
                  />
                  <Input
                    placeholder="مثال: تهران، بازار بزرگ"
                    value={`${formData.province} - ${formData.city}`}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        province: e.target.value.split("-")[0]?.trim() || "تهران",
                        city: e.target.value.split("-")[1]?.trim() || "تهران",
                      })
                    }
                    className="pr-9"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--ink)]">
                آدرس دقیق فروشگاه / تحویل
              </label>
              <Input
                placeholder="خیابان، پلاک، نام پاساژ، شماره واحد یا طبقه"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <div className="rounded-xl border border-amber-200/70 bg-amber-50/70 p-3 text-xs leading-6 text-amber-900">
              <div className="flex items-start gap-2">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-amber-700" />
                <p>
                  <strong>نکته مهم:</strong> پس از ثبت این فرم، حساب شما ایجاد شده و
                  پیش‌فاکتور رسمی صادر می‌شود. آپلود مدارک صنفی در گام بعدی کاملاً اختیاری
                  بوده و می‌توانید آن را بعداً در پنل کاربری انجام دهید.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                انصراف
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "در حال ثبت سفارش…" : "ثبت اطلاعات و نهایی‌سازی سفارش"}
                <ChevronLeft size={16} />
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Success Box */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-emerald-950">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={28} className="text-emerald-600 shrink-0" />
                <div>
                  <h3 className="font-bold text-base">
                    سفارش شما با شماره {createdOrderCode} با موفقیت ثبت شد!
                  </h3>
                  <p className="text-xs mt-1 text-emerald-800 leading-6">
                    حساب کاربری خرده‌فروشی شما فعال شد و اقلام در صف آماده‌سازی و صدور
                    پیش‌فاکتور قرار گرفتند.
                  </p>
                </div>
              </div>
            </div>

            {/* Document Upload Box */}
            <div className="rounded-2xl border border-[var(--line)] bg-white p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[var(--gold-deep)]" />
                  <h4 className="font-semibold text-sm">
                    بارگذاری مدارک صنفی جهت افزایش سقف اعتبار بنکداری
                  </h4>
                </div>
                <p className="text-xs text-[var(--muted)] mt-1.5 leading-6">
                  این مرحله جهت احراز هویت صنف طلا و فعال‌سازی تسویه مدت‌دار است. در صورت تمایل
                  می‌توانید هم‌اکنون مدارک را بارگذاری کنید یا این کار را بعداً در بخش پروفایل انجام
                  دهید.
                </p>
              </div>

              {docData.docUploaded ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-blue-900 flex items-center gap-3 text-xs">
                  <FileCheck size={20} className="text-blue-600 shrink-0" />
                  <div>
                    <p className="font-semibold">مدارک با موفقیت دریافت شد</p>
                    <p className="text-blue-700 mt-0.5">
                      مدارک شما در وضعیت «در انتظار تایید کارشناس سازمان دیدار» قرار دارد.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitStep2} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[var(--ink)]">
                      شماره پروانه کسب / جواز اتحادیه طلا
                    </label>
                    <Input
                      placeholder="مثال: ۹۸۷۶۵۴۳۲۱"
                      value={docData.licenseNumber}
                      onChange={(e) =>
                        setDocData({ ...docData, licenseNumber: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {/* License Upload */}
                    <div className="rounded-xl border border-dashed border-[var(--line)] p-4 text-center hover:border-[var(--gold-deep)] transition-colors">
                      <Upload size={20} className="mx-auto text-[var(--muted)] mb-2" />
                      <p className="text-xs font-semibold text-[var(--ink)]">
                        تصویر پروانه کسب
                      </p>
                      {docData.licenseFile ? (
                        <p className="text-[11px] text-emerald-600 font-mono mt-1">
                          ✓ {docData.licenseFile}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUploadFakeDoc("license")}
                          className="mt-2 text-xs font-semibold text-[var(--gold-deep)] underline"
                        >
                          انتخاب و بارگذاری فایل
                        </button>
                      )}
                    </div>

                    {/* National ID Upload */}
                    <div className="rounded-xl border border-dashed border-[var(--line)] p-4 text-center hover:border-[var(--gold-deep)] transition-colors">
                      <Upload size={20} className="mx-auto text-[var(--muted)] mb-2" />
                      <p className="text-xs font-semibold text-[var(--ink)]">
                        تصویر کارت ملی صاحب جواز
                      </p>
                      {docData.nationalCardFile ? (
                        <p className="text-[11px] text-emerald-600 font-mono mt-1">
                          ✓ {docData.nationalCardFile}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUploadFakeDoc("national")}
                          className="mt-2 text-xs font-semibold text-[var(--gold-deep)] underline"
                        >
                          انتخاب و بارگذاری فایل
                        </button>
                      )}
                    </div>

                    {/* Store Frontage Upload */}
                    <div className="rounded-xl border border-dashed border-[var(--line)] p-4 text-center hover:border-[var(--gold-deep)] transition-colors">
                      <Upload size={20} className="mx-auto text-[var(--muted)] mb-2" />
                      <p className="text-xs font-semibold text-[var(--ink)]">
                        تصویر تابلوی فروشگاه
                      </p>
                      {docData.storeFrontFile ? (
                        <p className="text-[11px] text-emerald-600 font-mono mt-1">
                          ✓ {docData.storeFrontFile}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUploadFakeDoc("front")}
                          className="mt-2 text-xs font-semibold text-[var(--gold-deep)] underline"
                        >
                          انتخاب و بارگذاری فایل
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button type="submit" variant="secondary">
                      ارسال مدارک جهت بررسی ادمین
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--line)]">
              <Button variant="secondary" onClick={onClose}>
                بستن پنجره
              </Button>
              <div className="flex gap-2">
                <Link href="/app">
                  <Button>
                    ورود به پنل میز کار و رهگیری سفارش
                    <ChevronLeft size={16} />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
