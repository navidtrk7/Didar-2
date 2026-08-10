"use client";

import React from "react";
import { usePlatform } from "@/context/platform-context";
import { formatNumber, formatWeight } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Badge } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ShieldCheck, Warehouse, Lock } from "lucide-react";

export default function InventoryVaultPage() {
  const platform = usePlatform();
  const rawSealed = platform.sealedItems || [];
  const rawIssued = platform.issuedAssets || [];

  const items = rawSealed.length > 0
    ? rawSealed
    : rawIssued.map((a) => ({
        uid: a.uid,
        weight: a.weightGrams || 2.15,
        skuName: a.skuName || "طلا ۱۸ عیار",
      }));

  const totalVaultWeight = items.reduce((acc, item) => acc + (item.weight || 2.15), 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="انبار مرکزی و خزانه امن دیدار (Central Vault Inventory)"
        description="مدیریت موجودی فیزیکی، پلمب‌های امنیتی و گاوصندوق‌های مکانیزه خزانه مرکزی طلا."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="تعداد اقلام فیزیکی موجود" value={formatNumber(items.length)} hint="پلمب شده با شناسه DDR" />
        <Stat label="وزن کل طلا در خزانه" value={formatWeight(totalVaultWeight)} hint="طلا ۱۸ عیار استاندارد" />
        <Stat label="وضعیت گاوصندوق مرکزی" value="امن / پلمب" hint="پایش ۲۴ ساعته سنسورها" />
      </div>

      <Panel className="p-4 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-[var(--line)]">
          <h3 className="font-bold text-base text-[var(--ink)] flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-amber-500" />
            <span>موجودی فیزیکی در گاوصندوق مرکزی</span>
          </h3>
          <Badge tone="ok" className="text-xs">خزانه پلاک ۱</Badge>
        </div>

        <DataTable
          headers={["شناسه پلمب DDR", "محصول", "وزن دقیق", "موقعیت در خزانه", "وضعیت قفل"]}
          rows={items.map((item, idx) => [
            <span key={`${item.uid}-u`} className="font-mono text-xs text-amber-600 font-bold" data-ltr>
              {item.uid}
            </span>,
            item.skuName || "طلا ۱۸ عیار",
            formatWeight(item.weight || 2.15),
            `قفسه A-${(idx % 5) + 1} / ردیف ${idx + 1}`,
            <Badge key={`${item.uid}-st`} tone="ok" className="flex items-center gap-1">
              <Lock className="w-3 h-3 inline" />
              پلمب پلاستیک امنیتی
            </Badge>,
          ])}
          empty="اقلامی در خزانه موجود نیست."
        />
      </Panel>
    </div>
  );
}
