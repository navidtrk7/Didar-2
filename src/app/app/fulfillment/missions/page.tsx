"use client";

import React from "react";
import { formatNumber } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Badge } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { MapPin, Navigation, Clock } from "lucide-react";

export default function FulfillmentMissionsPage() {
  const missions = [
    { id: "m-101", agent: "نوید محمدی", route: "بازار تهران ➔ گالری مهر (تجریش)", itemsCount: 3, status: "in_transit", time: "امروز ۱۰:۳۰" },
    { id: "m-102", agent: "رضا کریمی", route: "انبار مرکزی ➔ بنکداری آریا (سبزه میدان)", itemsCount: 5, status: "completed", time: "امروز ۰۹:۱۵" },
    { id: "m-103", agent: "علی حسینی", route: "آتلیه الماس ➔ انبار مرکزی (انتقال فیزیکی)", itemsCount: 2, status: "assigned", time: "امروز ۱۱:۴۵" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="مأموریت‌های حمل و موقعیت ایجنت‌ها (Agent Missions & Logistics)"
        description="پایش زنده مسیرهای حمل طلا، مأموریت‌های فعال ایجنت‌ها و تحویل به موقع سفارشات."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="مأموریت‌های فعال" value="۲ مأموریت" hint="در حال حرکت در سطح شهر" />
        <Stat label="تحویل‌های موفق امروز" value="۸ تحویل" />
        <Stat label="وضعیت امنیت حمل" value="پایش زنده GPS" hint="بدون مغایرت مسیر" />
      </div>

      <Panel className="p-4">
        <DataTable
          headers={["کد مأموریت", "ایجنت مسئول", "مسیر مأموریت", "تعداد بسته DDR", "زمان", "وضعیت"]}
          rows={missions.map((m) => [
            <span key={`${m.id}-c`} className="font-mono text-xs text-amber-600 font-bold" data-ltr>
              {m.id}
            </span>,
            m.agent,
            <div key={`${m.id}-r`} className="flex items-center gap-1.5 text-xs">
              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{m.route}</span>
            </div>,
            `${m.itemsCount} قطعه`,
            m.time,
            <Badge key={`${m.id}-st`} tone={m.status === "in_transit" ? "warn" : m.status === "completed" ? "ok" : "neutral"}>
              {m.status === "in_transit" ? "در حال مسیر" : m.status === "completed" ? "تکمیل شده" : "تخصیص‌یافته"}
            </Badge>,
          ])}
        />
      </Panel>
    </div>
  );
}
