"use client";

import { usePlatform } from "@/context/platform-context";
import { formatMoney, formatWeight } from "@/lib/utils";
import { Badge, Panel, SectionHeader } from "@/components/ui";
import { DataTable } from "@/components/data-table";

export default function FinanceLedgerPage() {
  const { dualLedger, error } = usePlatform();
  const weightBalance = dualLedger.reduce(
    (s, e) => s + e.weightDebit - e.weightCredit,
    0,
  );

  return (
    <div>
      <SectionHeader
        title="دفتر معین دوگانه"
        description="رسید UID و حواله پیش‌فاکتور به‌صورت خودکار ثبت می‌شوند."
      />
      {error ? (
        <Panel className="mb-4 p-4 text-sm text-amber-950 bg-amber-50">
          داده زنده بارگذاری نشد: {error}
        </Panel>
      ) : null}

      <Panel className="mb-6 border-[var(--gold)]/25 bg-[var(--gold)]/8 p-4 text-sm">
        دفتر کل غیرقابل ویرایش است. اصلاح فقط از طریق سند تعدیل.
      </Panel>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Panel className="p-4">
          <p className="text-sm font-semibold">دفتر وزنی</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatWeight(Math.abs(weightBalance))}
          </p>
        </Panel>
        <Panel className="p-4">
          <p className="text-sm font-semibold">دفتر ریالی</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums">
            {formatMoney(
              dualLedger.reduce((s, e) => s + e.irrDebit - e.irrCredit, 0) / 10,
            )}
          </p>
        </Panel>
      </div>

      <DataTable
        headers={[
          "تاریخ",
          "سند",
          "موجودیت",
          "بدهکار وزن",
          "بستانکار وزن",
          "بدهکار ریال",
          "بستانکار ریال",
          "قفل",
        ]}
        rows={dualLedger.map((e) => [
          e.date,
          <span key={e.id} data-ltr>
            {e.docCode}
          </span>,
          e.entity,
          e.weightDebit ? formatWeight(e.weightDebit) : "—",
          e.weightCredit ? formatWeight(e.weightCredit) : "—",
          e.irrDebit ? formatMoney(e.irrDebit / 10) : "—",
          e.irrCredit ? formatMoney(e.irrCredit / 10) : "—",
          <Badge key={`${e.id}-l`} tone="neutral">
            قفل
          </Badge>,
        ])}
      />
    </div>
  );
}
