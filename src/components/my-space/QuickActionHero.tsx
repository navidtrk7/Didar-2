"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/context/session-context";
import { useToast } from "@/components/toast";
import type { RoleId } from "@/data/types";
import {
  ShoppingBag,
  Search,
  RefreshCw,
  ShieldCheck,
  QrCode,
  Briefcase,
  Users,
  CreditCard,
  PackageCheck,
  TrendingUp,
  FileText,
  KeyRound,
  ArrowRight,
  Sparkles,
  Zap,
  PhoneCall,
  Lock,
  BadgePercent,
} from "lucide-react";

export function QuickActionHero() {
  const { role } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const activeRole: RoleId = role || "admin";

  // Tab configurations per role
  const getTabsForRole = () => {
    switch (activeRole) {
      case "retailer":
        return [
          { id: "order", label: "ثبت سفارش جدید", icon: ShoppingBag, placeholder: "جستجوی مدل، النگو، دستبند، گردنبند...", actionHref: "/app/commerce/catalog" },
          { id: "uid_check", label: "استعلام اصالت UID", icon: QrCode, placeholder: "ورود کد شناسنامه DDR-18K-...", actionHref: "/app/inventory/vault" },
          { id: "buyback", label: "درخواست بازخرید طلا", icon: RefreshCw, placeholder: "وزن تخمینی یا شناسه قطعه جهت استعلام قیمت روز...", actionHref: "/app/service/buyback" },
          { id: "warranty", label: "فعال‌سازی گارانتی", icon: ShieldCheck, placeholder: "شماره همراه خریدار نهایی جهت صدور کارت...", actionHref: "/app/service/warranty" },
        ];

      case "agent":
        return [
          { id: "act_as", label: "ثبت سفارش Act-as", icon: FileText, placeholder: "نام گالری مقصد یا مدل کالا...", actionHref: "/app/commerce/orders" },
          { id: "bag", label: "سبد سیار من", icon: Briefcase, placeholder: "جستجو در موجودی فیزیکی همراه...", actionHref: "/app/inventory/allocations" },
          { id: "visit", label: "ثبت گزارش ویزیت", icon: Users, placeholder: "نام گالری / راسته بازار...", actionHref: "/app/relationship/notes" },
          { id: "receivables", label: "استعلام وصولی", icon: CreditCard, placeholder: "نام طرف حساب جهت راس‌گیری...", actionHref: "/app/finance/receivables" },
        ];

      case "warehouse":
        return [
          { id: "uid_issue", label: "صدور شناسنامه DDR", icon: KeyRound, placeholder: "شناسه فیزیکی یا کد SKU...", actionHref: "/app/inventory/uids" },
          { id: "picking", label: "صف پکینگ و تحویل", icon: PackageCheck, placeholder: "شماره سفارش جهت آماده‌سازی...", actionHref: "/app/fulfillment/picking" },
          { id: "vault", label: "جستجو در گاوصندوق", icon: QrCode, placeholder: "جستجوی پلمب در انبار مرکزی...", actionHref: "/app/inventory/vault" },
        ];

      case "finance":
        return [
          { id: "exposure", label: "استعلام اعتبار و Exposure", icon: CreditCard, placeholder: "نام گالری یا کد طرف حساب...", actionHref: "/app/finance/credit" },
          { id: "settle", label: "ثبت تسویه حساب زرین", icon: TrendingUp, placeholder: "شناسه فاکتور یا کارگاه...", actionHref: "/app/finance/settlements" },
          { id: "ledger", label: "تراز دفتر کل دوگانه", icon: FileText, placeholder: "جستجوی سند وزنی یا ریالی...", actionHref: "/app/finance/ledger" },
        ];

      case "admin":
      default:
        return [
          { id: "search", label: "جستجوی سراسری کالا و سفارش", icon: Search, placeholder: "جستجوی کد UID، نام مشتری، شماره فاکتور یا SKU...", actionHref: "/app/commerce/catalog" },
          { id: "users", label: "مدیریت کاربران و دسترسی", icon: Users, placeholder: "نام یا نام کاربری پرسنل / ذینفع...", actionHref: "/app/governance/users" },
          { id: "vault", label: "موجودی خزانه مرکزی طلا", icon: QrCode, placeholder: "جستجوی ردیف انبار و پلمب...", actionHref: "/app/inventory/vault" },
          { id: "sales", label: "گزارش فروش و عملکرد", icon: TrendingUp, placeholder: "بازه زمانی یا منطقه فروش...", actionHref: "/app/intelligence/sales" },
        ];
    }
  };

  const tabs = getTabsForRole();
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [query, setQuery] = useState("");

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleAction = () => {
    if (!query.trim()) {
      router.push(activeTab.actionHref);
      return;
    }
    toast(`در حال جستجو و انتقال به بخش مربوطه...`);
    router.push(activeTab.actionHref);
  };

  return (
    <section className="space-y-6">
      {/* 1. Main Search & Action Hero Widget (Alibaba Style) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-200/40 dark:shadow-none p-5 sm:p-7 relative overflow-hidden">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600" />

        {/* Tab Row (Horizontal pills matching Alibaba's Flight/Train/Hotel tabs) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 border-b border-slate-100 dark:border-slate-800 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTabId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[var(--ink)]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search / Action Box below active tab */}
        <div className="mt-5 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 absolute right-4 top-3.5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAction()}
              placeholder={activeTab.placeholder}
              className="w-full min-h-[48px] pr-12 pl-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/60 text-xs sm:text-sm font-semibold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all placeholder:text-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={handleAction}
            className="w-full sm:w-auto min-h-[48px] px-7 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/25 hover:shadow-lg hover:shadow-amber-500/35 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <span>اجرای عملیات</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>
        </div>
      </div>

      {/* 2. Other Services Row (سایر خدمات - Mini Icons Row) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/app/service/warranty"
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-2xs hover:shadow-sm hover:border-amber-500/40 transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-[var(--ink)] group-hover:text-amber-600 transition-colors">
              گارانتی آنلاین
            </h4>
            <span className="text-[10px] text-slate-400">شناسنامه دیجیتال DDR</span>
          </div>
        </Link>

        <Link
          href="/app/service/buyback"
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-2xs hover:shadow-sm hover:border-amber-500/40 transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-[var(--ink)] group-hover:text-amber-600 transition-colors">
              بازخرید هوشمند
            </h4>
            <span className="text-[10px] text-slate-400">تسویه لحظه‌ای به نرخ روز</span>
          </div>
        </Link>

        <Link
          href="/app/inventory/vault"
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-2xs hover:shadow-sm hover:border-amber-500/40 transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-[var(--ink)] group-hover:text-amber-600 transition-colors">
              استعلام اصالت
            </h4>
            <span className="text-[10px] text-slate-400">پلمب امن و عیار ۷۵۰</span>
          </div>
        </Link>

        <Link
          href="/app/governance/profile"
          className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 shadow-2xs hover:shadow-sm hover:border-amber-500/40 transition-all flex items-center gap-3 group"
        >
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-[var(--ink)] group-hover:text-amber-600 transition-colors">
              پشتیبانی VIP
            </h4>
            <span className="text-[10px] text-slate-400">همراهی اختصاصی صنف</span>
          </div>
        </Link>
      </div>

      {/* 3. Promotional Campaign Banner (Alibaba Style Announcement Card) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-amber-500/20">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <BadgePercent className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
              جشنواره فصلی طلا
            </span>
            <h3 className="font-black text-sm sm:text-base mt-1">
              طرح ویژه کسر از اجرت ساخت برای کالکشن جدید «امضای دیدار»
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              تا ۲.۵٪ تخفیف در کارمزد سفارشات عمده بالای ۵۰ گرم برای گالری‌های همکار.
            </p>
          </div>
        </div>

        <Link
          href="/app/commerce/catalog"
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-colors shrink-0 flex items-center gap-1.5"
        >
          <span>مشاهده محصولات</span>
          <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        </Link>
      </div>
    </section>
  );
}
