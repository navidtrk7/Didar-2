"use client";

import { usePlatform } from "@/context/platform-context";
import { formatMoney, formatNumber, formatWeight } from "@/lib/utils";
import { orderStatusLabels } from "@/data/labels";
import { DataTable } from "@/components/data-table";
import { OrderStatusBadge } from "@/components/status";
import { Button, Panel, SectionHeader } from "@/components/ui";
import { useToast } from "@/components/toast";

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const { orders, error, ready } = usePlatform();

  const exportCsv = () => {
    const header = [
      "code",
      "retailer",
      "items",
      "weight",
      "value",
      "status",
      "createdAt",
      "eta",
    ];
    const rows = orders.map((o) =>
      [
        o.code,
        o.retailer,
        o.items,
        o.totalWeight,
        o.value,
        orderStatusLabels[o.status] ?? o.status,
        o.createdAt,
        o.eta,
      ].join(","),
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "didar-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast("فایل خروجی سفارش‌ها دانلود شد.");
  };

  return (
    <div>
      <SectionHeader
        title="سفارش‌ها"
        description="پیگیری سفارش‌ها از ثبت تا تحویل — داده زنده سامانه."
        action={
          <Button
            variant="secondary"
            onClick={exportCsv}
            disabled={!orders.length}
          >
            خروجی
          </Button>
        }
      />
      {error ? (
        <Panel className="mb-4 p-4 text-sm text-amber-950 bg-amber-50">
          داده زنده بارگذاری نشد: {error}
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
        empty={
          ready && !error
            ? "سفارشی ثبت نشده."
            : "در انتظار داده…"
        }
        rows={orders.map((o) => [
          <span key={`${o.id}-c`} className="font-semibold" data-ltr>
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
