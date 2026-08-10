"use client";

import React, { useState } from "react";
import { formatNumber } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Button, Field, Badge } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ActionModal } from "@/components/action-modal";
import { useToast } from "@/components/toast";
import { Tag, Plus, Percent, CheckCircle } from "lucide-react";

export default function CommercePromotionsPage() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [promoName, setPromoName] = useState("");
  const [discountPercent, setDiscountPercent] = useState("۲٪ تخفیف اجرت");

  const [promos, setPromos] = useState([
    { id: "p-1", name: "تخفیف ویژه گالری‌های ممتاز", discount: "۲٪ کسر از اجرت ساخت", target: "خرده‌فروشان VIP", status: "active" },
    { id: "p-2", name: "کمپین بنکداران تهرانی", discount: "۱.۵٪ کسر اجرت عمده", target: "بنکداران", status: "active" },
    { id: "p-3", name: "پروموشن اعیاد مذهبی", discount: "۳٪ کسر اجرت سفارش بالای ۵۰ گرم", target: "عموم ذینفعان", status: "draft" },
  ]);

  const handleCreate = () => {
    if (!promoName.trim()) {
      toast("عنوان پروموشن را وارد کنید", "warn");
      return;
    }
    setPromos((prev) => [
      ...prev,
      { id: `p-${Date.now()}`, name: promoName.trim(), discount: discountPercent, target: "خرده‌فروشان", status: "active" },
    ]);
    toast("جشنواره و پروموشن جدید فعال گردید");
    setModalOpen(false);
    setPromoName("");
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="موتور پروموشن و جشنواره‌های تخفیف اجرت (Promotions Engine)"
        description="تعریف تخفیف بر روی اجرت ساخت، پروموشن‌های حجمی سفارش طلا و تخفیف‌های ویژه گالری‌ها."
        action={
          <Button onClick={() => setModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>تعریف پروموشن جدید</span>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="پروموشن‌های فعال" value={formatNumber(promos.filter((p) => p.status === "active").length)} />
        <Stat label="میزان کسر اجرت متوسط" value="۲.۱٪" hint="از سود اجرت کاتالوگ" />
        <Stat label="گالری‌های بهره‌مند" value="۱۸ گالری" />
      </div>

      <Panel className="p-4">
        <DataTable
          headers={["عنوان پروموشن", "میزان تخفیف / مشوق", "جامعه هدف", "وضعیت"]}
          rows={promos.map((p) => [
            <div key={`${p.id}-n`} className="flex items-center gap-2 font-semibold">
              <Tag className="w-4 h-4 text-amber-500" />
              <span>{p.name}</span>
            </div>,
            p.discount,
            p.target,
            <Badge key={`${p.id}-st`} tone={p.status === "active" ? "ok" : "neutral"}>
              {p.status === "active" ? "فعال" : "پیش‌نویس"}
            </Badge>,
          ])}
        />
      </Panel>

      <ActionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="تعریف جشنواره و تخفیف اجرت جدید"
        description="تنظیم درصد کسر از اجرت برای سفارش‌های عمده گالری‌ها."
        confirmLabel="فعال‌سازی پروموشن"
        onConfirm={handleCreate}
      >
        <div className="space-y-4">
          <Field label="عنوان پروموشن">
            <input className="field min-h-11" value={promoName} onChange={(e) => setPromoName(e.target.value)} placeholder="مثال: تخفیف بهاره گالری‌های مشهد" />
          </Field>
          <Field label="میزان تخفیف / مشوق اجرت">
            <input className="field min-h-11" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="مثال: ۲.۵٪ کسر اجرت" />
          </Field>
        </div>
      </ActionModal>
    </div>
  );
}
