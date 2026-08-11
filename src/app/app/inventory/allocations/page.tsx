"use client";

import React, { useState } from "react";
import { usePlatform } from "@/context/platform-context";
import { formatNumber, formatWeight } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Button, Field, Badge } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ActionModal } from "@/components/action-modal";
import { useToast } from "@/components/toast";
import { Briefcase, Plus, Send, ShieldCheck } from "lucide-react";

export default function InventoryAllocationsPage() {
  const platform = usePlatform() as any;
  const rawSealed = platform.sealedItems || [];
  const rawIssued = platform.issuedAssets || [];

  const items = rawSealed.length > 0
    ? rawSealed
    : rawIssued.map((a: any) => ({
        uid: a.uid,
        weight: a.weightGrams || 2.15,
        skuName: a.skuName || a.name || "طلا ۱۸ عیار",
      }));

  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("نوید محمدی (ایجنت منطقه ۱)");
  const [selectedUid, setSelectedUid] = useState("");

  const handleAllocate = () => {
    toast(`شناسه ${selectedUid || "طلا DDR"} با موفقیت به سبد سیار ${selectedAgent} تخصیص یافت.`);
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="تخصیص موجودی و سبد سیار (Mobile Bag Allocations)"
        description="تخصیص اقلام پلمب‌شده به ایجنت‌های منطقه جهت بازاریابی، نمایش به گالری‌ها و تحویل حضوری."
        action={
          <Button onClick={() => setModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>تخصیص جدید به سبد سیار</span>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="تعداد سبدهای سیار فعال" value="۴ سبد" hint="منطقه ۱، ۲، ۳ و بازار" />
        <Stat label="اقلام تخصیص یافته" value={formatNumber(items.length)} />
        <Stat label="وضعیت تحویل مسئولیت" value="تایید شده" hint="با فرم تحویل امضا شده" />
      </div>

      <Panel className="p-4">
        <DataTable
          headers={["ایجنت مسئول", "منطقه", "شناسه طلا DDR", "وزن تخصیصی", "تاریخ تخصیص", "وضعیت"]}
          rows={items.map((item: any, idx: number) => [
            idx % 2 === 0 ? "نوید محمدی" : "رضا کریمی",
            idx % 2 === 0 ? "منطقه ۱ (شمال)" : "بازار بزرگ طلا",
            <span key={`${item.uid}-u`} className="font-mono text-xs text-amber-600 font-bold" data-ltr>
              {item.uid}
            </span>,
            formatWeight(item.weight || 2.15),
            "۱۴۰۴/۱۱/۲۰",
            <Badge key={`${item.uid}-st`} tone="ok">
              در امانت ایجنت
            </Badge>,
          ])}
        />
      </Panel>

      <ActionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="تخصیص طلا به سبد سیار ایجنت"
        description="انتخاب شناسه طلا و انتقال مسئولیت فیزیکی به ایجنت همراه با ثبت فرم تحویل."
        confirmLabel="تایید تخصیص و صدور فرم"
        onConfirm={handleAllocate}
      >
        <div className="space-y-4">
          <Field label="ایجنت تحویل گیرنده">
            <select className="field min-h-11" value={selectedAgent} onChange={(e) => setSelectedAgent(e.target.value)}>
              <option value="نوید محمدی (ایجنت منطقه ۱)">نوید محمدی (ایجنت منطقه ۱)</option>
              <option value="رضا کریمی (ایجنت بازار بزرگ)">رضا کریمی (ایجنت بازار بزرگ)</option>
            </select>
          </Field>

          <Field label="شناسه طلا (UID DDR)">
            <select className="field min-h-11 font-mono" value={selectedUid} onChange={(e) => setSelectedUid(e.target.value)}>
              {items.map((item: any) => (
                <option key={item.uid} value={item.uid}>
                  {item.uid} — ({item.skuName || "طلا ۱۸ عیار"})
                </option>
              ))}
            </select>
          </Field>
        </div>
      </ActionModal>
    </div>
  );
}
