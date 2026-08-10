"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Boxes,
  ClipboardList,
  FileText,
  Gauge,
  Gem,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  Truck,
  Users,
  Warehouse,
  Menu,
  X,
  UserRound,
  KeyRound,
  Scale,
  Wallet,
  BookOpen,
  ShieldCheck,
  Route,
  CircleHelp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "@/context/session-context";
import { useWorkspace } from "@/context/workspace-context";
import { usePlatform } from "@/context/platform-context";
import { pathPermissionDenied } from "@/data/domains";
import { roles } from "@/data/mock";
import { roleLabels } from "@/data/labels";
import type { RoleId } from "@/data/types";
import { cn } from "@/lib/utils";
import { GoldTicker } from "./gold-ticker";
import { useToast } from "./toast";
import { Button } from "./ui";
import { AppSidebar } from "./AppSidebar";

type NavItem = { href: string; label: string; icon: React.ElementType };

const navByRole: Record<RoleId, NavItem[]> = {
  admin: [
    { href: "/app/admin", label: "نمای کلی", icon: LayoutDashboard },
    { href: "/app/network", label: "شبکه", icon: Users },
    { href: "/app/product", label: "محصول", icon: Gem },
    { href: "/app/inventory", label: "موجودی", icon: Warehouse },
    { href: "/app/commerce", label: "تجارت", icon: ShoppingBag },
    { href: "/app/fulfillment", label: "تحقق سفارش", icon: Truck },
    { href: "/app/finance", label: "مالی", icon: Wallet },
    { href: "/app/service", label: "خدمات", icon: ShieldCheck },
    { href: "/app/governance", label: "حاکمیت", icon: KeyRound },
    { href: "/app/admin/prices", label: "قیمت طلا", icon: Gauge },
    { href: "/app/admin/audit", label: "گزارش فعالیت", icon: FileText },
    { href: "/app/admin/settings", label: "تنظیمات", icon: Settings },
  ],
  qc: [
    { href: "/app/product", label: "محصول", icon: LayoutDashboard },
    { href: "/app/product/catalog", label: "کاتالوگ", icon: Gem },
    { href: "/app/product/collections", label: "کالکشن‌ها", icon: Boxes },
    { href: "/app/product/qc", label: "کنترل کیفیت", icon: Shield },
  ],
  producer: [
    { href: "/app/product", label: "محصول", icon: LayoutDashboard },
    { href: "/app/product/catalog", label: "افزودن محصول", icon: Gem },
    { href: "/app/product/collections", label: "کالکشن‌ها", icon: Boxes },
  ],
  warehouse: [
    { href: "/app/inventory", label: "موجودی", icon: LayoutDashboard },
    { href: "/app/inventory/uids", label: "صدور شناسه", icon: KeyRound },
    { href: "/app/inventory/stock", label: "انبار", icon: Warehouse },
    { href: "/app/inventory/allocation", label: "تخصیص", icon: Package },
    { href: "/app/inventory/custody", label: "حضانت", icon: KeyRound },
    { href: "/app/fulfillment", label: "تحقق سفارش", icon: Route },
    { href: "/app/fulfillment/pick", label: "برداشت", icon: Boxes },
    { href: "/app/fulfillment/pack", label: "بسته‌بندی", icon: Package },
    { href: "/app/fulfillment/handover", label: "تحویل به ایجنت", icon: Truck },
  ],
  pricing: [
    { href: "/app/commerce", label: "تجارت", icon: LayoutDashboard },
    { href: "/app/commerce/pricing", label: "قیمت‌گذاری", icon: Gauge },
    { href: "/app/product/catalog", label: "کاتالوگ", icon: Gem },
  ],
  agent: [
    { href: "/app/commerce", label: "تجارت", icon: ShoppingBag },
    { href: "/app/commerce/proforma", label: "پیش‌فاکتور", icon: ClipboardList },
    { href: "/app/commerce/gallery", label: "گالری سیار", icon: Package },
    { href: "/app/commerce/orders", label: "سفارش‌ها", icon: ClipboardList },
    { href: "/app/network", label: "شبکه", icon: Users },
    { href: "/app/finance/credit", label: "توافق و تسویه اعتماد", icon: Wallet },
    { href: "/app/inventory", label: "موجودی", icon: Warehouse },
    { href: "/app/inventory/custody", label: "حضانت", icon: KeyRound },
    { href: "/app/fulfillment", label: "تحقق سفارش", icon: Truck },
    { href: "/app/fulfillment/delivery", label: "تحویل نهایی", icon: Truck },
    { href: "/app/service", label: "خدمات", icon: ShieldCheck },
    { href: "/app/service/warranty", label: "گارانتی", icon: ShieldCheck },
  ],
  retailer: [
    { href: "/app/commerce", label: "تجارت", icon: ShoppingBag },
    { href: "/app/commerce/orders", label: "سفارش‌ها", icon: ClipboardList },
    { href: "/app/retailer/inventory", label: "موجودی شعبه", icon: Warehouse },
    { href: "/app/retailer/catalog", label: "کاتالوگ", icon: Gem },
    { href: "/app/retailer/credit", label: "اعتبار و تراز", icon: Wallet },
    { href: "/app/service", label: "خدمات", icon: ShieldCheck },
    { href: "/app/service/returns", label: "مرجوعی", icon: Package },
    { href: "/app/service/buyback", label: "بازخرید", icon: Package },
  ],
  finance: [
    { href: "/app/finance", label: "مالی", icon: LayoutDashboard },
    { href: "/app/finance/ledger", label: "دفتر معین دوگانه", icon: BookOpen },
    { href: "/app/finance/credit", label: "اعتبار و مطالبات", icon: Wallet },
    { href: "/app/finance/adjustments", label: "اسناد تعدیل", icon: Scale },
    { href: "/app/finance/settlements", label: "تسویه تولیدکننده", icon: Wallet },
    { href: "/app/inventory/stock", label: "موجودی (خواندن)", icon: Warehouse },
    { href: "/app/network", label: "شبکه", icon: Users },
    { href: "/app/service", label: "خدمات پس از فروش", icon: ShieldCheck },
    { href: "/app/service/returns", label: "مرجوعی", icon: Package },
    { href: "/app/service/buyback", label: "بازخرید", icon: Package },
  ],
  customer: [
    { href: "/app/service", label: "خدمات", icon: ShieldCheck },
    { href: "/app/service/warranty", label: "گارانتی", icon: ShieldCheck },
    { href: "/verify", label: "استعلام اصالت", icon: BadgeCheck },
  ],
};

