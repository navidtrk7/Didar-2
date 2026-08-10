"use client";

import { useMemo } from "react";
import { usePlatform } from "@/context/platform-context";
import { useSession } from "@/context/session-context";
import { useWorkspace } from "@/context/workspace-context";
import { formatMoney, formatNumber, formatWeight } from "@/lib/utils";
import { DataTable } from "@/components/data-table";
import { OrderStatusBadge } from "@/components/status";
import { Panel, SectionHeader } from "@/components/ui";

export default function CommerceOrdersPage() {
  const { role, user } = useSession();
  const { activeHat } = useWorkspace();
  const { orders, error, ready } = usePlatform();
  const org = activeHat?.partyName ?? user?.org ?? "";

  const visible = useMemo(() => {
    if (role === "retailer") {
      if (!org) return [];
      return orders.filter((o) => o.retailer === org);
    }
    return orders;
  }, [orders, org, role]);

  return (
    <div>
      <SectionHeader
        title="سفارش‌ها"
        description={
          role === "retailer"
            ? `پیگیری سفارش‌های «${org || "شعبه شما"}».`
            : "پیگیری سفارش‌های ثبت‌شده در دامنه تجارت."
        }
      />
      {error ? (
        <Panel className="mb-4 p-4 text-sm text-amber-950 bg-amber-50">
          داده زنده بارگذاری نشد: {error}
        </Panel>
      ) : null}
      {role === "retailer" && !org ? (
        <Panel className="mb-4 p-4 text-sm text-[var(--muted)]">
          سازمان/شعبه برای این کاربر مشخص نیست — سفارشی نمایش داده نمی‌شود.
        </Panel>
      ) : null}
      <DataTable
        headers={[
          "سفارش",
          "خریدار",
          "اقلام",
          "وزن",
          "مبلغ",
          "وضعیت",
          "تاریخ",
          "موعد",
        ]}
        empty={ready && !error ? "سفارشی ثبت نشده." : "در انتظار داده…"}
        rows={visible.map((o) => [
          <span key={`${o.id}-c`} data-ltr className="font-semibold">
            {o.code}
          </span>,
          o.retailer,
          formatNumber(o.items),
          formatWeight(o.totalWeight),
          formatMoney(o.value),
          <OrderStatusBadge key={`${o.id}-s`} status={o.status} />,
          o.createdAt,
          o.eta,
        ])}
      />
    </div>
  );
}
