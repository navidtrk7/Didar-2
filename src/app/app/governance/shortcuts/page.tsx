"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/toast";
import { SectionHeader, Panel, Button, Field, Badge, Stat } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ActionModal } from "@/components/action-modal";
import {
  ALL_SHORTCUTS,
  ROLE_DEFAULT_SHORTCUTS,
  type ShortcutItem,
} from "@/data/shortcuts";
import type { RoleId } from "@/data/types";
import {
  Zap,
  Plus,
  Trash2,
  Edit3,
  Shield,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ExternalLink,
} from "lucide-react";

export default function ShortcutManagementPage() {
  const { toast } = useToast();

  const [shortcuts, setShortcuts] = useState<ShortcutItem[]>(ALL_SHORTCUTS);
  const [selectedRole, setSelectedRole] = useState<RoleId>("admin");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form states for creating a new shortcut
  const [newTitle, setNewTitle] = useState("");
  const [newHref, setNewHref] = useState("/app/");
  const [newCategory, setNewCategory] = useState("شبکه");
  const [newDescription, setNewDescription] = useState("");
  const [newDomainId, setNewDomainId] = useState("network");

  const handleCreateShortcut = () => {
    if (!newTitle.trim() || !newHref.trim()) {
      toast("عنوان و مسیر مقصد میانبر را وارد کنید", "warn");
      return;
    }

    const newItem: ShortcutItem = {
      id: `sc-${Date.now()}`,
      title: newTitle.trim(),
      href: newHref.trim(),
      icon: "Zap",
      domainId: newDomainId,
      category: newCategory,
      description: newDescription.trim() || "میانبر سفارشی تعریف‌شده توسط مدیر",
      allowedRoles: ["admin", selectedRole],
    };

    setShortcuts((prev) => [newItem, ...prev]);
    setCreateModalOpen(false);
    setNewTitle("");
    setNewHref("/app/");
    setNewDescription("");
    toast("میانبر جدید با موفقیت در سامانه ثبت گردید");
  };

  const defaultShortcutsForSelectedRole = (ROLE_DEFAULT_SHORTCUTS[selectedRole] || []).map((id) =>
    shortcuts.find((s) => s.id === id)
  ).filter((s): s is ShortcutItem => Boolean(s));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <h1 className="text-xl font-black text-[var(--ink)] flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            <span>مدیریت سراسری میانبرها (Shortcut Management)</span>
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            تعریف، پیکربندی پیش‌فرض نقش‌ها و گزارش استفاده از شورت‌کات‌های صفحه اصلی کاربران.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/app"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--line)] bg-[var(--mist)] hover:bg-amber-500/10 hover:text-amber-600 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>مشاهده صفحه اصلی (Personal Home)</span>
          </Link>
          <Button
            onClick={() => setCreateModalOpen(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-2 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>تعریف میانبر جدید</span>
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="کل میانبرهای تعریف‌شده" value={`${shortcuts.length} میانبر`} hint="پوشش ۱۰ دامنه کسب‌وکار" />
        <Stat label="نقش‌های دارای چیدمان پیش‌فرض" value="۹ نقش کاربری" hint="ادمین، ایجنت، خرده‌فروش و..." />
        <Stat label="پراستفاده‌ترین میانبر ماه" value="ثبت سفارش Act-as" hint="۶۵ بار استفاده در ماه" />
        <Stat label="وضعیت سرویس میانبرها" value="فعال و برخط" hint="پایش مداوم دسترسی‌ها" />
      </div>

      {/* Role Preset Configurator */}
      <Panel className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-[var(--line)]">
          <div>
            <h3 className="font-bold text-sm text-[var(--ink)] flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              <span>پیکربندی میانبرهای پیش‌فرض هر نقش (Role Defaults)</span>
            </h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              کاربران تازه ثبت‌نام‌شده با این نقش، این میانبرها را به عنوان پیش‌فرض در صفحه اصلی خود خواهند دید.
            </p>
          </div>

          <select
            className="field min-h-9 text-xs font-semibold max-w-xs"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as RoleId)}
          >
            <option value="admin">نقش: مدیر ارشد (Admin)</option>
            <option value="agent">نقش: ایجنت میدانی (Agent)</option>
            <option value="retailer">نقش: خرده‌فروش / گالری (Retailer)</option>
            <option value="warehouse">نقش: انباردار و خزانه (Warehouse)</option>
            <option value="finance">نقش: مدیر مالی (Finance)</option>
            <option value="qc">نقش: بازرس QC (Quality Control)</option>
            <option value="pricing">نقش: کارشناس قیمت‌گذاری (Pricing)</option>
            <option value="producer">نقش: تولیدکننده / کارگاه (Producer)</option>
            <option value="customer">نقش: مشتری نهایی (Customer)</option>
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {defaultShortcutsForSelectedRole.map((sc) => (
            <div key={sc.id} className="p-3 rounded-xl border border-[var(--line)] bg-[var(--mist)] flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs text-[var(--ink)]">{sc.title}</h4>
                <span className="font-mono text-[10px] text-[var(--muted)]" dir="ltr">{sc.href}</span>
              </div>
              <Badge tone="gold" className="text-[10px]">پیش‌فرض</Badge>
            </div>
          ))}
        </div>
      </Panel>

      {/* All Available Shortcuts Table */}
      <Panel className="p-5 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-[var(--line)]">
          <h3 className="font-bold text-sm text-[var(--ink)] flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-500" />
            <span>فهرست جامع تمام میانبرهای مجاز در ۱۰ دامنه</span>
          </h3>
          <span className="text-xs text-[var(--muted)]">مجموعاً {shortcuts.length} میانبر تعریف‌شده</span>
        </div>

        <DataTable
          headers={["عنوان میانبر", "دسته / دامنه", "مسیر مقصد (Route)", "نقش‌های مجاز", "توضیحات"]}
          rows={shortcuts.map((s) => [
            <span key={`${s.id}-t`} className="font-bold text-xs">{s.title}</span>,
            <Badge key={`${s.id}-c`} tone="neutral">{s.category}</Badge>,
            <span key={`${s.id}-h`} className="font-mono text-xs text-amber-600" dir="ltr">{s.href}</span>,
            <div key={`${s.id}-r`} className="flex flex-wrap gap-1">
              {s.allowedRoles.slice(0, 3).map((r) => (
                <span key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--line)] text-[var(--ink)] font-mono">{r}</span>
              ))}
              {s.allowedRoles.length > 3 && <span className="text-[10px] text-[var(--muted)]">+{s.allowedRoles.length - 3}</span>}
            </div>,
            <span key={`${s.id}-d`} className="text-xs text-[var(--muted)]">{s.description}</span>,
          ])}
        />
      </Panel>

      {/* Modal for Creating New Global Shortcut */}
      <ActionModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="تعریف میانبر سراسری جدید"
        description="افزودن قابلیت یا مسیر جدید به کاتالوگ میانبرهای سامانه دیدار."
        confirmLabel="ثبت میانبر"
        onConfirm={handleCreateShortcut}
      >
        <div className="space-y-4">
          <Field label="عنوان میانبر">
            <input
              className="field min-h-11"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="مثال: تسویه گروهی بنکداران"
            />
          </Field>

          <Field label="مسیر مقصد در فرانت‌اند (URL Route)">
            <input
              className="field min-h-11 font-mono"
              value={newHref}
              onChange={(e) => setNewHref(e.target.value)}
              dir="ltr"
              placeholder="/app/finance/settlements"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="دامنه اصلی">
              <select
                className="field min-h-11"
                value={newDomainId}
                onChange={(e) => {
                  setNewDomainId(e.target.value);
                  const map: Record<string, string> = {
                    network: "شبکه",
                    product: "محصول",
                    inventory: "موجودی و UID",
                    commerce: "تجارت",
                    fulfillment: "تحقق سفارش",
                    finance: "مالی",
                    service: "خدمات",
                    relationship: "ارتباطات",
                    intelligence: "هوش تجاری",
                    governance: "تنظیمات مدیریتی",
                  };
                  setNewCategory(map[e.target.value] || "عمومی");
                }}
              >
                <option value="network">۱. شبکه (Network)</option>
                <option value="product">۲. محصول (Product)</option>
                <option value="inventory">۳. موجودی و UID (Inventory)</option>
                <option value="commerce">۴. تجارت (Commerce)</option>
                <option value="fulfillment">۵. تحقق سفارش (Fulfillment)</option>
                <option value="finance">۶. مالی (Finance)</option>
                <option value="service">۷. خدمات و چرخه عمر (Service)</option>
                <option value="relationship">۸. مشتری و ارتباطات (CRM)</option>
                <option value="intelligence">۹. داده و هوش تجاری (Intelligence)</option>
                <option value="governance">۱۰. تنظیمات مدیریتی (Governance)</option>
              </select>
            </Field>

            <Field label="دسته‌بندی نمایشی">
              <input
                className="field min-h-11"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
            </Field>
          </div>

          <Field label="توضیحات کوتاه">
            <input
              className="field min-h-11"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="توضیح عملکرد این میانبر جهت راهنمایی کاربر"
            />
          </Field>
        </div>
      </ActionModal>
    </div>
  );
}
