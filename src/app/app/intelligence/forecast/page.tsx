"use client";

import React from "react";
import { formatWeight } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Badge } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { LineChart, Sparkles, TrendingUp } from "lucide-react";

export default function IntelligenceForecastPage() {
  const forecasts = [
    { category: "انگشتر و حلقه طلا", currentStock: "۳۵ گرم", forecastDemand: "۸۵ گرم", recommendation: "افزایش تولید کارگاه کارتیه +۱۴۳٪" },
    { category: "دستبند و النگو", currentStock: "۶۰ گرم", forecastDemand: "۷۵ گرم", recommendation: "حفظ روند تولید فعلی" },
    { category: "گردنبند و مدال", currentStock: "۴۵ گرم", forecastDemand: "۳۰ گرم", recommendation: "کاهش سفارش تولید کارگاه" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="پیش‌بینی تقاضا و هوش ساخت (Demand Forecast AI)"
        description="پیش‌بینی هوشمند میزان تقاضای بازار طلا بر اساس مناسبت‌های سال، روند قیمت و تحلیل رفتار خرید."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="تقاضای پیش‌بینی‌شده ماه بعد" value={formatWeight(190)} hint="طلا ۱۸ عیار" />
        <Stat label="دقت مدل هوش مصنوعی" value="۹۲.۴٪" hint="بر اساس الگوریتم سری زمانی" />
        <Stat label="کمبود موجودی احتمالی" value="انگشتر زمرد" hint="نیاز به ثبت سفارش کارگاه" />
      </div>

      <Panel className="p-4">
        <DataTable
          headers={["دسته محصول", "موجودی فعلی انبار", "تقاضای پیش‌بینی‌شده", "پیشنهاد هوشمند هوش مصنوعی"]}
          rows={forecasts.map((f) => [
            <div key={`${f.category}-c`} className="font-semibold">{f.category}</div>,
            f.currentStock,
            f.forecastDemand,
            <Badge key={`${f.category}-rec`} tone="gold">{f.recommendation}</Badge>,
          ])}
        />
      </Panel>
    </div>
  );
}
