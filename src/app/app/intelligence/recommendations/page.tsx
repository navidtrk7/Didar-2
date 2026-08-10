"use client";

import React from "react";
import { formatRial } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Badge, Button } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { useToast } from "@/components/toast";
import { Lightbulb, Send, Check } from "lucide-react";

export default function IntelligenceRecommendationsPage() {
  const { toast } = useToast();

  const recommendations = [
    { partyName: "گالری مهر طلا", suggestion: "ارسال پیشنهاد مدل دستبند کارتیه ۱۸ عیار", reason: "پرفروش‌ترین مدل گالری‌های منطقه ۱", estRevenue: 450000000 },
    { partyName: "بنکداری آریا", suggestion: "ارسال پکیج اقتصادی انگشتر سبک عیار ۱۸", reason: "محبوبیت بالای اجرت پایین در بازار", estRevenue: 1200000000 },
  ];

  const handleSend = (partyName: string) => {
    toast(`پیشنهاد هوشمند به ${partyName} ارسال شد.`);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="سیستم پیشنهاد هوشمند محصول به گالری‌ها (AI Product Recommendations)"
        description="پیشنهاد محصولات پرفروش به گالری‌ها بر اساس منطقه جغرافیایی، سابقه خرید و سلیقه مشتریان."
      />

      <Panel className="p-4">
        <DataTable
          headers={["گالری / طرف هدف", "پیشنهاد اختصاصی هوش مصنوعی", "دلیل تحلیل هوش", "تخمین حجم فروش (ریال)", "ارسال پیشنهاد"]}
          rows={recommendations.map((r) => [
            <div key={`${r.partyName}-p`} className="font-semibold">{r.partyName}</div>,
            r.suggestion,
            r.reason,
            formatRial(r.estRevenue),
            <Button
              key={`${r.partyName}-act`}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1 flex items-center gap-1"
              onClick={() => handleSend(r.partyName)}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>ارسال پیشنهاد</span>
            </Button>,
          ])}
        />
      </Panel>
    </div>
  );
}
