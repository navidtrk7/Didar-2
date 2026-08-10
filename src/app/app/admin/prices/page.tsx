"use client";

import { useEffect, useState } from "react";
import type { TgjuSnapshot } from "@/lib/tgju";
import { formatMoney, formatNumber, formatPercent } from "@/lib/utils";
import { Badge, Panel, SectionHeader, Stat } from "@/components/ui";
import { DataTable } from "@/components/data-table";

export default function AdminPricesPage() {
  const [data, setData] = useState<TgjuSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/prices", { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(json.error ?? "خطا در دریافت قیمت");
          return;
        }
        setData(json as TgjuSnapshot);
        setError(null);
      } catch {
        if (!cancelled) setError("ارتباط با سرویس قیمت برقرار نشد");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const id = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <div>
      <SectionHeader
        title="قیمت طلا"
        description="نرخ لحظه‌ای بازار برای مرجع قیمت‌گذاری."
        action={
          <a
            href="https://www.tgju.org"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-[var(--gold-deep)]"
          >
            مشاهده در TGJU
          </a>
        }
      />

      {loading ? (
        <Panel className="p-6 text-sm text-[var(--muted)]">
          در حال دریافت از TGJU…
        </Panel>
      ) : null}

      {error ? (
        <Panel className="p-6 text-sm text-rose-700">{error}</Panel>
      ) : null}

      {data ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Stat
              label="طلای ۱۸ عیار / گرم"
              value={formatMoney(data.geram18Toman)}
            />
            <Stat
              label="طلای ۲۴ عیار / گرم"
              value={formatMoney(data.geram24Toman)}
            />
            <Stat label="مثقال" value={formatMoney(data.mesghalToman)} />
            <Stat
              label="دلار آزاد"
              value={formatMoney(data.dollarToman)}
              hint={`انس ${formatNumber(data.onsUsd, { maximumFractionDigits: 2 })} دلار`}
            />
          </div>

          <DataTable
            headers={["شاخص", "قیمت (تومان)", "تغییر", "آخرین بروزرسانی"]}
          >
            {data.quotes.map((q) => (
              <tr key={q.key}>
                <td className="px-4 py-3 font-medium">{q.title}</td>
                <td className="px-4 py-3 tabular-nums font-semibold">
                  {q.key === "ons"
                    ? `${formatNumber(q.priceRial, { maximumFractionDigits: 2 })} دلار`
                    : formatMoney(q.priceToman)}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    tone={
                      q.direction === "high"
                        ? "ok"
                        : q.direction === "low"
                          ? "danger"
                          : "neutral"
                    }
                  >
                    {q.changePct >= 0 ? "+" : ""}
                    {formatPercent(q.changePct)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[var(--muted)]">
                  {q.updatedAtFa || "—"}
                </td>
              </tr>
            ))}
          </DataTable>

          <p className="mt-4 text-xs text-[var(--muted)]">
            دریافت‌شده در {new Date(data.fetchedAt).toLocaleString("fa-IR")} ·
            منبع {data.source}
          </p>
        </>
      ) : null}
    </div>
  );
}
