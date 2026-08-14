"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/context/session-context";
import { usePlatform } from "@/context/platform-context";
import { formatNumber, formatMoney } from "@/lib/utils";
import { resolveGoldRate } from "@/lib/gold-rate";
import { useToast } from "@/components/toast";
import { SectionHeader, Stat, Panel, Badge, Button } from "@/components/ui";
import { ActionModal } from "@/components/action-modal";
import { filterSidebarForRole } from "@/data/sidebarConfig";
import {
  ALL_SHORTCUTS,
  ROLE_DEFAULT_SHORTCUTS,
  ROLE_DAILY_SUMMARIES,
  type ShortcutItem,
} from "@/data/shortcuts";
import type { RoleId } from "@/data/types";
import MySpacePage from "./me/page";
import {
  Users,
  Building2,
  UserCheck,
  UserPlus,
  PackagePlus,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  QrCode,
  Boxes,
  Briefcase,
  AlertTriangle,
  ShoppingBag,
  TrendingUp,
  FileText,
  Tag,
  PackageCheck,
  KeyRound,
  Truck,
  CreditCard,
  Clock,
  BadgeDollarSign,
  BookOpen,
  ShieldCheck,
  RefreshCw,
  History,
  Crown,
  NotebookPen,
  BarChart3,
  LineChart,
  Shield,
  Key,
  Star,
  Plus,
  Trash2,
  Edit3,
  Check,
  RotateCcw,
  ArrowRight,
  Zap,
  Calendar,
  Layers,
  LayoutDashboard,
  User as UserIcon,
} from "lucide-react";

// Icon lookup map
const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  Building2,
  UserCheck,
  UserPlus,
  PackagePlus,
  Sparkles,
  CheckCircle2,
  Image: ImageIcon,
  QrCode,
  Boxes,
  Briefcase,
  AlertTriangle,
  ShoppingBag,
  TrendingUp,
  FileText,
  Tag,
  PackageCheck,
  KeyRound,
  Truck,
  CreditCard,
  Clock,
  BadgeDollarSign,
  BookOpen,
  ShieldCheck,
  RefreshCw,
  History,
  Crown,
  NotebookPen,
  BarChart3,
  LineChart,
  Shield,
  Key,
};

