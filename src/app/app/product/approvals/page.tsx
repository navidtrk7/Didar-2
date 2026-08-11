"use client";

import React from "react";
import { usePlatform } from "@/context/platform-context";
import { formatNumber, formatWeight } from "@/lib/utils";
import { SectionHeader, Panel, Badge, Button } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { useToast } from "@/components/toast";
import { CheckCircle2, ShieldAlert } from "lucide-react";

export default function ProductApprovalsPage() {
  const { skus } = usePlatform();
  const { toast } = useToast();

  const handleApprove = (skuCode: string) => {
    toast(`محصول ${skuCode} با موفقیت تایید نهایی شد و آماده صدور UID پلمب گردید.`);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="صف تایید نهایی کاتالوگ (Product Approvals)"
        description="تایید نهایی مشخصات فنی، شناسنامه طلا و عیار توسط مدیر کاتالوگ قبل از صدور بارکد DDR."
      />

      <Panel className="p-4">
        <DataTable
          headers={["کد SKU", "نام محصول", "وزن کاتالوگ", "عیار", "وضعیت QC", "تایید نهایی"]}
          rows={skus.map((s) => [
            <span key={`${s.id}-code`} className="font-mono text-xs text-amber-600 font-bold" data-ltr>
              {s.skuCode || (s as any).code}
            </span>,
            s.name,
            formatWeight(s.catalogWeight),
            `${s.karat} عیار`,
            <Badge key={`${s.id}-qc`} tone="ok">
              QC پاس شده
            </Badge>,
            <Button
              key={`${s.id}-app`}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1"
              onClick={() => handleApprove(s.skuCode || (s as any).code)}
            >
              <CheckCircle2 className="w-3.5 h-3.5 inline ml-1" />
              تایید ورود به کاتالوگ
            </Button>,
          ])}
        />
      </Panel>
    </div>
  );
}
