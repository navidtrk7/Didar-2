"use client";

import { useMemo, useState } from "react";
import { simulatePrice } from "@/data/platform";
import { usePlatform } from "@/context/platform-context";
import { resolveGoldRate } from "@/lib/gold-rate";
import { formatMoney } from "@/lib/utils";
import { Button, Field, Panel, SectionHeader, Stat } from "@/components/ui";

export default function PricingSimulatorPage() {
  const { craftRules, liveGoldPrice } = usePlatform();
  const goldRate = resolveGoldRate(liveGoldPrice);
  const activeRules = craftRules.filter((r) => r.active);
  const [weight, setWeight] = useState("12.5");
  const [ruleId, setRuleId] = useState(activeRules[0]?.id ?? "");
  const rule =
    activeRules.find((r) => r.id === ruleId) ?? activeRules[0] ?? craftRules[0];

  const result = useMemo(() => {
    const w = Number(weight);
    if (!rule || !Number.isFinite(w) || w <= 0) return null;
    return simulatePrice({
      weightGrams: w,
      ratePerGram: goldRate,
      craftMethod: rule.method,
      craftValue: rule.value,
    });
  }, [weight, rule, goldRate]);

  return (
    <div>
      <SectionHeader
        title="شبیه‌ساز قیمت و اجرت"
        description="محاسبه ارزش فلز، اجرت، حاشیه و مالیات."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="space-y-4 p-5">
          <p className="text-sm text-[var(--muted)]">
            نرخ پایه ۱۸ عیار: {formatMoney(goldRate)} تومان
          </p>
          <Field label="وزن (گرم)">
            <input
              className="field"
              type="number"
              step="0.01"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              dir="ltr"
            />
          </Field>
          <Field label="قانون اجرت">
            <select
              className="field"
              value={rule?.id ?? ""}
              onChange={(e) => setRuleId(e.target.value)}
            >
              {activeRules.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <p className="text-xs text-[var(--muted)]">
            محاسبه به‌صورت زنده با تغییر وزن یا قانون اجرت بروزرسانی می‌شود.
          </p>
        </Panel>

        <div className="grid gap-4 sm:grid-cols-2">
          <Stat
            label="ارزش طلای خام"
            value={result ? formatMoney(result.metal) : "—"}
          />
          <Stat
            label="اجرت ساخت"
            value={result ? formatMoney(result.craft) : "—"}
          />
          <Stat
            label="سود فروشنده (۷٪)"
            value={result ? formatMoney(result.margin) : "—"}
          />
          <Stat
            label="مالیات (۹٪)"
            value={result ? formatMoney(result.vat) : "—"}
          />
          <div className="sm:col-span-2">
            <Stat
              label="قیمت نهایی مصرف‌کننده"
              value={result ? formatMoney(result.total) : "—"}
              hint="برآورد"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
