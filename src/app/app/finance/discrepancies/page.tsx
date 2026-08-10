"use client";

import React from "react";
import { formatNumber, formatRial } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Badge, Button } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { useToast } from "@/components/toast";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function FinanceDiscrepanciesPage() {
  const { toast } = useToast();

  const discrepancies = [
    { id: "fin-disc-1", reference: "ZRN-SET-832CF", party: "تولیدکننده آتلیه الماس", type: "اختلاف کارمزد درگاه", deltaAmount: 15000, status: "resolved" },
    { id: "fin-disc-2", reference: "PF-1405-022", party: "گالری مهر طلا", type: "گرد کردن اجرت ساخت", deltaAmount: 2500, status: "resolved" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="مغایرت‌های مالی و تسویه درگاه (Financial Discrepancies)"
        description="ثبت و موازنه تفاوت نرخ، اختلاف کارمزد بانک/زرین و موازنه حساب‌های دفتر کل."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="کل مغایرت‌های شناسا" value={formatNumber(discrepancies.length)} />
        <Stat label="مغایرت‌های تراز شده" value={formatNumber(discrepancies.length)} hint="تراز ۱۰۰٪ دفتر کل" />
        <Stat label="وضعیت حسابداری" value="بدون اختلاف" hint="پایان دوره مالی" />
      </div>

      <Panel className="p-4">
        <DataTable
          headers={["کد مرجع سند", "طرف حساب", "نوع مغایرت", "مبلغ اختلاف", "وضعیت"]}
          rows={discrepancies.map((d) => [
            <span key={`${d.id}-r`} className="font-mono text-xs text-amber-600 font-bold" data-ltr>
              {d.reference}
            </span>,
            d.party,
            d.type,
            formatRial(d.deltaAmount),
            <Badge key={`${d.id}-st`} tone="ok">
              تراز شده
            </Badge>,
          ])}
        />
      </Panel>
    </div>
  );
}
