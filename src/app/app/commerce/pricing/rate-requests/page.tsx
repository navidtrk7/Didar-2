"use client";

import { useState } from "react";
import { usePlatform } from "@/context/platform-context";
import { rateRequestStatusLabels } from "@/data/labels";
import { resolveGoldRate } from "@/lib/gold-rate";
import { formatMoney } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { ActionModal } from "@/components/action-modal";
import { Badge, Button, Field, SectionHeader } from "@/components/ui";
import { DataTable } from "@/components/data-table";

export default function RateRequestsPage() {
  const { toast } = useToast();
  const { rateRequests, addRateRequest, decideRateRequest, liveGoldPrice } =
    usePlatform();
  const goldRate = resolveGoldRate(liveGoldPrice);
  const [open, setOpen] = useState(false);
  const [proposed, setProposed] = useState("");
  const [reason, setReason] = useState("نوسانات شدید ارزی غیررسمی");

  const submit = () => {
    const rate = Number(proposed);
    if (!Number.isFinite(rate) || rate <= 0) {
      toast("نرخ پیشنهادی معتبر نیست", "warn");
      return;
    }
    addRateRequest({
      currentRate: goldRate,
      proposedRate: rate,
      reason,
      requestedBy: "نیما شریفی",
      validUntil: "پایان شیفت",
    });
    setOpen(false);
    setProposed("");
    toast("درخواست تغییر نرخ ثبت شد");
  };

  return (
    <div>
      <SectionHeader
        title="درخواست تغییر دستی نرخ"
        description="تا تأیید مدیر، نرخ بازار مبنای محاسبات است."
        action={<Button onClick={() => setOpen(true)}>درخواست جدید</Button>}
      />

      <DataTable
        headers={["نرخ فعلی", "پیشنهادی", "دلیل", "وضعیت", "عملیات"]}
        rows={rateRequests.map((r) => [
          formatMoney(r.currentRate),
          formatMoney(r.proposedRate),
          r.reason,
          <Badge
            key={`${r.id}-s`}
            tone={
              r.status === "pending"
                ? "warn"
                : r.status === "approved"
                  ? "ok"
                  : "danger"
            }
          >
            {rateRequestStatusLabels[r.status]}
          </Badge>,
          r.status === "pending" ? (
            <div key={`${r.id}-a`} className="flex gap-1">
              <Button
                className="min-h-11 px-3 py-2 text-xs"
                onClick={() => {
                  void (async () => {
                    try {
                      await decideRateRequest(r.id, "approved");
                      toast("نرخ تأیید شد");
                    } catch (e) {
                      toast(
                        e instanceof Error ? e.message : "خطا در تأیید",
                        "warn",
                      );
                    }
                  })();
                }}
              >
                تأیید
              </Button>
              <Button
                variant="secondary"
                className="min-h-11 px-3 py-2 text-xs"
                onClick={() => {
                  void (async () => {
                    try {
                      await decideRateRequest(r.id, "rejected");
                      toast("درخواست رد شد");
                    } catch (e) {
                      toast(
                        e instanceof Error ? e.message : "خطا در رد درخواست",
                        "warn",
                      );
                    }
                  })();
                }}
              >
                رد
              </Button>
            </div>
          ) : (
            "—"
          ),
        ])}
      />

      <ActionModal
        open={open}
        onClose={() => setOpen(false)}
        title="ثبت درخواست تغییر نرخ"
        onConfirm={submit}
      >
        <p className="mb-3 text-sm text-[var(--muted)]">
          نرخ فعلی: {formatMoney(goldRate)} تومان
        </p>
        <Field label="نرخ پیشنهادی (تومان / گرم)">
          <input
            className="field"
            type="number"
            value={proposed}
            onChange={(e) => setProposed(e.target.value)}
            dir="ltr"
          />
        </Field>
        <Field label="دلیل">
          <select
            className="field"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option>نوسانات شدید ارزی غیررسمی</option>
            <option>اصلاح خطای سیستمی</option>
            <option>دستور مستقیم مدیریت ارشد</option>
            <option>تنظیم رقابتی بازار منطقه</option>
          </select>
        </Field>
      </ActionModal>
    </div>
  );
}
