"use client";

import React, { useState } from "react";
import { usePlatform } from "@/context/platform-context";
import { formatNumber, formatWeight } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Button, Badge } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { useToast } from "@/components/toast";
import { AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";

export default function InventoryDiscrepanciesPage() {
  const platform = usePlatform();
  const rawDiscs = platform.discrepancies || [];
  const resolveDiscrepancy = platform.resolveDiscrepancy;
  const { toast } = useToast();

  const handleResolve = async (id: string) => {
    if (!resolveDiscrepancy) return;
    try {
      await resolveDiscrepancy(id, "تراز انبار و کسر از مانده به علت اختلاف ترازو");
      toast("مغایرت انبار برطرف و سند مالی تسویه صادر شد");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در رفع مغایرت", "warn");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="مغایرت‌های انبار و وزن (Warehouse Discrepancies)"
        description="ثبت، بررسی و رفع مغایرت وزنی و کسری طلا در تحویل یا انبارگردانی."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="کل موارد مغایرت" value={formatNumber(rawDiscs.length)} />
        <Stat label="مغایرت‌های باز" value={formatNumber(rawDiscs.filter((d) => d.status === "open").length)} hint="نیازمند بررسی مدیر انبار" />
        <Stat label="حل شده" value={formatNumber(rawDiscs.filter((d) => d.status === "resolved").length)} />
      </div>

      <Panel className="p-4">
        <DataTable
          headers={["شناسه طلا DDR", "وزن متداول", "وزن سنجش‌شده", "اختلاف (گرم)", "علت", "وضعیت", "عملیات"]}
          rows={rawDiscs.map((d) => [
            <span key={`${d.id}-u`} className="font-mono text-xs text-amber-600 font-bold" data-ltr>
              {d.uid}
            </span>,
            formatWeight(d.expectedWeight),
            formatWeight(d.measuredWeight),
            <span key={`${d.id}-d`} className="font-mono text-xs text-rose-600 font-bold" data-ltr>
              {d.deltaGrams.toFixed(3)}g
            </span>,
            d.reason,
            <Badge key={`${d.id}-st`} tone={d.status === "open" ? "danger" : "ok"}>
              {d.status === "open" ? "باز (کسری)" : "برطرف شده"}
            </Badge>,
            d.status === "open" ? (
              <Button
                key={`${d.id}-act`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2.5 py-1"
                onClick={() => void handleResolve(d.id)}
              >
                تراز و رفع مغایرت
              </Button>
            ) : (
              "—"
            ),
          ])}
          empty="هیچ مغایرت انباری ثبت نشده است."
        />
      </Panel>
    </div>
  );
}
