"use client";

import React from "react";
import { usePlatform } from "@/context/platform-context";
import { formatNumber } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Button, Badge } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { useToast } from "@/components/toast";
import { Package, CheckSquare } from "lucide-react";

export default function FulfillmentPickingPage() {
  const platform = usePlatform() as any;
  const fulfillmentTasks = platform.fulfillmentTasks || [];
  const advanceFulfillmentTask = platform.advanceFulfillmentTask || (async () => {});
  const tasks = fulfillmentTasks || [];
  const { toast } = useToast();

  const handlePick = async (id: string) => {
    try {
      await advanceFulfillmentTask(id);
      toast("بسته با موفقیت برداشت (Pick) و آماده تحویل به ایجنت گردید");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در برداشت", "warn");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="صف برداشت و پکینگ فیزیکی (Pick & Pack Queue)"
        description="برداشت فیزیکی قطعات طلا پلمب‌شده از گاوصندوق انبار و بسته‌بندی در کیف امنیتی."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="کل ماموریت‌های پکینگ" value={formatNumber(tasks.length)} />
        <Stat label="در حال برداشت" value={formatNumber(tasks.filter((t: any) => t.status === "picking").length)} hint="نیاز به تایید انباردار" />
        <Stat label="آماده تحویل به ایجنت" value={formatNumber(tasks.filter((t: any) => t.status === "handover").length)} />
      </div>

      <Panel className="p-4">
        <DataTable
          headers={["کد مرجع سفارش", "گیرنده / گالری", "شناسه طلا DDR", "وضعیت پکینگ", "عملیات برداشت"]}
          rows={tasks.map((t: any) => [
            <span key={`${t.id}-ord`} className="font-mono text-xs text-amber-600 font-bold" data-ltr>
              {t.orderId}
            </span>,
            t.recipientName,
            <span key={`${t.id}-u`} className="font-mono text-xs" data-ltr>
              {t.uid}
            </span>,
            <Badge key={`${t.id}-st`} tone={t.status === "picking" ? "warn" : "ok"}>
              {t.status === "picking" ? "در حال برداشت از گاوصندوق" : "بسته‌بندی شده"}
            </Badge>,
            t.status === "picking" ? (
              <Button
                key={`${t.id}-act`}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1"
                onClick={() => void handlePick(t.id)}
              >
                <CheckSquare className="w-3.5 h-3.5 inline ml-1" />
                تایید برداشت و پکینگ
              </Button>
            ) : (
              "—"
            ),
          ])}
        />
      </Panel>
    </div>
  );
}
