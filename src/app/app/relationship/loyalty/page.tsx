"use client";

import React from "react";
import { formatNumber } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Badge } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { Award, Crown, Gift, Star } from "lucide-react";

export default function RelationshipLoyaltyPage() {
  const tiers = [
    { level: "سطح الماس (Diamond)", minWeight: "۵۰ گرم طلا", discount: "۳.۵٪ کسر اجرت", membersCount: 5 },
    { level: "سطح طلایی (Gold VIP)", minWeight: "۲۰ گرم طلا", discount: "۲.۵٪ کسر اجرت", membersCount: 18 },
    { level: "سطح نقره‌ای (Silver)", minWeight: "۱۰ گرم طلا", discount: "۱.۵٪ کسر اجرت", membersCount: 42 },
    { level: "سطح برنزی (Standard)", minWeight: "۰ گرم طلا", discount: "قیمت پایه کاتالوگ", membersCount: 120 },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="سطوح وفاداری و باشگاه مشتریان دیدار (Loyalty Tiers)"
        description="دسته‌بندی ذینفعان و خریداران بر اساس میزان خرید طلا، امتیازات اعتباری و تخفیف‌های پلکانی."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="کل اعضای باشگاه" value="۱۸۵ عضو" />
        <Stat label="اعضای سطوح VIP" value="۲۳ عضو" hint="الماس و طلایی" />
        <Stat label="میانگین تخفیف وفاداری" value="۲.۲٪ کسر اجرت" />
      </div>

      <Panel className="p-4">
        <DataTable
          headers={["سطح وفاداری", "حدنصاب خرید (حداقل طلا)", "مزایای اختصاصی / تخفیف", "تعداد اعضا"]}
          rows={tiers.map((t) => [
            <div key={`${t.level}-l`} className="flex items-center gap-2 font-semibold">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>{t.level}</span>
            </div>,
            t.minWeight,
            t.discount,
            `${t.membersCount} نفر`,
          ])}
        />
      </Panel>
    </div>
  );
}
