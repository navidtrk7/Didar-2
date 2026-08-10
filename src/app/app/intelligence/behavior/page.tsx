"use client";

import React from "react";
import { formatNumber } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Badge } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { Activity, Eye, ShoppingBag } from "lucide-react";

export default function IntelligenceBehaviorPage() {
  const behaviorData = [
    { category: "انگشتر طلا کلکسیون زمرد", views: 420, addCount: 85, conversionRate: "۲۰.۲٪" },
    { category: "دستبند کارتیه ۱۸ عیار", views: 310, addCount: 64, conversionRate: "۲۰.۶٪" },
    { category: "گردنبند طلا مروارید", views: 195, addCount: 28, conversionRate: "۱۴.۳٪" },
    { category: "گوشواره خورشید", views: 150, addCount: 19, conversionRate: "۱۲.۶٪" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="تحلیل رفتار و تمایلات خرید گالری‌ها (Behavior Analysis)"
        description="میزان بازدید کاتالوگ، سنجش علاقه گالری‌ها به مدل‌های مختلف و نرخ تبدیل به سفارش."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="کل بازدید کاتالوگ" value="۱,۰۷۵ بازدید" />
        <Stat label="محبوب‌ترین دسته‌بندی" value="انگشتر کلکسیون زمرد" hint="۴۲۰ بازدید" />
        <Stat label="میانگین نرخ تبدیل" value="۱۷٪" hint="بازدید به ثبت سفارش" />
      </div>

      <Panel className="p-4">
        <DataTable
          headers={["مدل / دسته‌بندی محصول", "تعداد بازدید گالری‌ها", "افزودن به سبد سفارش", "نرخ تبدیل"]}
          rows={behaviorData.map((b) => [
            <div key={`${b.category}-c`} className="font-semibold">{b.category}</div>,
            formatNumber(b.views),
            formatNumber(b.addCount),
            <Badge key={`${b.category}-r`} tone="ok">{b.conversionRate}</Badge>,
          ])}
        />
      </Panel>
    </div>
  );
}
