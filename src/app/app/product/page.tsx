"use client";

import { usePlatform } from "@/context/platform-context";
import { formatNumber } from "@/lib/utils";
import { ProductSubnav } from "@/components/product-subnav";
import { WorkJourney } from "@/components/work-journey";
import { Badge, Button, Panel, SectionHeader, Stat } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { useSession } from "@/context/session-context";
import { roleHasPermission } from "@/data/domains";

export default function ProductOverviewPage() {
  const { role } = useSession();
  const { skus, qcQueue } = usePlatform();
  const canQc = roleHasPermission(role, "product.qc_approve");
  const canCreate = roleHasPermission(role, "product.sku_create");

  const draft = skus.filter((s) => s.status === "draft").length;
  const awaiting = skus.filter((s) => s.status === "awaiting_qc").length;
  const rework = skus.filter((s) => s.status === "needs_rework").length;
  const approved = skus.filter((s) => s.status === "approved").length;
  const pendingQueue = qcQueue.filter((q) => !q.result);

  return (
    <div>
      <WorkJourney role={role} compact />
      <SectionHeader
        title="محصول"
        description={
          canQc
            ? "کاتالوگ، بازرسی کیفی و آماده‌سازی برای صدور شناسه."
            : "کاتالوگ محصول و وضعیت ارسال به کنترل کیفیت."
        }
      />
      <ProductSubnav />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="پیش‌نویس" value={formatNumber(draft)} />
        <Stat label="منتظر QC" value={formatNumber(awaiting)} />
        <Stat label="نیازمند اصلاح" value={formatNumber(rework)} />
        <Stat label="تأییدشده" value={formatNumber(approved)} hint="آماده UID" />
      </div>

      <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-2">
        {canQc ? (
          <div className="min-w-0">
            <SectionHeader title="صف بازرسی" level={2} />
            <DataTable
              headers={["کد فیزیکی", "SKU", "وضعیت"]}
              rows={pendingQueue.map((q) => {
                const sku = skus.find((s) => s.id === q.skuId);
                return [
                  <span key={`${q.id}-c`} data-ltr className="font-mono text-xs">
                    {q.physicalCode}
                  </span>,
                  sku?.name ?? "—",
                  <Badge key={q.id} tone="warn" className="whitespace-nowrap">
                    در انتظار
                  </Badge>,
                ];
              })}
            />
          </div>
        ) : (
          <Panel className="p-5">
            <p className="text-sm font-semibold">وضعیت کاتالوگ</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
              <li>{draft} پیش‌نویس</li>
              <li>{awaiting} در انتظار بررسی QC</li>
              <li>{rework} نیازمند اصلاح</li>
              <li>{approved} تأییدشده</li>
            </ul>
            {canCreate ? (
              <Button href="/app/product/catalog" className="mt-5 w-full sm:w-auto">
                مدیریت کاتالوگ
              </Button>
            ) : null}
          </Panel>
        )}

        <Panel className="p-5">
          <p className="text-sm font-semibold">صندوق وظایف</p>
          <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--muted)]">
            {canCreate ? (
              <li>{draft} پیش‌نویس آماده ارسال به QC</li>
            ) : null}
            <li>{awaiting} کالا منتظر بررسی QC</li>
            <li>{rework} مورد نیازمند اصلاح کاتالوگ</li>
            <li>{approved} SKU آماده صدور UID در انبار</li>
          </ul>
          {canQc ? (
            <Button href="/app/product/qc" className="mt-5 w-full sm:w-auto">
              شروع بازرسی
            </Button>
          ) : canCreate ? (
            <Button href="/app/product/catalog" className="mt-5 w-full sm:w-auto">
              افزودن یا ارسال به QC
            </Button>
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
