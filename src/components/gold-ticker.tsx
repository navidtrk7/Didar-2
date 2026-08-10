"use client";

import { useEffect, useState } from "react";
import { LIVE_GOLD, priceSeries } from "@/data/mock";
import type { TgjuSnapshot } from "@/lib/tgju";
import { cn, formatMoney, formatPercent } from "@/lib/utils";
import { motion } from "framer-motion";

export function GoldTicker({ className = "" }: { className?: string }) {
  const [price, setPrice] = useState(LIVE_GOLD.pricePerGram);
  const [changePct, setChangePct] = useState(LIVE_GOLD.changePct);
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/prices", { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setFailed(true);
          return;
        }
        const data = (await res.json()) as TgjuSnapshot;
        if (cancelled || !data.geram18Toman) {
          if (!cancelled) setFailed(true);
          return;
        }
        setPrice(data.geram18Toman);
        const g18 = data.quotes.find((q) => q.key === "geram18");
        if (g18) setChangePct(g18.changePct);
        setLive(true);
        setFailed(false);
      } catch {
        if (!cancelled) setFailed(true);
      }
    }

    load();
    const id = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const max = Math.max(...priceSeries);
  const min = Math.min(...priceSeries);
  const points = priceSeries
    .map((v, i) => {
      const x = (i / (priceSeries.length - 1)) * 120;
      const y = 28 - ((v - min) / (max - min)) * 22;
      return `${x},${y}`;
    })
    .join(" ");

  const up = changePct >= 0;
  const statusLabel = live ? "TGJU" : failed ? "آفلاین" : "…";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "inline-flex items-center gap-3 rounded-full border border-[var(--line)] bg-white px-3 py-1.5 shadow-sm",
        className,
      )}
      title={
        live
          ? "منبع: شبکه اطلاع‌رسانی طلا و ارز (tgju.org)"
          : "نرخ زنده دریافت نشد — نمایش کش/آزمایشی"
      }
    >
      <span className="relative flex h-2 w-2">
        {live ? (
          <>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </>
        ) : (
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        )}
      </span>
      <span className="text-[11px] font-semibold text-[var(--muted)]">
        طلای ۱۸ عیار
      </span>
      <span className="font-semibold tabular-nums text-[var(--ink)]">
        {formatMoney(price)}
        <span className="text-[var(--muted)]"> /گرم</span>
      </span>
      {live ? (
        <span
          className={`text-xs font-semibold ${up ? "text-emerald-700" : "text-rose-700"}`}
        >
          {up ? "+" : ""}
          {formatPercent(changePct)}
        </span>
      ) : null}
      {live ? (
        <svg
          width="72"
          height="28"
          viewBox="0 0 120 32"
          className="hidden sm:block"
          aria-hidden
        >
          <polyline
            fill="none"
            stroke="var(--gold)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      ) : null}
      <span className="hidden text-[10px] text-[var(--muted)] xl:inline">
        {statusLabel}
      </span>
    </motion.div>
  );
}
