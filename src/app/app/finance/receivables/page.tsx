"use client";

import React from "react";
import { formatNumber, formatWeight, formatRial } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Badge, Button } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { useToast } from "@/components/toast";
import { DollarSign, AlertCircle, Clock } from "lucide-react";

export default function FinanceReceivablesPage() {
  const { toast } = useToast();

  const receivables = [
    { id: "rec-1", partyName: "گالری مهر طلا", goldAmount: 12.45, rialAmount: 541575000, dueDate: "۱۴۰۴/۱۱/۲۵", status: "near_due" },
    { id: "rec-2", partyName: "بنکداری آریا", goldAmount: 45.10, rialAmount: 1961850000, dueDate: "۱۴۰۴/۱۱/۳۰", status: "normal" },
    { id: "rec-3", partyName: "گالری زمرد", goldAmount: 8.20, rialAmount: 356700000, dueDate: "۱۴۰۴/۱۱/۱۰", status: "overdue" },
  ];

  const handleRemind = (partyName: string) => {
    toast(`یادآوری سررسید مطالبات به ${partyName} پیامک شد.`);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="مدیریت مطالبات و راس‌گیری حساب‌ها (Aging Receivables)"
        description="پیگیری بدهی‌های طلا و ریال گالری‌ها، راس‌گیری سررسیدها و تسویه بدهی اعتبار."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="کل بدهی طلا (معادل)" value={formatWeight(65.75)} hint="بدهی بر حسب طلا ۱۸ عیار" />
        <Stat label="کل مطالبات ریالی" value={formatRial(2860275000)} />
        <Stat label="مطالبات سررسید گذشته" value={formatWeight(8.20)} hint="گالری زمرد" />
      </div>

      <Panel className="p-4">
        <DataTable
          headers={["طرف حساب / گالری", "بدهی طلا (گرم)", "مبلغ ریالی", "تاریخ سررسید", "وضعیت", "اقدام"]}
          rows={receivables.map((r) => [
            r.partyName,
            formatWeight(r.goldAmount),
            formatRial(r.rialAmount),
            r.dueDate,
            <Badge key={`${r.id}-st`} tone={r.status === "overdue" ? "danger" : r.status === "near_due" ? "warn" : "neutral"}>
              {r.status === "overdue" ? "سررسید گذشته" : r.status === "near_due" ? "نزدیک سررسید" : "عادی"}
            </Badge>,
            <Button
              key={`${r.id}-act`}
              variant="secondary"
              className="text-xs px-2.5 py-1"
              onClick={() => handleRemind(r.partyName)}
            >
              ارسال یادآوری
            </Button>,
          ])}
        />
      </Panel>
    </div>
  );
}
