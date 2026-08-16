"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  ExternalLink,
  Gem,
  QrCode,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { catalogProducts } from "@/data/catalog";
import { formatNumber, formatWeight } from "@/lib/utils";
import { Button, Input } from "@/components/ui";

export function AuthenticitySection() {
  const [searchUid, setSearchUid] = useState("");
  const [queriedProduct, setQueriedProduct] = useState<
    (typeof catalogProducts)[number] | null
  >(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchUid.trim().toUpperCase();
    if (!query) return;

    const found = catalogProducts.find(
      (p) =>
        p.uidCode.toUpperCase() === query ||
        p.slug.toUpperCase().includes(query) ||
        p.name.includes(query),
    );

    setQueriedProduct(found ?? null);
    setHasSearched(true);
  };

  const setSampleUid = (uid: string) => {
    setSearchUid(uid);
    const found = catalogProducts.find((p) => p.uidCode === uid);
    setQueriedProduct(found ?? null);
    setHasSearched(true);
  };

  return (
    <section
      id="authenticity"
      className="border-y border-[var(--line)] bg-[radial-gradient(ellipse_at_top,rgba(201,162,39,0.08),transparent_50%),linear-gradient(180deg,#FFFFFF_0%,#F8FAF8_100%)] py-20"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/30 bg-[var(--gold)]/10 px-4 py-1.5 text-xs font-semibold text-[var(--gold-deep)]">
            <ShieldCheck size={16} />
            <span>سامانه اصالت و تضمین کیفیت دیدار گلد</span>
          </div>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl sm:text-4xl text-[var(--ink)] tracking-tight">
            اصالت قطعات، شناسنامه دیجیتال و گارانتی طلایی دیدار
          </h2>
          <p className="mt-3 text-sm sm:text-base leading-8 text-[var(--muted)]">
            تمامی محصولات دیدار گلد با کد رهگیری اختصاصی UID، شناسنامه هولوگرام‌دار، تضمین عیار ۱۸
            استاندارد (۷۵۰) و گارانتی رسمی بازخرید به خرده‌فروشان و مشتریان ارائه می‌شود.
          </p>
        </div>

        {/* 4 Guarantee Pillars */}
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-[var(--line)] bg-white/80 p-6 shadow-sm backdrop-blur-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-[var(--gold-deep)]">
              <QrCode size={24} />
            </div>
            <h3 className="mt-4 font-bold text-base text-[var(--ink)]">
              شناسنامه دیجیتال یکتا (UID)
            </h3>
            <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
              ثبت مشخصات فنی دقیق، وزن خالص، تاریخ ری‌گری و بارکد امنیتی جهت ردگیری کامل در زنجیره تامین.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="rounded-2xl border border-[var(--line)] bg-white/80 p-6 shadow-sm backdrop-blur-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-[var(--gold-deep)]">
              <Gem size={24} />
            </div>
            <h3 className="mt-4 font-bold text-base text-[var(--ink)]">
              تضمین عیار ۷۵۰ (۱۸K)
            </h3>
            <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
              آزمون دقیق در آزمایشگاه‌های معتبر عیارسنجی کشور و انگ استاندارد سازمانی دیدار بدون تلرانس منفی.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="rounded-2xl border border-[var(--line)] bg-white/80 p-6 shadow-sm backdrop-blur-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-[var(--gold-deep)]">
              <RotateCcw size={24} />
            </div>
            <h3 className="mt-4 font-bold text-base text-[var(--ink)]">
              تضمین بازخرید و تعویض
            </h3>
            <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
              ضمانت بازخرید رسمی بر اساس نرخ روز اتحادیه طلا و جواهر در کلیه نمایندگی‌ها و شعب همکار.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="rounded-2xl border border-[var(--line)] bg-white/80 p-6 shadow-sm backdrop-blur-xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-[var(--gold-deep)]">
              <Wrench size={24} />
            </div>
            <h3 className="mt-4 font-bold text-base text-[var(--ink)]">
              گارانتی ۲۴ ماهه خدمات
            </h3>
            <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
              پولیش، شست‌وشوی التراسونیک، تنظیم سایز و ترمیم قفل و اتصالات به صورت کاملاً رایگان.
            </p>
          </motion.div>
        </div>

        {/* Interactive UID Verification Widget */}
        <div className="mt-12 rounded-3xl border border-[var(--line)] bg-gradient-to-br from-white via-[var(--mist)] to-white p-6 sm:p-10 shadow-lg">
          <div className="grid gap-8 lg:grid-cols-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--gold-deep)]">
                <Sparkles size={16} />
                <span>استعلام آنلاین اصالت قطعه</span>
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-2xl sm:text-3xl text-[var(--ink)]">
                کد شناسنامه (UID) محصول خود را وارد کنید
              </h3>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-7">
                کد شناسنامه روی فاکتور رسمی، پلاک هولوگرام یا تگ امنیتی قطعه طلا درج شده است. با وارد
                کردن آن مشخصات کامل و سابقه اصالت نمایش داده می‌شود.
              </p>

              <form onSubmit={handleVerify} className="flex gap-2 max-w-md">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute right-3 top-3.5 text-[var(--muted)]"
                  />
                  <Input
                    placeholder="مثال: DDR-18K-ATR01"
                    value={searchUid}
                    onChange={(e) => setSearchUid(e.target.value)}
                    className="pr-9 font-mono uppercase text-left tracking-wider text-xs sm:text-sm"
                  />
                </div>
                <Button type="submit" className="shrink-0">
                  استعلام اصالت
                </Button>
              </form>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)] pt-1">
                <span>نمونه‌های آزمایشی:</span>
                <button
                  type="button"
                  onClick={() => setSampleUid("DDR-18K-ATR01")}
                  className="rounded-lg bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--gold-deep)] border border-[var(--line)] hover:border-[var(--gold)]"
                >
                  DDR-18K-ATR01
                </button>
                <button
                  type="button"
                  onClick={() => setSampleUid("DDR-18K-VIR02")}
                  className="rounded-lg bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--gold-deep)] border border-[var(--line)] hover:border-[var(--gold)]"
                >
                  DDR-18K-VIR02
                </button>
                <button
                  type="button"
                  onClick={() => setSampleUid("DDR-18K-MHT03")}
                  className="rounded-lg bg-white px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--gold-deep)] border border-[var(--line)] hover:border-[var(--gold)]"
                >
                  DDR-18K-MHT03
                </button>
              </div>
            </div>

            {/* Verification Result Card */}
            <div className="lg:col-span-6">
              {hasSearched ? (
                queriedProduct ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/40 p-6 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <CheckCircle size={20} className="text-emerald-600" />
                        <span className="font-bold text-sm">
                          اصالت قطعه تایید شد · شناسنامه معتبر
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold text-emerald-900 bg-white px-2.5 py-1 rounded-md border border-emerald-200">
                        {queriedProduct.uidCode}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[var(--muted)]">نام قطعه:</span>
                        <p className="font-bold text-[var(--ink)] mt-0.5">
                          {queriedProduct.name}
                        </p>
                      </div>
                      <div>
                        <span className="text-[var(--muted)]">کالکشن:</span>
                        <p className="font-bold text-[var(--ink)] mt-0.5">
                          {queriedProduct.collection}
                        </p>
                      </div>
                      <div>
                        <span className="text-[var(--muted)]">عیار استاندارد:</span>
                        <p className="font-bold text-[var(--ink)] mt-0.5">
                          {formatNumber(queriedProduct.karat)} عیار (۷۵۰)
                        </p>
                      </div>
                      <div>
                        <span className="text-[var(--muted)]">وزن دقیق ثبت‌شده:</span>
                        <p className="font-bold text-[var(--ink)] mt-0.5 tabular-nums">
                          {formatWeight(queriedProduct.weightGrams)}
                        </p>
                      </div>
                      <div>
                        <span className="text-[var(--muted)]">وضعیت گارانتی:</span>
                        <p className="font-bold text-emerald-700 mt-0.5">
                          ۲۴ ماهه فعال (سراسری)
                        </p>
                      </div>
                      <div>
                        <span className="text-[var(--muted)]">هولوگرام امنیتی:</span>
                        <p className="font-bold text-emerald-700 mt-0.5">
                          تایید شده و فعال
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Link href={`/products/${queriedProduct.slug}`}>
                        <Button variant="secondary" className="text-xs">
                          مشاهده مشخصات و ثبت در سبد
                          <ExternalLink size={14} />
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ) : (
                  <div className="rounded-2xl border border-red-200 bg-red-50/60 p-6 text-center space-y-3">
                    <ShieldAlert size={32} className="mx-auto text-red-500" />
                    <p className="font-bold text-sm text-red-800">
                      شناسنامه‌ای با این مشخصات یافت نشد
                    </p>
                    <p className="text-xs text-red-700 leading-6 max-w-sm mx-auto">
                      لطفاً کد UID را مجدداً بررسی فرمایید یا با پشتیبانی اصالت دیدار گلد تماس بگیرید.
                    </p>
                  </div>
                )
              ) : (
                <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-6 text-center space-y-3">
                  <ShieldCheck size={36} className="mx-auto text-[var(--gold-deep)]" />
                  <p className="font-semibold text-sm text-[var(--ink)]">
                    سامانه هوشمند تاییدیه و شناسنامه دیجیتال
                  </p>
                  <p className="text-xs text-[var(--muted)] leading-6 max-w-xs mx-auto">
                    برای استعلام اصالت، شناسه UID روی برچسب کالا را در کادر روبرو وارد کنید.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
