"use client";

import { useState } from "react";
import { designs as designsSeed } from "@/data/mock";
import { designStatusLabels } from "@/data/labels";
import type { Design } from "@/data/types";
import { formatNumber, formatWeight } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { ActionModal } from "@/components/action-modal";
import { Badge, Button, Field, SectionHeader } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ProductSubnav } from "@/components/product-subnav";

export default function QcDesignsPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Design[]>(designsSeed);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const submit = () => {
    if (!name.trim()) {
      toast("نام طرح را وارد کنید", "warn");
      return;
    }
    setItems((prev) => [
      {
        id: `d-${Date.now()}`,
        name: name.trim(),
        producer: "خانه ساخت دیدار گلد",
        karat: 18,
        avgWeight: 5,
        capacityWeekly: 40,
        booked: 0,
        status: "review",
      },
      ...prev,
    ]);
    setOpen(false);
    setName("");
    toast("طرح برای بررسی ثبت شد");
  };

  return (
    <div>
      <SectionHeader
        title="طرح‌ها و ظرفیت"
        description="طرح‌های تولید برای بررسی و ورود به کاتالوگ."
        action={<Button onClick={() => setOpen(true)}>ثبت طرح</Button>}
      />
      <ProductSubnav />

      <DataTable
        headers={["طرح", "کارگاه", "عیار", "وزن میانگین", "ظرفیت", "وضعیت"]}
        rows={items.map((d) => [
          d.name,
          d.producer,
          `${d.karat}K`,
          formatWeight(d.avgWeight),
          `${formatNumber(d.booked)} / ${formatNumber(d.capacityWeekly)}`,
          <Badge
            key={d.id}
            tone={
              d.status === "live"
                ? "ok"
                : d.status === "review"
                  ? "warn"
                  : "neutral"
            }
          >
            {designStatusLabels[d.status]}
          </Badge>,
        ])}
      />

      <ActionModal
        open={open}
        onClose={() => setOpen(false)}
        title="ثبت طرح جدید"
        onConfirm={submit}
      >
        <Field label="نام طرح">
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
      </ActionModal>
    </div>
  );
}
