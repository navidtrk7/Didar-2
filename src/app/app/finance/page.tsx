"use client";

import { usePlatform } from "@/context/platform-context";
import { useSession } from "@/context/session-context";
import { resolveGoldRate } from "@/lib/gold-rate";
import { formatMoney, formatWeight } from "@/lib/utils";
import { Button, Panel, SectionHeader, Stat } from "@/components/ui";
import { WorkJourney } from "@/components/work-journey";

export default function FinanceOverviewPage() {
  const { role } = useSession();
  const {
    dualLedger,
    proformas,
    issuedAssets,
    inventory,
    liveGoldPrice,
    error,
  } = usePlatform();
  const rate = resolveGoldRate(liveGoldPrice);
  const totalGrams = inventory.reduce((s, i) => s + i.weightGrams, 0);
  const irrValue = totalGrams * rate;

  return (
    <div>
      <WorkJourney role={role} compact />
      <SectionHeader
        title="مالی"
        description="ارزش موجودی، جریان وزنی/ریالی و اسناد زنده."
        action={
          <div className="flex flex-wrap gap-2">
            {role === "finance" || role === "admin" ? (
              <Button href="/app/finance/ledger" variant="secondary">
                دفتر معین
              </Button>
            ) : null}
            <Button href="/app/finance/credit" variant="secondary">
              اعتبار / توافق اعتماد
            </Button>
            {role === "finance" || role === "admin" ? (
              <Button href="/app/finance/settlements">تسویه تولیدکننده</Button>
            ) : null}
          </div>
        }
      />
      {error ? (
        <Panel className="mb-4 p-4 text-sm text-amber-950 bg-amber-50">
          داده زنده بارگذاری نشد: {error}
        </Panel>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="نرخ ۱۸ عیار" value={formatMoney(rate)} />
        <Stat label="وزن کل موجودی" value={formatWeight(totalGrams)} />
        <Stat label="ارزش ریالی تقریبی" value={formatMoney(irrValue)} />
        <Stat
          label="اسناد دفتر"
          value={String(dualLedger.length)}
          hint={`${issuedAssets.length} UID · ${proformas.length} پیش‌فاکتور`}
        />
      </div>
    </div>
  );
}
