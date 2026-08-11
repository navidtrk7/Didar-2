"use client";

import React, { useState } from "react";
import { usePlatform } from "@/context/platform-context";
import { formatNumber, formatWeight } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Button, Field, Badge } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ActionModal } from "@/components/action-modal";
import { useToast } from "@/components/toast";
import { useSession } from "@/context/session-context";
import { Plus, Package, CheckCircle, Clock } from "lucide-react";

export default function ProductSkusPage() {
  const { skus, addSku } = usePlatform();
  const { role } = useSession();
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [skuCode, setSkuCode] = useState("");
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("2.5");
  const [karat, setKarat] = useState("18");
  const [category, setCategory] = useState("انگشتر");
  const [wageFee, setWageFee] = useState("150000");

  const handleCreate = async () => {
    if (!name.trim() || !skuCode.trim()) {
      toast("کد SKU و نام محصول را وارد کنید", "warn");
      return;
    }
    try {
      await addSku({
        skuCode: skuCode.trim(),
        name: name.trim(),
        catalogWeight: Number(weight),
        karat: (Number(karat) || 18) as 18 | 21 | 22 | 24,
        category: (category as any) || "ring",
        collection: "اصلی",
        imageUrl: "",
        status: "awaiting_qc",
      } as any);
      toast("محصول جدید ایجاد و به صف QC ارسال گردید");
      setModalOpen(false);
      setSkuCode("");
      setName("");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در ایجاد SKU", "warn");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="تعریف محصول و مدیریت SKUها"
        description="ثبت شناسه فنی کاتالوگ، عیار، وزن استاندارد و فرمول اجرت محصولات طلا."
        action={
          <Button onClick={() => setModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>تعریف SKU جدید</span>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="کل SKUها" value={formatNumber(skus.length)} />
        <Stat label="در انتظار QC" value={formatNumber(skus.filter((s) => s.status === "awaiting_qc").length)} />
        <Stat label="تایید شده" value={formatNumber(skus.filter((s) => s.status === "approved").length)} hint="آماده صدور UID" />
      </div>

      <Panel className="p-4">
        <DataTable
          headers={["کد SKU", "نام محصول", "دسته‌بندی", "وزن کاتالوگ", "عیار", "وضعیت"]}
          rows={skus.map((s) => [
            <span key={`${s.id}-c`} className="font-mono text-xs text-amber-600 font-bold" data-ltr>
              {s.skuCode || (s as any).code}
            </span>,
            s.name,
            s.category || "طلا",
            formatWeight(s.catalogWeight),
            `${s.karat} عیار`,
            <Badge
              key={`${s.id}-st`}
              tone={s.status === "approved" ? "ok" : s.status === "awaiting_qc" ? "warn" : "neutral"}
            >
              {s.status === "approved" ? "تایید شده" : s.status === "awaiting_qc" ? "در انتظار QC" : "پیش‌نویس"}
            </Badge>,
          ])}
        />
      </Panel>

      <ActionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="تعریف SKU جدید محصول"
        description="مشخصات فنی و وزن استاندارد محصول برای ورود به چرخه کنترل کیفیت."
        confirmLabel="ثبت و ارسال به QC"
        onConfirm={() => void handleCreate()}
      >
        <div className="space-y-4">
          <Field label="کد SKU (شناسه فنی)">
            <input className="field min-h-11 font-mono" value={skuCode} onChange={(e) => setSkuCode(e.target.value)} placeholder="SKU-18K-RING-01" dir="ltr" />
          </Field>

          <Field label="نام محصول">
            <input className="field min-h-11" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: انگشتر طلا طرح زمرد" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="وزن کاتالوگ (گرم)">
              <input className="field min-h-11 font-mono" value={weight} onChange={(e) => setWeight(e.target.value)} dir="ltr" />
            </Field>

            <Field label="عیار">
              <select className="field min-h-11" value={karat} onChange={(e) => setKarat(e.target.value)}>
                <option value="18">۱۸ عیار (۷۵۰)</option>
                <option value="24">۲۴ عیار (۹۹۹)</option>
              </select>
            </Field>
          </div>

          <Field label="اجرت هر گرم (تومان)">
            <input className="field min-h-11 font-mono" value={wageFee} onChange={(e) => setWageFee(e.target.value)} dir="ltr" />
          </Field>
        </div>
      </ActionModal>
    </div>
  );
}
