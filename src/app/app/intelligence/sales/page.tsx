"use client";

import React from "react";
import { formatNumber, formatWeight, formatRial } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Badge } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { TrendingUp, BarChart3, PieChart } from "lucide-react";

export default function IntelligenceSalesPage() {
  const salesData = [
    { period: "امروز (۲۱ بهمن)", weightGrams: 14.5, orderCount: 4, revenueRial: 630750000 },
    { period: "دیروز (۲۰ بهمن)", weightGrams: 28.2, orderCount: 7, revenueRial: 1226700000 },
    { period: "هفته جاری", weightGrams: 112.0, orderCount: 28, revenueRial: 4872000000 },
    { period: "ماه جاری (بهمن)", weightGrams: 420.5, orderCount: 95, revenueRial: 18291750000 },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="گزارش جامع فروش و عملکرد مالی (Sales & Performance Analytics)"
        description="تحلیل وزنی طلا، حجم ریالی فروش، متوسط وزن هر سفارش و روند رشد فروش شبکه."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="کل حجم فروش ماه" value={formatWeight(420.5)} hint="طلا ۱۸ عیار" />
        <Stat label="درآمد کل ریالی" value={formatRial(18291750000)} />
        <Stat label="میانگین وزن هر سفارش" value="۴.۴۲ گرم" hint="بهبود ۱۲٪ نسبت به ماه قبل" />
      </div>

      <Panel className="p-4">
        <DataTable
          headers={["دوره زمانی", "حجم فروش طلا (گرم)", "تعداد سفارشات", "مبلغ کل فروش (ریال)"]}
          rows={salesData.map((s) => [
            <div key={`${s.period}-p`} className="flex items-center gap-2 font-semibold">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>{s.period}</span>
            </div>,
            formatWeight(s.weightGrams),
            formatNumber(s.orderCount),
            formatRial(s.revenueRial),
          ])}
        />
      </Panel>
    </div>
  );
}
