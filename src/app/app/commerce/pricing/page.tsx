"use client";

import { usePlatform } from "@/context/platform-context";
import { resolveGoldRate } from "@/lib/gold-rate";
import { formatMoney } from "@/lib/utils";
import { Button, Panel, SectionHeader, Stat } from "@/components/ui";

/**
 * Core pricing pulse only.
 * Depth tools (rules / simulator / rate-requests) are parked — not pilot spine.
 */
export default function PricingOverviewPage() {
  const { liveGoldPrice, settings } = usePlatform();
  const rate = resolveGoldRate(liveGoldPrice);

  return (
    <div>
      <SectionHeader
        title="عملیات قیمت‌گذاری"
        description="نرخ سامانه برای قفل قیمت و پیش‌فاکتور. موتور قوانین اجرت و شبیه‌ساز فعلاً پارک است."
        action={
          <Button href="/app/admin/prices" variant="secondary">
            تنظیم نرخ ادمین
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat
          label="نرخ ۱۸ عیار"
          value={formatMoney(rate)}
          hint="تومان / گرم"
        />
        <Stat label="منبع نرخ" value={settings.rateSource || "تنظیمات"} />
        <Stat label="قفل قیمت" value="روی پیش‌فاکتور" hint="هستهٔ فروش" />
      </div>

      <Panel className="mt-8 p-5 text-sm leading-7 text-[var(--muted)]">
        <p className="font-semibold text-[var(--ink)]">چه چیزی زنده است؟</p>
        <ul className="mt-3 list-disc space-y-1 pr-5">
          <li>نرخ زنده / تنظیم‌شده برای محاسبات سفارش و پیش‌فاکتور</li>
          <li>قفل قیمت کوتاه‌مدت هنگام صدور پیش‌فاکتور</li>
        </ul>
        <p className="mt-4">
          قوانین اجرت، شبیه‌ساز و صف درخواست تغییر دستی نرخ — تا موتور قیمت کامل
          شود — از محصول خارج شده‌اند (پارک).
        </p>
      </Panel>
    </div>
  );
}
