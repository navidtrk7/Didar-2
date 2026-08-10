"use client";

import React, { useState } from "react";
import { formatNumber } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Button, Field, Badge } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ActionModal } from "@/components/action-modal";
import { useToast } from "@/components/toast";
import { Megaphone, Plus, Send } from "lucide-react";

export default function RelationshipCampaignsPage() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [campName, setCampName] = useState("");
  const [channel, setChannel] = useState("SMS");

  const [campaigns, setCampaigns] = useState([
    { id: "cmp-1", name: "پیامک معرفی محصولات جدید کلکسیون بهار", channel: "SMS پیامک", trigger: "پس از ثبت سفارش", firedCount: 45, status: "active" },
    { id: "cmp-2", name: "کمپین ایمیلی گالری‌های برتر", channel: "ایمیل", trigger: "سررسید اعتبار", firedCount: 12, status: "active" },
  ]);

  const handleCreate = () => {
    if (!campName.trim()) {
      toast("نام کمپین را وارد کنید", "warn");
      return;
    }
    setCampaigns((prev) => [
      ...prev,
      { id: `cmp-${Date.now()}`, name: campName.trim(), channel, trigger: "دستی", firedCount: 0, status: "active" },
    ]);
    toast("کمپین مارکتینگ جدید فعال شد");
    setModalOpen(false);
    setCampName("");
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="کمپین‌های اطلاع‌رسانی و مارکتینگ (Marketing Campaigns)"
        description="ارسال پیامک اطلاع‌رسانی، کمپین‌های تخفیف اجرت و اتوماسیون پیگیری سفارشات."
        action={
          <Button onClick={() => setModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>تعریف کمپین جدید</span>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="کمپین‌های فعال" value={formatNumber(campaigns.length)} />
        <Stat label="تعداد پیام‌های ارسال‌شده" value="۵۷ پیام" />
        <Stat label="نرخ بازگشت مشتریان" value="۲۴٪" hint="از طریق کمپین‌های SMS" />
      </div>

      <Panel className="p-4">
        <DataTable
          headers={["عنوان کمپین", "کانال ارتباطی", "رویداد راه انداز", "تعداد اجرا", "وضعیت"]}
          rows={campaigns.map((c) => [
            <div key={`${c.id}-n`} className="flex items-center gap-2 font-semibold">
              <Megaphone className="w-4 h-4 text-amber-500" />
              <span>{c.name}</span>
            </div>,
            c.channel,
            c.trigger,
            formatNumber(c.firedCount),
            <Badge key={`${c.id}-st`} tone="ok">فعال</Badge>,
          ])}
        />
      </Panel>

      <ActionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="تعریف کمپین مارکتینگ جدید"
        description="انتخاب کانال و رویداد تحریک کمپین برای گالری‌ها."
        confirmLabel="فعال‌سازی کمپین"
        onConfirm={handleCreate}
      >
        <div className="space-y-4">
          <Field label="عنوان کمپین">
            <input className="field min-h-11" value={campName} onChange={(e) => setCampName(e.target.value)} placeholder="مثال: پیامک معرفی مدل‌های جدید" />
          </Field>
          <Field label="کانال ارتباطی">
            <select className="field min-h-11" value={channel} onChange={(e) => setChannel(e.target.value)}>
              <option value="SMS پیامک">SMS پیامک</option>
              <option value="ایمیل">ایمیل</option>
              <option value="نوتیفیکیشن سامانه">نوتیفیکیشن سامانه</option>
            </select>
          </Field>
        </div>
      </ActionModal>
    </div>
  );
}
