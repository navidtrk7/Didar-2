"use client";

import { useEffect, useState } from "react";
import {
  DomainLinkButton,
  DomainOverviewPage,
} from "@/components/domain-overview";
import { DomainEmptyState } from "@/components/domain-empty";
import { WorkJourney } from "@/components/work-journey";
import { DataTable } from "@/components/data-table";
import { Panel, Stat } from "@/components/ui";
import { useSession } from "@/context/session-context";
import { apiEnabled, didarApi } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

type Analytics = Awaited<ReturnType<typeof didarApi.intelligenceAnalytics>>;

export default function IntelligenceDomainPage() {
  const { role } = useSession();
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiEnabled()) return;
    void didarApi
      .intelligenceAnalytics()
      .then(setData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "خطا در بارگذاری"),
      );
  }, []);

  return (
    <div>
      <WorkJourney role={role} compact />
    <DomainOverviewPage
      domainId="intelligence"
      title="هوش"
      description="پیشنهادهای عملیاتی و سیگنال‌های صف‌های جاری."
      actions={
        <DomainLinkButton href="/app/admin/reports">گزارش‌های فعلی</DomainLinkButton>
      }
    >
      {!apiEnabled() ? (
        <DomainEmptyState
          title="این بخش در حال تکمیل است"
          body="تحلیل زنده پس از اتصال سرویس در دسترس است. فعلاً از گزارش‌های مدیریتی استفاده کنید."
          href="/app/admin/reports"
          actionLabel="گزارش‌ها"
        />
      ) : null}
      {error ? (
        <Panel className="mb-4 p-5 text-sm text-rose-800">{error}</Panel>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="کل رویدادها"
          value={formatNumber(data?.total_events ?? 0)}
        />
        <Stat
          label="سفارش‌ها"
          value={formatNumber(data?.signals.orders ?? 0)}
        />
        <Stat
          label="تحویل تکمیل"
          value={formatNumber(data?.signals.deliveries_completed ?? 0)}
        />
        <Stat
          label="تخصیص‌ها"
          value={formatNumber(data?.signals.allocations ?? 0)}
        />
        <Stat
          label="در حال برداشت"
          value={formatNumber(data?.signals.fulfillment_picking ?? 0)}
        />
        <Stat
          label="منتظر تأیید تحویل"
          value={formatNumber(data?.signals.awaiting_otp ?? 0)}
        />
        <Stat
          label="محصول تأییدشده"
          value={formatNumber(data?.signals.approved_skus ?? 0)}
        />
        <Stat
          label="اجرای کمپین"
          value={formatNumber(data?.signals.campaigns_fired ?? 0)}
        />
      </div>

      {data?.recommendations?.length ? (
        <Panel className="mb-6 p-5">
          <p className="text-sm font-semibold">پیشنهادهای عملیاتی</p>
          <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--muted)]">
            {data.recommendations.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <div className="mb-8 grid gap-6 xl:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold">بر اساس نوع رویداد</h2>
          <DataTable
            headers={["رویداد", "تعداد"]}
            rows={(data?.by_type ?? []).map((r) => [
              <span key={r.event_type} data-ltr className="font-mono text-xs">
                {r.event_type}
              </span>,
              formatNumber(r.count),
            ])}
            empty="رویدادی نیست."
          />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">بر اساس aggregate</h2>
          <DataTable
            headers={["نوع", "تعداد"]}
            rows={(data?.by_aggregate ?? []).map((r) => [
              <span key={r.aggregate_type} data-ltr className="font-mono text-xs">
                {r.aggregate_type}
              </span>,
              formatNumber(r.count),
            ])}
            empty="—"
          />
        </div>
      </div>

      <h2 className="mb-3 text-sm font-semibold">رویدادهای اخیر</h2>
      <DataTable
        headers={["رویداد", "بازیگر", "نقش", "مرجع"]}
        rows={(data?.recent ?? []).map((e) => [
          <span key={e.id} data-ltr className="font-mono text-xs">
            {e.event_type}
          </span>,
          e.actor,
          e.role,
          <span key={`${e.id}-a`} data-ltr className="font-mono text-xs">
            {e.aggregate_type}:{e.aggregate_id}
          </span>,
        ])}
        empty="—"
      />
    </DomainOverviewPage>
    </div>
  );
}
