"use client";

import { useState } from "react";
import { usePlatform } from "@/context/platform-context";
import { categoryLabels } from "@/data/labels";
import { formatMoney, formatNumber } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { ActionModal } from "@/components/action-modal";
import { Badge, Button, Field, SectionHeader } from "@/components/ui";
import { DataTable } from "@/components/data-table";

export default function PricingRulesPage() {
  const { toast } = useToast();
  const { craftRules, toggleCraftRule, addCraftRule } = usePlatform();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("15");

  const add = () => {
    if (!name.trim()) {
      toast("نام قانون را وارد کنید", "warn");
      return;
    }
    addCraftRule({
      name: name.trim(),
      category: "ring",
      method: "percent",
      value: Number(value) || 10,
      active: true,
    });
    setOpen(false);
    setName("");
    toast("قانون اجرت افزوده شد");
  };

  return (
    <div>
      <SectionHeader
        title="قوانین اجرت"
        description="قوانین درصدی یا ثابت به ازای هر گرم."
        action={<Button onClick={() => setOpen(true)}>قانون جدید</Button>}
      />

      <DataTable
        headers={["نام", "دسته", "متد", "مقدار", "وضعیت", "عملیات"]}
        rows={craftRules.map((r) => [
          r.name,
          categoryLabels[r.category as keyof typeof categoryLabels] ??
            r.category,
          r.method === "percent" ? "درصدی" : "ثابت / گرم",
          r.method === "percent"
            ? `${formatNumber(r.value)}٪`
            : formatMoney(r.value),
          <Badge key={`${r.id}-s`} tone={r.active ? "ok" : "neutral"}>
            {r.active ? "فعال" : "غیرفعال"}
          </Badge>,
          <Button
            key={`${r.id}-t`}
            variant="secondary"
            className="min-h-11 px-3 py-2 text-xs"
            onClick={() => {
              void (async () => {
                try {
                  await toggleCraftRule(r.id);
                  toast("وضعیت قانون بروزرسانی شد");
                } catch (e) {
                  toast(
                    e instanceof Error ? e.message : "خطا در بروزرسانی قانون",
                    "warn",
                  );
                }
              })();
            }}
          >
            {r.active ? "غیرفعال" : "فعال"}
          </Button>,
        ])}
      />

      <ActionModal
        open={open}
        onClose={() => setOpen(false)}
        title="قانون اجرت جدید"
        onConfirm={add}
      >
        <Field label="نام">
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="درصد اجرت">
          <input
            className="field"
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            dir="ltr"
          />
        </Field>
      </ActionModal>
    </div>
  );
}
