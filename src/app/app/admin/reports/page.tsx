"use client";

import { useEffect, useState } from "react";
import { usePlatform } from "@/context/platform-context";
import { formatMoney, formatNumber, formatWeight } from "@/lib/utils";
import { Panel, SectionHeader, Stat } from "@/components/ui";
import { useToast } from "@/components/toast";
import { apiEnabled, didarApi } from "@/lib/api";

type Summary = {
  ledger_rows: number;
  weight_debit_total: number;
  weight_credit_total: number;
  irr_debit_total: number;
  irr_credit_total: number;
  by_kind: Record<string, number>;
  inventory_weight: number;
  inventory_available: number;
  inventory_reserved: number;
};

export default function AdminReportsPage() {
  const { toast } = useToast();
  const { dualLedger, inventory, error } = usePlatform();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiEnabled()) return;
    didarApi
      .financeSummary()
      .then((s) => {
        setSummary(s as Summary);
        setSummaryError(null);
      })
      .catch((e: unknown) => {
        setSummary(null);
        const msg =
          e instanceof Error ? e.message : "خلاصه مالی بارگذاری نشد";
        setSummaryError(msg);
        toast(msg, "warn");
      });
  }, [dualLedger.length, inventory.length, toast]);

  const localWeight = inventory.reduce((s, i) => s + i.weightGrams, 0);
  const localAvail = inventory.reduce((s, i) => s + i.availableGrams, 0);
  const localReserved = inventory.reduce((s, i) => s + i.reservedGrams, 0);
  const weightIn =
    summary?.weight_debit_total ??
    dualLedger.reduce((s, e) => s + e.weightDebit, 0);
  const weightOut =
    summary?.weight_credit_total ??
    dualLedger.reduce((s, e) => s + e.weightCredit, 0);
  const irrIn =
    summary?.irr_debit_total ?? dualLedger.reduce((s, e) => s + e.irrDebit, 0);
  const irrOut =
    summary?.irr_credit_total ??
    dualLedger.reduce((s, e) => s + e.irrCredit, 0);

  const kinds = summary?.by_kind ?? {};
  const kindRows = Object.entries(kinds).length
    ? Object.entries(kinds)
    : (["receipt", "sale", "transfer", "adjustment"] as const).map(
        (k) => [k, dualLedger.filter((e) => e.kind === k).length] as const,
      );

  return (
    <div>
      <SectionHeader
        title="گزارش‌ها"
        description="خلاصه از دفتر معین دوگانه و موجودی."
      />
      {error || summaryError ? (
        <Panel className="mb-4 p-4 text-sm text-amber-950 bg-amber-50">
          {error ? `داده سامانه: ${error}` : null}
          {error && summaryError ? " · " : null}
          {summaryError ? `خلاصه مالی: ${summaryError}` : null}
        </Panel>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="موجودی شبکه"
          value={formatWeight(summary?.inventory_weight ?? localWeight)}
        />
        <Stat
          label="قابل‌فروش"
          value={formatWeight(summary?.inventory_available ?? localAvail)}
        />
        <Stat
          label="رزرو شده"
          value={formatWeight(summary?.inventory_reserved ?? localReserved)}
        />
        <Stat
          label="ردیف دفتر"
          value={formatNumber(summary?.ledger_rows ?? dualLedger.length)}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Panel className="p-5">
          <p className="text-sm font-semibold">گردش وزن دفتر معین</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">بدهکار وزن</span>
              <span className="tabular-nums">{formatWeight(weightIn)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">بستانکار وزن</span>
              <span className="tabular-nums">{formatWeight(weightOut)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--line)] pt-3 font-semibold">
              <span>خالص</span>
              <span className="tabular-nums">
                {formatWeight(weightIn - weightOut)}
              </span>
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <p className="text-sm font-semibold">گردش ریالی دفتر معین</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">بدهکار</span>
              <span className="tabular-nums">{formatMoney(irrIn / 10)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">بستانکار</span>
              <span className="tabular-nums">{formatMoney(irrOut / 10)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--line)] pt-3 font-semibold">
              <span>تعداد اسناد بر اساس نوع</span>
            </div>
            {kindRows.map(([k, n]) => (
              <div key={k} className="flex justify-between text-[var(--muted)]">
                <span>{k}</span>
                <span className="tabular-nums">{formatNumber(Number(n))}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
