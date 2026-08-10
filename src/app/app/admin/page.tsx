"use client";

import { usePlatform } from "@/context/platform-context";
import { formatMoney, formatNumber, formatWeight } from "@/lib/utils";
import { Button, Panel, SectionHeader, Stat } from "@/components/ui";
import {
  DeliveryStatusBadge,
  OrderStatusBadge,
} from "@/components/status";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui";
import { WorkJourney } from "@/components/work-journey";
import { useSession } from "@/context/session-context";
import { resolveGoldRate } from "@/lib/gold-rate";

export default function AdminOverviewPage() {
  const { role } = useSession();
  const {
    skus,
    issuedAssets,
    proformas,
    auditEvents,
    rateRequests,
    orders,
    deliveries,
    assets,
    inventory,
    liveGoldPrice,
  } = usePlatform();
  const awaitingQc = skus.filter((s) => s.status === "awaiting_qc").length;
  const pendingRates = rateRequests.filter((r) => r.status === "pending").length;
  const networkWeight = inventory.reduce((s, i) => s + i.weightGrams, 0);
  const rate = resolveGoldRate(liveGoldPrice);

  return (
    <div>
      <WorkJourney role={role} />
      <SectionHeader
        title="نمای کلی"
        description="وضعیت شبکه و صف‌های عملیاتی از دادهٔ زندهٔ سامانه."
        action={
          <div className="flex gap-2">
            <Button href="/app/admin/audit" variant="secondary">
              فعالیت‌ها
            </Button>
            <Button href="/app/admin/users">کاربران</Button>
            <Button href="/app/admin/reports" variant="secondary">
              گزارش‌ها
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Stat
          label="وزن شبکه"
          value={formatWeight(networkWeight)}
          hint={`نرخ ~ ${formatMoney(rate)} /گرم`}
        />
        <Stat label="منتظر QC" value={formatNumber(awaitingQc)} />
        <Stat label="UID صادرشده" value={formatNumber(issuedAssets.length)} />
        <Stat label="پیش‌فاکتور" value={formatNumber(proformas.length)} />
        <Stat label="درخواست نرخ معلق" value={formatNumber(pendingRates)} />
        <Stat
          label="رویدادهای ثبت‌شده"
          value={formatNumber(auditEvents.length)}
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <SectionHeader title="سفارش‌های اخیر" />
          <DataTable
            headers={["سفارش", "خریدار", "وزن", "مبلغ", "وضعیت"]}
            rows={orders.slice(0, 5).map((o) => [
              <span key={o.id} data-ltr>
                {o.code}
              </span>,
              o.retailer,
              formatWeight(o.totalWeight),
              formatMoney(o.value),
              <OrderStatusBadge key={`${o.id}-s`} status={o.status} />,
            ])}
            empty="سفارشی ثبت نشده."
          />
        </div>
        <div className="xl:col-span-2">
          <SectionHeader title="آخرین فعالیت‌ها" />
          <Panel className="divide-y divide-[var(--line)]">
            {auditEvents.length ? (
              auditEvents.slice(0, 6).map((e) => (
                <div key={e.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{e.action}</p>
                    <Badge tone={e.status === "ok" ? "ok" : "danger"}>
                      {e.status === "ok" ? "موفق" : "خطا"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {e.actor} · {e.entity} · {e.timestamp}
                  </p>
                </div>
              ))
            ) : (
              <p className="px-4 py-5 text-sm text-[var(--muted)]">
                هنوز رویدادی نیست.
              </p>
            )}
          </Panel>
          <SectionHeader title="تحویل‌ها" />
          <div className="space-y-2">
            {deliveries.slice(0, 3).map((d) => (
              <Panel
                key={d.id}
                className="flex items-center justify-between p-3 text-sm"
              >
                <span data-ltr>{d.code}</span>
                <DeliveryStatusBadge status={d.status} />
              </Panel>
            ))}
            {!deliveries.length ? (
              <p className="text-sm text-[var(--muted)]">تحویلی ثبت نشده.</p>
            ) : null}
          </div>
          <p className="mt-3 text-xs text-[var(--muted)]">
            کالاهای شبکه: {formatNumber(assets.length)} قلم
          </p>
        </div>
      </div>
    </div>
  );
}
