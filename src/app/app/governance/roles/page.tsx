"use client";

import React, { useState } from "react";
import { SectionHeader, Panel, Badge, Button, Field } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ActionModal } from "@/components/action-modal";
import { roleLabels } from "@/data/labels";
import type { RoleId } from "@/data/types";
import { ShieldCheck, Plus, Users, Key } from "lucide-react";

export default function GovernanceRolesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [roleDesc, setRoleDesc] = useState("");

  const systemRoles: { code: RoleId; label: string; desc: string; type: "سیستمی" | "ذینفعان" }[] = [
    { code: "admin", label: "مدیر کل (HQ Admin)", desc: "دسترسی کامل به تمامی دامنه‌ها و تنظیمات مدیریتی", type: "سیستمی" },
    { code: "retailer", label: "خرده‌فروش / بنکدار", desc: "دسترسی به سفارش‌دهی، گالری، اعتبار و گارانتی", type: "ذینفعان" },
    { code: "producer", label: "تولیدکننده / کارگاه", desc: "ثبت محصولات، ارسال به QC و تسویه حساب طلا", type: "ذینفعان" },
    { code: "agent", label: "ایجنت فروش / ویزیتور", desc: "مدیریت سبد سیار، ثبت سفارش خرده‌فروش و تسویه اعتماد", type: "ذینفعان" },
    { code: "warehouse", label: "انباردار / مسئول خزانه", desc: "صدور UID، تخصیص انبار، Pick & Pack و تحویل", type: "سیستمی" },
    { code: "finance", label: "مدیر مالی", desc: "دفتر معین دوگانه، تراز خط اعتبار و تسویه حساب", type: "سیستمی" },
    { code: "qc", label: "بازرس کیفیت (QC)", desc: "بررسی عیار، کنترل وزن و تایید اولیه ورود به کاتالوگ", type: "سیستمی" },
    { code: "pricing", label: "مسئول قیمت‌گذاری", desc: "تنظیم فرمول اجرت، سود و نرخ لحظه‌ای طلا", type: "سیستمی" },
    { code: "customer", label: "مشتری نهایی", desc: "استعلام اصالت شناسه طلا و مشاهده گارانتی", type: "ذینفعان" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="مدیریت نقش‌ها و دسترسی‌های ذینفعان"
        description="تعریف و پیکربندی نقش‌های سیستمی و نقش‌های ذینفعان شبکه طلا."
        action={
          <Button onClick={() => setModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1">
            <Plus className="w-4 h-4" />
            <span>تعریف نقش جدید</span>
          </Button>
        }
      />

      <Panel className="p-6 space-y-4">
        <DataTable
          headers={["کد نقش", "عنوان نقش", "نوع نقش", "توضیحات دسترسی", "وضعیت"]}
          rows={systemRoles.map((r) => [
            <span key={`${r.code}-c`} className="font-mono text-xs text-amber-600" data-ltr>
              {r.code}
            </span>,
            <div key={`${r.code}-lbl`} className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>{r.label}</span>
            </div>,
            <Badge key={`${r.code}-t`} tone={r.type === "سیستمی" ? "info" : "gold"}>
              {r.type}
            </Badge>,
            r.desc,
            <Badge key={`${r.code}-st`} tone="ok">
              فعال
            </Badge>,
          ])}
        />
      </Panel>

      <ActionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="تعریف نقش تخصصی جدید"
        description="افزودن نقش جدید به سیستم جهت اعطا به کاربران داخلی یا ذینفعان شبکه."
        confirmLabel="ذخیره نقش"
        onConfirm={() => {
          setModalOpen(false);
        }}
      >
        <div className="space-y-4">
          <Field label="عنوان فارسی نقش">
            <input className="field min-h-11" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="مثال: سرپرست انبار طلا" />
          </Field>
          <Field label="شناسه لاتین نقش (Role Code)">
            <input className="field min-h-11 font-mono" value={roleCode} onChange={(e) => setRoleCode(e.target.value)} placeholder="warehouse_supervisor" dir="ltr" />
          </Field>
          <Field label="توضیحات دامنه دسترسی">
            <input className="field min-h-11" value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} placeholder="شرح مسئولیت‌های این نقش در پلتفرم..." />
          </Field>
        </div>
      </ActionModal>
    </div>
  );
}
