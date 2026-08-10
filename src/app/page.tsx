"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Gem, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import { GoldTicker } from "@/components/gold-ticker";
import { VaultVisual } from "@/components/vault-visual";
import { Button } from "@/components/ui";
import { roles } from "@/data/mock";
import { catalogProducts } from "@/data/catalog";
import { brand } from "@/data/brand";
import { roleLabels } from "@/data/labels";
import { useSession } from "@/context/session-context";
import { formatNumber } from "@/lib/utils";

export default function HomePage() {
  const { isAuthenticated, user, role, isAdmin, homePath, logout } =
    useSession();

  return (
    <div className="min-h-screen bg-[var(--mist)] text-[var(--ink)]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,162,39,0.16),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(26,58,58,0.12),transparent_40%),linear-gradient(180deg,#F7F9FB_0%,#E8EEF2_100%)]" />
      </div>

      <header className="sticky top-0 z-30 border-b border-[var(--line)]/70 bg-[var(--surface-glass)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-3 sm:px-8 sm:py-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <Image
              src="/icons/icon-192.png"
              alt="لوگوی دیدار گلد"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-xl bg-[var(--mist)] object-contain ring-1 ring-[var(--line)]"
              priority
            />
            <p className="truncate font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] sm:text-3xl">
              دیدار گلد
            </p>
          </Link>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Link
              href="/catalog"
              className="inline-flex min-h-11 items-center px-2 text-sm font-semibold text-[var(--ink)] hover:text-[var(--gold-deep)]"
            >
              کاتالوگ
            </Link>
            <Link
              href="/verify"
              className="hidden min-h-11 items-center px-2 text-sm font-semibold text-[var(--ink)] hover:text-[var(--gold-deep)] sm:inline-flex"
            >
              استعلام اصالت
            </Link>
            <GoldTicker className="hidden lg:inline-flex" />
            {isAuthenticated && user ? (
              <>
                <div className="hidden text-left md:block">
                  <p className="text-xs text-[var(--muted)]">وارد شده</p>
                  <p className="text-sm font-semibold">
                    {user.name}
                    {role ? ` · ${roleLabels[role]}` : ""}
                  </p>
                </div>
                <Link href={homePath}>
                  <Button className="min-h-11 px-3 sm:px-4">
                    {isAdmin ? "پنل" : "میز کار"}
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  className="min-h-11 px-3"
                  onClick={() => logout()}
                  aria-label="خروج"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">خروج</span>
                </Button>
              </>
            ) : (
              <Link href="/enter">
                <Button className="min-h-11 px-4">ورود</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative">
          <VaultVisual />
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto w-full max-w-7xl px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-24 sm:px-8 sm:pb-14">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="max-w-2xl"
              >
                <p className="mb-3 text-[12px] font-semibold tracking-wide text-white/90">
                  {brand.tagline}
                </p>
                <h1 className="font-[family-name:var(--font-display)] text-[2.75rem] leading-[1.12] text-white drop-shadow-sm sm:text-6xl md:text-7xl">
                  دیدار گلد
                </h1>
                <p className="mt-4 max-w-lg text-[16px] leading-8 text-white/92 sm:text-lg">
                  {isAuthenticated
                    ? "خوش آمدید. برای ادامه، وارد میز کار خود شوید."
                    : brand.description}
                </p>
                <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                  {isAuthenticated ? (
                    <>
                      <Link href={homePath} className="w-full sm:w-auto">
                        <Button variant="onDark" className="w-full sm:w-auto">
                          {isAdmin ? "ورود به پنل مدیریت" : "ورود به میز کار"}
                          <ArrowLeft size={16} />
                        </Button>
                      </Link>
                      <Link href="/enter" className="w-full sm:w-auto">
                        <Button variant="onDarkGhost" className="w-full sm:w-auto">
                          تعویض حساب
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/enter" className="w-full sm:w-auto">
                        <Button variant="onDark" className="w-full sm:w-auto">
                          ورود به سامانه
                          <ArrowLeft size={16} />
                        </Button>
                      </Link>
                      <a
                        href={brand.url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-auto"
                      >
                        <Button variant="onDarkGhost" className="w-full sm:w-auto">
                          وب‌سایت برند
                        </Button>
                      </a>
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-[11px] font-semibold text-[var(--muted)]">
              چرا دیدار
            </p>
            <h2 className="mt-2 max-w-2xl font-[family-name:var(--font-display)] text-3xl leading-relaxed tracking-tight sm:text-4xl">
              اصالت، طراحی اختصاصی و تجربه‌ای مطمئن از انتخاب طلا و جواهر
            </h2>
          </motion.div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Gem,
                title: "اصالت و شناسنامه",
                text: "هر قطعه با مشخصات مشخص ثبت می‌شود تا اصالت و پیگیری آن ساده بماند.",
              },
              {
                icon: Sparkles,
                title: "طراحی اختصاصی",
                text: "کالکشن‌های امضا، میراث و مراسم — برای حضور روزمره تا لحظه‌های خاص.",
              },
              {
                icon: ShieldCheck,
                title: "اعتماد در زنجیره",
                text: "از تولید تا گالری، مسیر کالا شفاف است و تحویل با تأیید انجام می‌شود.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="rounded-2xl border border-[var(--line)] bg-white/60 p-6 backdrop-blur-xl"
              >
                <item.icon className="text-[var(--gold-deep)]" size={22} />
                <h3 className="mt-4 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="border-y border-[var(--line)] bg-white/40 py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
              فضای همکاری
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-[var(--muted)]">
              هشت نقش عملیاتی — از کاتالوگ و QC تا مالی و استعلام اصالت.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {roles.map((item, i) => {
                const isMine = isAuthenticated && role === item.id;
                const href = isMine
                  ? item.href
                  : `/enter?next=${encodeURIComponent(item.href)}`;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <Link
                      href={href}
                      className="group block h-full rounded-2xl border border-[var(--line)] bg-[var(--mist)] p-5 transition-all hover:-translate-y-1 hover:border-[var(--gold)]/40"
                    >
                      <div
                        className="mb-4 h-1.5 w-10 rounded-full"
                        style={{ background: item.accent }}
                      />
                      <p className="text-[11px] font-semibold text-[var(--muted)]">
                        {item.subtitle}
                      </p>
                      <h3 className="mt-1 font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {item.description}
                      </p>
                      <p className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--gold-deep)]">
                        {isMine ? "باز کردن میز کار" : "ورود"}
                        <ArrowLeft
                          size={14}
                          className="transition-transform group-hover:-translate-x-1"
                        />
                      </p>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[12px] font-semibold text-[var(--muted)]">
                ویترین برند · ۱۸ عیار
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-[1.75rem] tracking-tight sm:text-3xl">
                قطعات دیدار
              </h2>
            </div>
            <Link
              href="/catalog"
              className="inline-flex min-h-11 items-center text-[15px] font-semibold text-[var(--gold-deep)]"
            >
              مشاهده کاتالوگ کامل
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
            {catalogProducts.map((product, i) => (
              <motion.div
                key={product.slug}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="group block overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-white shadow-[0_10px_30px_-22px_rgba(4,30,66,0.45)] transition-all active:scale-[0.99] hover:-translate-y-1 hover:border-[var(--gold)]/45"
                >
                  <div className="relative aspect-square bg-[#F3F1EC]">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </div>
                  <div className="space-y-1 p-3.5 sm:p-4">
                    <p className="truncate text-[15px] font-semibold text-[var(--ink)] sm:text-base">
                      {product.name}
                    </p>
                    <p className="truncate text-[13px] leading-5 text-[var(--muted)]">
                      {formatNumber(product.karat)} عیار · {product.collection}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="border-y border-[var(--line)] bg-white/50 py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
              کالکشن‌ها
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {brand.collections.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={`/catalog?collection=${c.id}`}
                    className="block overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--mist)] transition-all hover:-translate-y-1 hover:border-[var(--gold)]/40"
                  >
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={c.image}
                        alt={c.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold">{c.name}</h3>
                      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                        {c.description}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
            خدمات
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            {brand.services.map((s) => (
              <span
                key={s}
                className="rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-sm"
              >
                {s}
              </span>
            ))}
          </div>
        </section>

        <footer className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-10 text-sm text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-2">
            <Image
              src="/icons/icon-192.png"
              alt=""
              width={28}
              height={28}
              className="rounded-lg object-contain"
            />
            <p className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
              {brand.nameFa}
            </p>
          </div>
          <p>
            © {new Date().getFullYear()} {brand.nameFa}
            {" · "}
            <a href={brand.url} className="hover:text-[var(--ink)]">
              didargold.com
            </a>
            {" · "}
            {brand.phoneDisplay}
          </p>
        </footer>
      </main>
    </div>
  );
}