export default function PostLoginHomePage() {
  const { user, role } = useSession();
  const { liveGoldPrice } = usePlatform();
  const { toast } = useToast();

  // Mode switcher: "myspace" (Alibaba style) or "executive" (Pulse & Shortcuts)
  const [viewMode, setViewMode] = useState<"myspace" | "executive">("myspace");

  const activeRole: RoleId = role || "admin";
  const roleSummary = ROLE_DAILY_SUMMARIES[activeRole] || ROLE_DAILY_SUMMARIES.admin;
  const currentRate = resolveGoldRate(liveGoldPrice);
  const allowedDomains = filterSidebarForRole(activeRole);

  // User shortcuts state with localStorage persistence
  const [pinnedShortcutIds, setPinnedShortcutIds] = useState<string[]>([]);
  const [isEditingShortcuts, setIsEditingShortcuts] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Load shortcuts for current role
  useEffect(() => {
    const storageKey = `didar_shortcuts_${activeRole}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setPinnedShortcutIds(JSON.parse(saved));
      } else {
        const defaults = ROLE_DEFAULT_SHORTCUTS[activeRole] || ROLE_DEFAULT_SHORTCUTS.admin;
        setPinnedShortcutIds(defaults);
      }
    } catch {
      const defaults = ROLE_DEFAULT_SHORTCUTS[activeRole] || ROLE_DEFAULT_SHORTCUTS.admin;
      setPinnedShortcutIds(defaults);
    }
  }, [activeRole]);

  const saveShortcuts = (ids: string[]) => {
    setPinnedShortcutIds(ids);
    try {
      localStorage.setItem(`didar_shortcuts_${activeRole}`, JSON.stringify(ids));
    } catch {
      // ignore
    }
  };

  const handleRemoveShortcut = (id: string) => {
    const next = pinnedShortcutIds.filter((sId) => sId !== id);
    saveShortcuts(next);
    toast("میانبر حذف شد");
  };

  const handleAddShortcut = (id: string) => {
    if (pinnedShortcutIds.includes(id)) {
      toast("این میانبر قبلاً اضافه شده است", "warn");
      return;
    }
    const next = [...pinnedShortcutIds, id];
    saveShortcuts(next);
    setAddModalOpen(false);
    toast("میانبر به صفحه اصلی اضافه شد");
  };

  const handleResetShortcuts = () => {
    const defaults = ROLE_DEFAULT_SHORTCUTS[activeRole] || ROLE_DEFAULT_SHORTCUTS.admin;
    saveShortcuts(defaults);
    setIsEditingShortcuts(false);
    toast("میانبرها به حالت پیش‌فرض نقش بازگردانده شدند");
  };

  // Resolve pinned shortcut objects
  const pinnedShortcuts: ShortcutItem[] = pinnedShortcutIds
    .map((id) => ALL_SHORTCUTS.find((s) => s.id === id))
    .filter((s): s is ShortcutItem => Boolean(s));

  // Available shortcuts to add (filtered by role and not already pinned)
  const availableToAdd = ALL_SHORTCUTS.filter(
    (s) =>
      s.allowedRoles.includes(activeRole) &&
      !pinnedShortcutIds.includes(s.id) &&
      (filterCategory === "all" || s.category === filterCategory)
  );

  const categories = Array.from(new Set(ALL_SHORTCUTS.filter((s) => s.allowedRoles.includes(activeRole)).map((s) => s.category)));

  return (
    <div className="space-y-6">
      {/* Top Bar with View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("myspace")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === "myspace"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[var(--ink)]"
            }`}
          >
            <UserIcon className="w-4 h-4" />
            <span>صفحه من (My Space)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("executive")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === "executive"
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[var(--ink)]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>داشبورد کلان و میانبرها</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/app/governance/shortcuts"
            className="text-[var(--muted)] hover:text-amber-600 flex items-center gap-1 font-semibold"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>تنظیمات میانبرها</span>
          </Link>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-[var(--muted)]">
            نرخ طلا: <strong className="font-mono text-amber-600">{formatMoney(currentRate)}</strong> تومان
          </span>
        </div>
      </div>

      {/* Main Render based on selected View Mode */}
      {viewMode === "myspace" ? (
        <MySpacePage />
      ) : (
        <div className="space-y-8">
          {/* Header & Friendly Greeting */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--line)] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[var(--ink)]">
                  سلام {user?.name || "کاربر گرامی"} 👋
                </h1>
                <Badge tone="gold" className="text-xs px-2.5 py-0.5 font-bold">
                  {roleSummary.badge}
                </Badge>
              </div>
              <p className="text-xs text-[var(--muted)] mt-1.5 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>امروز: ۲۴ مرداد ۱۴۰۵ — نرخ زنده هر گرم طلای ۱۸ عیار:</span>
                <span className="font-bold font-mono text-amber-600">{formatMoney(currentRate)} تومان</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/app/governance/shortcuts"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--line)] bg-[var(--mist)] hover:bg-amber-500/10 hover:text-amber-600 transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>مدیریت میانبرها</span>
              </Link>
              <Link
                href="/app/governance/profile"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--line)] bg-[var(--mist)] hover:bg-amber-500/10 hover:text-amber-600 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>پروفایل من</span>
              </Link>
            </div>
          </div>

          {/* Today's Pulse Summary (2 Role-Tailored Cards) */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Panel className="p-5 border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block mb-1">
                    خلاصه وضعیت امروز (۱)
                  </span>
                  <p className="text-sm font-semibold text-[var(--muted)]">{roleSummary.metric1.label}</p>
                  <h3 className="text-2xl font-black text-[var(--ink)] mt-1">{roleSummary.metric1.value}</h3>
                  <p className="text-xs text-[var(--muted)] mt-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    {roleSummary.metric1.hint}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
                  <Zap className="w-6 h-6" />
                </div>
              </div>
            </Panel>

            <Panel className="p-5 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                    خلاصه وضعیت امروز (۲)
                  </span>
                  <p className="text-sm font-semibold text-[var(--muted)]">{roleSummary.metric2.label}</p>
                  <h3 className="text-2xl font-black text-[var(--ink)] mt-1">{roleSummary.metric2.value}</h3>
                  <p className="text-xs text-[var(--muted)] mt-2 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    {roleSummary.metric2.hint}
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </Panel>
          </div>

          {/* ⭐ میانبرهای من (Personalized Shortcuts) */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h2 className="text-lg font-black text-[var(--ink)]">میانبرهای من (Personalized Shortcuts)</h2>
                <span className="text-xs text-[var(--muted)]">({pinnedShortcuts.length} میانبر فعال)</span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  className="text-xs px-3 py-1.5 flex items-center gap-1"
                  onClick={() => setAddModalOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن میانبر</span>
                </Button>

                <Button
                  variant={isEditingShortcuts ? "primary" : "secondary"}
                  className={`text-xs px-3 py-1.5 flex items-center gap-1 ${
                    isEditingShortcuts ? "bg-amber-600 hover:bg-amber-700 text-white" : ""
                  }`}
                  onClick={() => setIsEditingShortcuts(!isEditingShortcuts)}
                >
                  {isEditingShortcuts ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  <span>{isEditingShortcuts ? "اتمام ویرایش" : "ویرایش چیدمان"}</span>
                </Button>

                {isEditingShortcuts && (
                  <Button
                    variant="secondary"
                    className="text-xs px-2 py-1.5 text-rose-600 hover:bg-rose-500/10"
                    onClick={handleResetShortcuts}
                    title="بازنشانی به پیش‌فرض"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Shortcuts Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pinnedShortcuts.map((item) => {
                const Icon = ICON_MAP[item.icon] || Boxes;
                return (
                  <div key={item.id} className="relative group">
                    <Link
                      href={item.href}
                      className={`panel p-4 block rounded-2xl border transition-all duration-200 hover:shadow-lg hover:border-amber-500/50 ${
                        isEditingShortcuts ? "pointer-events-none opacity-90 border-dashed border-amber-500/60" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <Badge tone="neutral" className="text-[10px]">
                          {item.category}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-sm text-[var(--ink)] mb-1 group-hover:text-amber-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[var(--muted)] line-clamp-2">{item.description}</p>
                    </Link>

                    {isEditingShortcuts && (
                      <button
                        type="button"
                        onClick={() => handleRemoveShortcut(item.id)}
                        className="absolute -top-2 -left-2 p-1.5 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-transform hover:scale-110 z-10"
                        title="حذف این میانبر"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Add New Shortcut Card */}
              <button
                type="button"
                onClick={() => setAddModalOpen(true)}
                className="p-4 rounded-2xl border-2 border-dashed border-[var(--line)] hover:border-amber-500/60 hover:bg-amber-500/5 transition-all flex flex-col items-center justify-center text-center group min-h-[130px]"
              >
                <div className="p-2.5 rounded-xl bg-[var(--mist)] text-[var(--muted)] group-hover:bg-amber-500 group-hover:text-white transition-colors mb-2">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="font-bold text-xs text-[var(--ink)] group-hover:text-amber-600">افزودن میانبر جدید</span>
                <span className="text-[10px] text-[var(--muted)] mt-0.5">از بین قابلیت‌های ۱۰ دامنه</span>
              </button>
            </div>
          </div>

          {/* 🌐 دامنه‌های اصلی سیستم (Quick Domain Grid) */}
          <div className="space-y-4 pt-4 border-t border-[var(--line)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-black text-[var(--ink)]">
                  دامنه‌های کسب‌وکار در دسترس ({allowedDomains.length} دامنه)
                </h2>
              </div>
              <span className="text-xs text-[var(--muted)]">زنجیره کامل ارزش پلتفرم طلا</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {allowedDomains.map((domain) => {
                const Icon = ICON_MAP[domain.iconName] || Boxes;
                return (
                  <Panel key={domain.id} className="p-4 flex flex-col justify-between hover:border-amber-500/40 transition-colors group">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="p-2 rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                          <Icon className="w-5 h-5" />
                        </span>
                        <Badge tone="neutral" className="text-[10px]">
                          {domain.subItems.length} زیرشاخه
                        </Badge>
                      </div>
                      <h3 className="font-bold text-sm text-[var(--ink)] mb-1">{domain.label}</h3>
                      <ul className="text-xs text-[var(--muted)] space-y-1 mb-4">
                        {domain.subItems.slice(0, 3).map((sub) => (
                          <li key={sub.id} className="truncate">• {sub.label}</li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      href={domain.href}
                      className="flex items-center justify-between text-xs font-semibold text-amber-600 hover:text-amber-700 pt-2 border-t border-[var(--line)]"
                    >
                      <span>ورود به دامنه</span>
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    </Link>
                  </Panel>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal for Adding New Shortcuts */}
      <ActionModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="افزودن میانبر به صفحه شخصی (Add Shortcut)"
        description="یکی از قابلیت‌های دامنه‌های ۱۰‌گانه مجاز برای نقش خود را انتخاب کنید."
        cancelLabel="انصراف"
      >
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 pb-2 border-b border-[var(--line)]">
            <button
              type="button"
              onClick={() => setFilterCategory("all")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                filterCategory === "all"
                  ? "bg-amber-500 text-white"
                  : "bg-[var(--mist)] text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              همه دسته‌ها ({availableToAdd.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  filterCategory === cat
                    ? "bg-amber-500 text-white"
                    : "bg-[var(--mist)] text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* List of Available Shortcuts */}
          <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
            {availableToAdd.length === 0 ? (
              <p className="text-center text-xs text-[var(--muted)] py-6">
                تمام میانبرهای این بخش در حال حاضر در صفحه اصلی شما پین شده‌اند.
              </p>
            ) : (
              availableToAdd.map((s) => {
                const Icon = ICON_MAP[s.icon] || Boxes;
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-[var(--line)] hover:bg-amber-500/5 hover:border-amber-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-[var(--ink)]">{s.title}</h4>
                          <Badge tone="neutral" className="text-[9px]">
                            {s.category}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-[var(--muted)] mt-0.5">{s.description}</p>
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      className="text-xs px-2.5 py-1 bg-amber-500/10 text-amber-700 hover:bg-amber-500 hover:text-white"
                      onClick={() => handleAddShortcut(s.id)}
                    >
                      <Plus className="w-3.5 h-3.5 inline ml-1" />
                      پین کردن
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </ActionModal>
    </div>
  );
}
