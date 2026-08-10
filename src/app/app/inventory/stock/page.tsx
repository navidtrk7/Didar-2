"use client";

import { usePlatform } from "@/context/platform-context";
import { formatNumber, formatWeight } from "@/lib/utils";
import { inventoryTypeLabels } from "@/data/labels";
import { DataTable } from "@/components/data-table";
import { Badge, Panel, SectionHeader, Stat } from "@/components/ui";

/** Inventory domain — location stock projection from live platform/API. */
export default function InventoryStockPage() {
  const { inventory, apiMode } = usePlatform();
  const totalAvailable = inventory.reduce((s, i) => s + i.availableGrams, 0);
  const totalReserved = inventory.reduce((s, i) => s + i.reservedGrams, 0);

  return (
    <div>
      <SectionHeader
        title="موجودی موقعیت‌ها"
        description="موجود، رزرو و قابل سفارش در هر موقعیت حضانت — از دادهٔ زندهٔ سامانه."
      />
      {!apiMode ? (
        <Panel className="mb-4 p-4 text-sm text-amber-950 bg-amber-50">
          حالت آفلاین — اعداد ممکن است آزمایشی باشند. برای دادهٔ واقعی API را وصل کنید.
        </Panel>
      ) : null}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="موجود قابل سفارش" value={formatWeight(totalAvailable)} />
        <Stat label="رزرو شده" value={formatWeight(totalReserved)} />
        <Stat label="موقعیت‌ها" value={formatNumber(inventory.length)} />
      </div>

      <DataTable
        headers={[
          "موقعیت",
          "نوع",
          "تعداد قلم",
          "وزن کل",
          "رزرو",
          "قابل سفارش",
          "بهره‌برداری",
        ]}
        rows={inventory.map((row) => [
          row.location,
          <Badge key={row.id} tone="neutral">
            {inventoryTypeLabels[row.type] ?? row.type}
          </Badge>,
          formatNumber(row.pieces),
          formatWeight(row.weightGrams),
          formatWeight(row.reservedGrams),
          formatWeight(row.availableGrams),
          `${row.utilization}٪`,
        ])}
        empty="موجودی موقعیتی ثبت نشده."
      />
    </div>
  );
}
