"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "@/context/session-context";
import { roleHasPermission } from "@/data/domains";
import type { RoleId } from "@/data/types";
import {
  User,
  ShoppingBag,
  Briefcase,
  Users,
  CreditCard,
  RefreshCw,
  ShieldCheck,
  Package,
  Boxes,
  FileText,
  BarChart3,
  Key,
  Shield,
  NotebookPen,
  Truck,
  CheckCircle2,
  HelpCircle,
  LogOut,
  Sparkles,
  ChevronLeft,
} from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  permission?: string;
  badge?: string | number;
}

interface RoleSidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

export function RoleSidebar({ activeTab, onSelectTab }: RoleSidebarProps) {
  const { user, role, logout } = useSession();
  const activeRole: RoleId = role || "admin";

  // Build role-specific menu items
  const getNavItems = (): NavItem[] => {
    switch (activeRole) {
      case "retailer":
        return [
          { id: "orders", label: "سفارش‌های من", href: "#orders", icon: ShoppingBag, badge: "۳" },
          { id: "wishlist", label: "علاقه‌مندی‌ها و ویترین", href: "/app/commerce/catalog", icon: Sparkles },
          { id: "warranty", label: "گارانتی و شناسنامه", href: "/app/service/warranty", icon: ShieldCheck },
          { id: "buyback", label: "درخواست‌های بازخرید", href: "/app/service/buyback", icon: RefreshCw, badge: "۱" },
          { id: "credit", label: "موجودی و اعتبار من", href: "/app/finance/credit", icon: CreditCard },
          { id: "customers", label: "لیست خریداران نهایی", href: "/app/relationship/customers", icon: Users },
          { id: "profile", label: "حساب کاربری و اطلاعات گالری", href: "/app/governance/profile", icon: User },
        ];

      case "agent":
        return [
          { id: "orders", label: "سفارش‌های ثبت‌شده (Act-as)", href: "#orders", icon: FileText, badge: "۵" },
          { id: "bag", label: "سبد سیار من", href: "/app/inventory/allocations", icon: Briefcase, badge: "۳ کالا" },
          { id: "visits", label: "ویزیت‌ها و یادداشت‌ها", href: "/app/relationship/notes", icon: NotebookPen },
          { id: "receivables", label: "وصولی‌ها و مطالبات", href: "/app/finance/receivables", icon: CreditCard },
          { id: "deliveries", label: "ماموریت‌های تحویل و OTP", href: "/app/fulfillment/deliveries", icon: Truck },
          { id: "profile", label: "حساب کاربری ایجنت", href: "/app/governance/profile", icon: User },
        ];

      case "warehouse":
        return [
          { id: "orders", label: "صف پکینگ و سفارش‌ها", href: "#orders", icon: Package, badge: "۴" },
          { id: "uids", label: "صدور UID و پلمب DDR", href: "/app/inventory/uids", icon: Key },
          { id: "vault", label: "انبار مرکزی و گاوصندوق", href: "/app/inventory/vault", icon: Boxes },
          { id: "handover", label: "تحویل سبد به ایجنت", href: "/app/fulfillment/handover", icon: Truck },
          { id: "discrepancies", label: "مغایرت‌های وزنی انبار", href: "/app/inventory/discrepancies", icon: HelpCircle },
          { id: "profile", label: "حساب کاربری انباردار", href: "/app/governance/profile", icon: User },
        ];

      case "finance":
        return [
          { id: "orders", label: "سفارش‌ها و تسویه‌ها", href: "#orders", icon: ShoppingBag, badge: "۶" },
          { id: "ledger", label: "دفتر کل دوگانه (طلا/ریال)", href: "/app/finance/ledger", icon: FileText },
          { id: "credit", label: "مدیریت اعتبار گالری‌ها", href: "/app/finance/credit", icon: CreditCard },
          { id: "receivables", label: "تجزیه سنی مطالبات", href: "/app/finance/receivables", icon: BarChart3 },
          { id: "settlements", label: "تسویه زرین و نقدی", href: "/app/finance/settlements", icon: CheckCircle2 },
          { id: "profile", label: "حساب کاربری مالی", href: "/app/governance/profile", icon: User },
        ];

      case "qc":
        return [
          { id: "orders", label: "صف بازرسی کیفی QC", href: "#orders", icon: CheckCircle2, badge: "۳" },
          { id: "skus", label: "تعریف مشخصات SKU", href: "/app/product/skus", icon: Package },
          { id: "vault", label: "تحویل به خزانه", href: "/app/inventory/vault", icon: Boxes },
          { id: "profile", label: "حساب کاربری بازرس", href: "/app/governance/profile", icon: User },
        ];

      case "admin":
      default:
        return [
          { id: "orders", label: "سفارش‌ها و فعالیت‌های اخیر", href: "#orders", icon: ShoppingBag, badge: "۱۲" },
          { id: "users", label: "کاربران و دسترسی‌ها", href: "/app/governance/users", icon: Users },
          { id: "reports", label: "گزارش‌ها و هوش تجاری", href: "/app/intelligence/sales", icon: BarChart3 },
          { id: "vault", label: "موجودی و اعتبار سیستم", href: "/app/inventory/vault", icon: Boxes },
          { id: "buybacks", label: "تأیید درخواست‌های بازخرید", href: "/app/service/buyback", icon: RefreshCw, badge: "۱" },
          { id: "shortcuts", label: "مدیریت میانبرها", href: "/app/governance/shortcuts", icon: Sparkles },
          { id: "profile", label: "حساب کاربری و پروفایل", href: "/app/governance/profile", icon: User },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-full lg:w-72 shrink-0 space-y-4">
      {/* User Profile Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--line)] shadow-sm flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-amber-500/20 shrink-0">
          {user?.name ? user.name.slice(0, 1) : "د"}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-sm text-[var(--ink)] truncate">{user?.name || "کاربر دیدار"}</h3>
          <p className="text-xs text-[var(--muted)] truncate font-mono mt-0.5" dir="ltr">
            {user?.email || `${user?.username || "user"}@didargold.com`}
          </p>
          <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
            {role || "کاربر"}
          </span>
        </div>
      </div>

      {/* Vertical Navigation Menu (Alibaba-style Sticky List) */}
      <div className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-[var(--line)] shadow-sm space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.href.startsWith("#")) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-[var(--ink)]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? "bg-amber-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-[var(--ink)] transition-all group"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                <span>{item.label}</span>
              </div>
              <ChevronLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 group-hover:-translate-x-0.5 transition-all" />
            </Link>
          );
        })}

        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>خروج از حساب کاربری</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