const headerHint: Record<RoleId, { title: string; subtitle: string }> = {
  admin: { title: "مدیر سیستم", subtitle: "نمای بخش‌های عملیاتی" },
  qc: { title: "کاتالوگ و کنترل کیفیت", subtitle: "محصول، بازرسی و تأیید" },
  warehouse: { title: "انبار و موجودی", subtitle: "شناسه کالا، موجودی و تخصیص" },
  pricing: { title: "قیمت‌گذاری", subtitle: "نرخ و اجرت" },
  agent: { title: "ایجنت فروش", subtitle: "تجارت، گالری و تحویل" },
  retailer: { title: "خرده‌فروش", subtitle: "سفارش، موجودی و اعتبار" },
  finance: { title: "مدیر مالی", subtitle: "دفتر دوگانه و مطالبات" },
  customer: { title: "مشتری نهایی", subtitle: "اصالت و گارانتی" },
  producer: { title: "تولیدکننده", subtitle: "ورود محصول و ارسال به کنترل کیفیت" },
};

function domainHomeForRole(role: RoleId) {
  switch (role) {
    case "warehouse":
      return "/app/inventory";
    case "qc":
    case "producer":
      return "/app/product";
    case "pricing":
    case "agent":
    case "retailer":
      return "/app/commerce";
    case "customer":
      return "/app/service";
    case "finance":
      return "/app/finance";
    case "admin":
      return "/app/admin";
    default:
      return "/app";
  }
}

