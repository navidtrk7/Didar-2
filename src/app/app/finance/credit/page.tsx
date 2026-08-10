"use client";

import { useMemo, useState } from "react";
import { usePlatform } from "@/context/platform-context";
import { formatMoney, formatNumber, formatWeight } from "@/lib/utils";
import { ActionModal } from "@/components/action-modal";
import { Badge, Button, Field, Panel, SectionHeader, Stat } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { useToast } from "@/components/toast";
import { apiEnabled, didarApi } from "@/lib/api";

const CHANNELS: { id: string; label: string }[] = [
  { id: "verbal", label: "شفاهی" },
  { id: "phone", label: "تلفنی" },
  { id: "cash", label: "نقد" },
  { id: "transfer", label: "کارت‌به‌کارت / واریز" },
];

const channelLabel = (id?: string | null) =>
  CHANNELS.find((c) => c.id === id)?.label || id || "—";

export default function FinanceCreditPage() {
  const { toast } = useToast();
  const { creditAccounts, creditDocuments, refresh, error } = usePlatform();
  const overdue1_30 = creditDocuments
    .filter((d) => d.overdueDays > 0 && d.overdueDays <= 30)
    .reduce((s, d) => s + d.amountIrr, 0);
  const overdue30 = creditDocuments
    .filter((d) => d.overdueDays > 30)
    .reduce((s, d) => s + d.amountIrr, 0);
  const used = creditAccounts.reduce((s, c) => s + c.usedIrr, 0);

  const [settleId, setSettleId] = useState<string | null>(null);
  const [channel, setChannel] = useState("phone");
  const [notes, setNotes] = useState("");
  const [dealOpen, setDealOpen] = useState(false);
  const [dealRetailer, setDealRetailer] = useState("");
  const [dealAmount, setDealAmount] = useState("");
  const [dealWeight, setDealWeight] = useState("");
  const [dealChannel, setDealChannel] = useState("verbal");
  const [dealNotes, setDealNotes] = useState("");

  const retailers = useMemo(
    () => creditAccounts.map((c) => c.retailer),
    [creditAccounts],
  );

  const settleDoc = creditDocuments.find((d) => d.id === settleId);

  const openSettle = (id: string) => {
    setSettleId(id);
    setChannel("phone");
    setNotes("");
  };

  const confirmSettle = async () => {
    if (!settleId) return;
    try {
      if (!apiEnabled()) {
        toast("API فعال نیست", "warn");
        return;
      }
      await didarApi.settleCreditDocument(settleId, {
        channel,
        notes,
      });
      await refresh();
      setSettleId(null);
      toast(`تسویه ${channelLabel(channel)} ثبت شد (زرین نیست).`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در تسویه", "warn");
    }
  };

  const createDeal = async () => {
    if (!dealRetailer) {
      toast("خرده‌فروش را انتخاب کنید", "warn");
      return;
    }
    try {
      await didarApi.openTrustCreditDeal({
        retailer: dealRetailer,
        amount_irr: Math.round(Number(dealAmount) || 0),
        weight_grams: Number(dealWeight) || 0,
        origin_channel: dealChannel,
        notes: dealNotes,
        due_date: "توافقی",
      });
      await refresh();
      setDealOpen(false);
      setDealAmount("");
      setDealWeight("");
      setDealNotes("");
      toast("توافق اعتماد ثبت شد — هنوز تسویه نشده.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در ثبت توافق", "warn");
    }
  };

  return (
    <div>
      <SectionHeader
        title="اعتبار، توافق اعتماد و مطالبات"
        description="تسویه تلفنی/شفاهی/نقد جدا از زرین است. توافق ≠ پرداخت ≠ جابه‌جایی طلا."
        action={
          apiEnabled() ? (
            <Button
              onClick={() => {
                setDealRetailer(retailers[0] ?? "");
                setDealOpen(true);
              }}
            >
              ثبت توافق تلفنی / شفاهی
            </Button>
          ) : undefined
        }
      />
      {error ? (
        <Panel className="mb-4 p-4 text-sm text-amber-950 bg-amber-50">
          داده زنده بارگذاری نشد: {error}
        </Panel>
      ) : null}

      <Panel className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm leading-7 text-[var(--muted)]">
          در بازار طلا ایران بسیاری از تسویه‌ها تلفنی یا شفاهی است. اینجا همان را با
          کانال و یادداشت ثبت می‌کنیم — نه به‌عنوان پرداخت زرین.
        </p>
        <Badge tone="warn">اعتماد · نه درگاه</Badge>
      </Panel>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="اعتبار مصرفی" value={formatMoney(used / 10)} />
        <Stat
          label="معوق ۱–۳۰ روز"
          value={formatMoney(overdue1_30 / 10)}
        />
        <Stat label="معوق بیش از ۳۰ روز" value={formatMoney(overdue30 / 10)} />
      </div>

      <DataTable
        headers={[
          "خرده‌فروش",
          "سقف (گرم)",
          "مصرف",
          "معوق",
          "وضعیت",
        ]}
        rows={creditAccounts.map((c) => [
          c.retailer,
          formatWeight(c.ceilingGrams),
          formatWeight(c.usedGrams),
          formatWeight(c.overdueGrams),
          <Badge key={c.id} tone={c.blocked ? "danger" : "ok"}>
            {c.blocked ? "مسدود" : "عادی"}
          </Badge>,
        ])}
      />

      <div className="mt-8">
        <SectionHeader title="اسناد اعتباری / توافق‌ها" />
        <DataTable
          headers={[
            "سند",
            "فروشگاه",
            "مبلغ",
            "وزن",
            "منشأ",
            "تسویه",
            "تاخیر",
            "وضعیت",
            "",
          ]}
          rows={creditDocuments.map((d) => [
            <span key={d.id} data-ltr>
              {d.code}
            </span>,
            d.retailer,
            formatMoney(d.amountIrr / 10),
            formatWeight(d.weightGrams),
            channelLabel(d.originChannel),
            d.status === "settled"
              ? channelLabel(d.settlementChannel)
              : "—",
            formatNumber(d.overdueDays),
            <Badge
              key={`${d.id}-s`}
              tone={
                d.status === "settled"
                  ? "ok"
                  : d.status === "overdue"
                    ? "danger"
                    : "warn"
              }
            >
              {d.status === "settled"
                ? "تسویه"
                : d.status === "overdue"
                  ? "معوق"
                  : "باز"}
            </Badge>,
            d.status !== "settled" ? (
              <Button
                key={`${d.id}-a`}
                className="min-h-11 px-3 py-2 text-xs"
                onClick={() => openSettle(d.id)}
              >
                تسویه با کانال
              </Button>
            ) : (
              <span key={`${d.id}-n`} className="text-xs text-[var(--muted)]">
                {d.settlementNotes || d.settledAt || "—"}
              </span>
            ),
          ])}
        />
      </div>

      <ActionModal
        open={Boolean(settleId)}
        onClose={() => setSettleId(null)}
        title="تسویه اعتماد"
        description={
          settleDoc
            ? `${settleDoc.code} · ${settleDoc.retailer} — این زرین نیست.`
            : "کانال تسویه را مشخص کنید."
        }
        confirmLabel="ثبت تسویه"
        onConfirm={() => void confirmSettle()}
      >
        <div className="space-y-3">
          <Field label="کانال تسویه">
            <select
              className="field"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            >
              {CHANNELS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="یادداشت (مثلاً تأیید با … ساعت …)">
            <input
              className="field"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="تأیید تلفنی با آقای …"
            />
          </Field>
        </div>
      </ActionModal>

      <ActionModal
        open={dealOpen}
        onClose={() => setDealOpen(false)}
        title="ثبت توافق اعتماد"
        description="توافق شفاهی/تلفنی = مطالبه باز. هنوز پرداخت نشده."
        confirmLabel="ثبت توافق"
        onConfirm={() => void createDeal()}
      >
        <div className="space-y-3">
          <Field label="خرده‌فروش">
            <select
              className="field"
              value={dealRetailer}
              onChange={(e) => setDealRetailer(e.target.value)}
            >
              {retailers.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="کانال توافق">
            <select
              className="field"
              value={dealChannel}
              onChange={(e) => setDealChannel(e.target.value)}
            >
              {CHANNELS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="مبلغ (ریال)">
            <input
              className="field"
              value={dealAmount}
              onChange={(e) => setDealAmount(e.target.value)}
              dir="ltr"
              inputMode="numeric"
            />
          </Field>
          <Field label="وزن (گرم)">
            <input
              className="field"
              value={dealWeight}
              onChange={(e) => setDealWeight(e.target.value)}
              dir="ltr"
              inputMode="decimal"
            />
          </Field>
          <Field label="یادداشت">
            <input
              className="field"
              value={dealNotes}
              onChange={(e) => setDealNotes(e.target.value)}
              placeholder="توافق تلفنی روی نرخ قفل‌شده …"
            />
          </Field>
        </div>
      </ActionModal>
    </div>
  );
}
