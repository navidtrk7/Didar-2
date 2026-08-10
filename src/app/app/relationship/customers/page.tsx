"use client";

import React, { useState } from "react";
import { formatNumber, formatRial } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Button, Field, Badge } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ActionModal } from "@/components/action-modal";
import { useToast } from "@/components/toast";
import { Users, Plus, Star, Phone } from "lucide-react";

export default function RelationshipCustomersPage() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");

  const [customers, setCustomers] = useState([
    { id: "c-1", name: "زهرا تهرانی", phone: "۰۹۱۲۳۴۵۶۷۸۹", tier: "طلایی (VIP)", totalPurchases: "۳۴ گرم طلا", status: "active" },
    { id: "c-2", name: "مهدی علوی", phone: "۰۹۱۲۹۸۷۶۵۴۳", tier: "نقره‌ای", totalPurchases: "۱۲.۵ گرم طلا", status: "active" },
    { id: "c-3", name: "مریم رضایی", phone: "۰۹۱۲۵۵۵۴۴۳۳", tier: "برنزی", totalPurchases: "۵.۲ گرم طلا", status: "active" },
  ]);

  const handleCreate = () => {
    if (!custName.trim()) {
      toast("نام مشتری را وارد کنید", "warn");
      return;
    }
    setCustomers((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, name: custName.trim(), phone: custPhone || "۰۹۱۲۰۰۰۰۰۰۰", tier: "جدید", totalPurchases: "۰ گرم", status: "active" },
    ]);
    toast("مشتری جدید ثبت شد");
    setModalOpen(false);
    setCustName("");
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="پروفایل مشتریان نهایی و خریداران (Customer CRM)"
        description="مدیریت پرونده خریداران، سابقه خرید طلا، سطوح وفاداری و اطلاعات تماس."
        action={
          <Button onClick={() => setModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>ثبت مشتری جدید</span>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="کل مشتریان ثبت‌شده" value={formatNumber(customers.length)} />
        <Stat label="مشتریان VIP طلایی" value="۱ مشتری" hint="خرید بالای ۳۰ گرم" />
        <Stat label="مجموع فروش به مشتریان" value="۵۱.۷ گرم" />
      </div>

      <Panel className="p-4">
        <DataTable
          headers={["نام و نام خانوادگی", "شماره تماس", "سطح وفاداری", "مجموع خرید", "وضعیت"]}
          rows={customers.map((c) => [
            <div key={`${c.id}-n`} className="font-semibold">{c.name}</div>,
            <span key={`${c.id}-p`} className="font-mono text-xs" dir="ltr">{c.phone}</span>,
            <Badge key={`${c.id}-t`} tone="gold">{c.tier}</Badge>,
            c.totalPurchases,
            <Badge key={`${c.id}-st`} tone="ok">فعال</Badge>,
          ])}
        />
      </Panel>

      <ActionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="ثبت مشتری جدید"
        description="افزودن پرونده خریدار نهایی برای ثبت گارانتی و باشگاه مشتریان."
        confirmLabel="ثبت مشتری"
        onConfirm={handleCreate}
      >
        <div className="space-y-4">
          <Field label="نام و نام خانوادگی">
            <input className="field min-h-11" value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="مثال: نرگس امینی" />
          </Field>
          <Field label="شماره تلفن همراه">
            <input className="field min-h-11 font-mono" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="۰۹۱۲۰۰۰۰۰۰۰" dir="ltr" />
          </Field>
        </div>
      </ActionModal>
    </div>
  );
}