function homePathForRole(role: RoleId) {
  return domainHomeForRole(role);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, role, availableRoles, setActiveRole, isAdmin, logout } =
    useSession();
  const { hats, activeHat, setActivePartyId } = useWorkspace();
  const { error: platformError, ready: platformReady, apiMode } = usePlatform();
  const [open, setOpen] = useState(false);

  const activeRole = role ?? "retailer";
  const items = navByRole[activeRole].filter(
    (item) => !pathPermissionDenied(activeRole, item.href),
  );
  const roleMeta = roles.find((r) => r.id === activeRole);
  const hint = headerHint[activeRole];

  const onRoleChange = (next: RoleId) => {
    setActiveRole(next);
    setOpen(false);
    router.push(homePathForRole(next));
    toast(`نقش فعال: ${roleLabels[next]}`);
  };

  useEffect(() => {
    try {
      const reason = sessionStorage.getItem("didar.access_denied");
      if (reason) {
        sessionStorage.removeItem("didar.access_denied");
        toast(reason, "warn");
      }
    } catch {
      /* ignore */
    }
  }, [pathname, toast]);

  useEffect(() => {
    if (platformReady && apiMode && platformError) {
      toast(`سامانه داده: ${platformError}`, "warn");
    }
    // one-shot on ready transition
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformReady]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleLogout = () => {
    logout();
    setOpen(false);
    router.replace("/");
  };

  return (
    <div className="min-h-screen bg-[var(--mist)] text-[var(--ink)]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(176,138,87,0.14),transparent_45%),radial-gradient(ellipse_at_bottom_left,rgba(4,30,66,0.08),transparent_42%),linear-gradient(180deg,#F7F3EE_0%,#EFE8DF_100%)]" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-[1500px]">
        <div className="flex min-w-0 flex-1 flex-col lg:order-2">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--surface-glass)] px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[var(--line)] bg-white shadow-sm lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="باز کردن منو"
                aria-expanded={open}
                aria-controls="didar-sidebar"
              >
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-[var(--muted)]">
                  {hint.title}
                </p>
                <p className="truncate text-sm font-medium text-[var(--ink)]">
                  {activeHat
                    ? `${activeHat.partyName} · ${hint.subtitle}`
                    : hint.subtitle}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <GoldTicker className="hidden sm:inline-flex" />
              <Button
                variant="secondary"
                className="hidden sm:inline-flex"
                onClick={handleLogout}
              >
                خروج
              </Button>
            </div>
          </header>

          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="min-w-0 flex-1 overflow-x-clip px-4 py-6 sm:px-6 lg:px-8"
          >
            {children}
          </motion.main>
        </div>

        {open ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-[var(--ink)]/35 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="بستن پوشش منو"
          />
        ) : null}

        <aside
          id="didar-sidebar"
          className={cn(
            "z-50 flex w-[280px] shrink-0 flex-col border-[var(--line)] bg-[var(--surface-glass)] backdrop-blur-xl",
            "fixed inset-y-0 right-0 border-s shadow-[-12px_0_40px_-24px_rgba(4,30,66,0.35)] transition-[transform,opacity] duration-300 ease-out",
            "lg:sticky lg:top-0 lg:order-1 lg:h-svh lg:max-h-svh lg:self-start lg:translate-x-0 lg:border-s lg:opacity-100 lg:shadow-none",
            open
              ? "translate-x-0 opacity-100"
              : "pointer-events-none translate-x-full opacity-0 lg:pointer-events-auto lg:translate-x-0 lg:opacity-100",
          )}
        >
          <div className="flex h-full min-h-0 flex-col px-4 py-5">
            <div className="mb-6 flex shrink-0 items-center justify-between px-2">
              <Link
                href="/"
                className="group flex items-center gap-3"
                onClick={() => setOpen(false)}
              >
                <Image
                  src="/icons/icon-192.png"
                  alt="لوگوی دیدار گلد"
                  width={44}
                  height={44}
                  className="rounded-xl bg-[var(--mist)] object-contain ring-1 ring-[var(--line)]"
                />
                <div>
                  <p className="font-[family-name:var(--font-display)] text-2xl leading-none tracking-tight">
                    دیدار گلد
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-[var(--muted)]">
                    {isAdmin ? "پنل مدیریت" : "میز کار"}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--mist)] lg:hidden"
                onClick={() => setOpen(false)}
                aria-label="بستن منو"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 shrink-0 rounded-2xl border border-white/10 bg-[var(--ink)] px-4 py-3 text-[var(--mist)]">
              <p className="text-[10px] text-white/75">حساب فعال</p>
              <p className="mt-1 font-semibold text-white">{user?.name}</p>
              <p className="text-xs font-medium text-[var(--gold-bright)]">
                {roleMeta?.title ?? (role ? roleLabels[role] : "")}
              </p>
              {availableRoles.length > 1 ? (
                <label className="mt-3 block">
                  <span className="mb-1 block text-[10px] text-white/70">
                    نقش فعال (کلاه کاری)
                  </span>
                  <select
                    className="min-h-11 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white"
                    value={activeRole}
                    onChange={(e) => onRoleChange(e.target.value as RoleId)}
                    aria-label="انتخاب نقش فعال"
                  >
                    {availableRoles.map((r) => (
                      <option key={r} value={r} className="text-[var(--ink)]">
                        {roleLabels[r]}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              {hats.length > 1 ? (
                <label className="mt-3 block">
                  <span className="mb-1 block text-[10px] text-white/70">
                    محل کار فعال
                  </span>
                  <select
                    className="min-h-11 w-full rounded-xl border border-white/15 bg-white/10 px-3 text-sm text-white"
                    value={activeHat?.partyId ?? ""}
                    onChange={(e) => setActivePartyId(e.target.value)}
                    aria-label="انتخاب محل کار"
                  >
                    {hats.map((h) => (
                      <option key={h.partyId} value={h.partyId} className="text-[var(--ink)]">
                        {h.partyName}
                        {h.kindLabel ? ` · ${h.kindLabel}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="mt-1 text-[11px] text-white/80">
                  {activeHat?.partyName ?? user?.org}
                </p>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <AppSidebar onItemClick={() => setOpen(false)} />
            </div>

            <div className="mt-4 shrink-0 space-y-1 border-t border-[var(--line)] pt-4">
              <Link
                href="/app/help"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname.startsWith("/app/help")
                    ? "bg-[var(--ink)] text-white shadow-sm"
                    : "text-[var(--ink)]/75 hover:bg-[var(--ink)]/5 hover:text-[var(--ink)]",
                )}
              >
                <CircleHelp size={16} aria-hidden />
                راهنمای سامانه
              </Link>
              <Link
                href="/enter"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--ink)]/5 hover:text-[var(--ink)]"
              >
                <UserRound size={16} aria-hidden />
                تعویض حساب
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--ink)]/5 hover:text-[var(--ink)]"
              >
                <LogOut size={16} aria-hidden />
                خروج از حساب
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
