"use client";

import { useState } from "react";
import { usePlatform } from "@/context/platform-context";
import { formatMoney, formatWeight } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { ActionModal } from "@/components/action-modal";
import { Button, Field, Panel, SectionHeader } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { resolveGoldRate } from "@/lib/gold-rate";

export default function FinanceAdjustmentsPage() {
  const { toast } = useToast();
  const { adjustments, createAdjustment, liveGoldPrice, error } =
    usePlatform();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [weightDelta, setWeightDelta] = useState("0");
  const [pending, setPending] = useState(false);

  const rate = resolveGoldRate(liveGoldPrice);

  const submit = async () => {
    if (!reason.trim()) {
      toast("دلیل تعدیل الزامی است", "warn");
      return;
    }
    const w = Number(weightDelta);
    setPending(true);
    try {
      await createAdjustment({
        reason: reason.trim(),
        weightDelta: w,
        irrDelta: Math.round(w * rate * 10),
      });
      setOpen(false);
      setReason("");
      toast("سند تعدیل ثبت شد");
    } catch (e) {
      toast(e instanceof Error ? e.message : "ثبت تعدیل ناموفق بود", "warn");
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="اسناد تعدیل"
        description="تنها مسیر اصلاح دفتر قفل‌شده — ثبت سند تعدیلی."
        action={<Button onClick={() => setOpen(true)}>سند جدید</Button>}
      />
      {error ? (
        <Panel className="mb-4 p-4 text-sm text-amber-950 bg-amber-50">
          داده زنده بارگذاری نشد: {error}
        </Panel>
      ) : null}

      <Panel className="mb-6 p-4 text-sm text-[var(--muted)]">
        اسناد تعدیل خود دفتر اصلی را بازنویسی نمی‌کنند؛ به‌صورت لایه اصلاحی اضافه
        می‌شوند.
      </Panel>

      <DataTable
        headers={["کد", "دلیل", "Δ وزن", "Δ ریال", "ثبت‌کننده", "تاریخ"]}
        rows={adjustments.map((d) => [
          <span key={d.id} data-ltr>
            {d.code}
          </span>,
          d.reason,
          formatWeight(d.weightDelta),
          formatMoney(d.irrDelta / 10),
          d.createdBy,
          d.createdAt,
        ])}
      />

      <ActionModal
        open={open}
        onClose={() => setOpen(false)}
        title="ثبت سند تعدیل"
        onConfirm={() => void submit()}
        confirmLabel={pending ? "در حال ثبت…" : "ثبت"}
        busy={pending}
      >
        <Field label="دلیل">
          <input
            className="field"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <Field label="تغییر وزن (گرم)">
          <input
            className="field"
            type="number"
            step="0.01"
            value={weightDelta}
            onChange={(e) => setWeightDelta(e.target.value)}
            dir="ltr"
          />
        </Field>
      </ActionModal>
    </div>
  );
}
