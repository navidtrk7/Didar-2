"use client";

import { useEffect, useState } from "react";
import { DomainOverviewPage } from "@/components/domain-overview";
import { DataTable } from "@/components/data-table";
import { ActionModal } from "@/components/action-modal";
import { Badge, Button, Field, Panel, Stat } from "@/components/ui";
import { useToast } from "@/components/toast";
import { apiEnabled, didarApi } from "@/lib/api";
import { formatMoney, formatWeight } from "@/lib/utils";

type Row = {
  id: string;
  code: string;
  producer: string;
  weight_grams: number;
  amount_irr: number;
  status: string;
  period_label: string;
  created_at: string;
  settled_at?: string | null;
  zarrin_ref?: string | null;
  zarrin_status?: string | null;
};

export default function FinanceSettlementsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [producer, setProducer] = useState("آتلیه نوا");
  const [weight, setWeight] = useState("100");
  const [amount, setAmount] = useState("0");
  const [period, setPeriod] = useState("ماه جاری");
  const [quoteNote, setQuoteNote] = useState("");
  const [quoting, setQuoting] = useState(false);

  const load = async () => {
    if (!apiEnabled()) return;
    try {
      setRows((await didarApi.listProducerSettlements()) as Row[]);
    } catch (e) {
      setRows([]);
      toast(e instanceof Error ? e.message : "بارگذاری تسویه ناموفق", "warn");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshQuote = async (w: string) => {
    const grams = Number(w);
    if (!apiEnabled() || !Number.isFinite(grams) || grams <= 0) {
      setQuoteNote("");
      return;
    }
    setQuoting(true);
    try {
      const q = await didarApi.producerSettlementQuote(grams);
      setAmount(String(q.amount_irr));
      setQuoteNote(q.note);
    } catch (e) {
      setQuoteNote("");
      toast(e instanceof Error ? e.message : "پیشنهاد مبلغ ناموفق", "warn");
    } finally {
      setQuoting(false);
    }
  };

  const create = async () => {
    try {
      await didarApi.createProducerSettlement({
        producer,
        weight_grams: Number(weight),
        amount_irr: Number(amount) || 0,
        period_label: period,
      });
      await load();
      setOpen(false);
      toast("تسویه تولیدکننده ثبت شد");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  const settle = async (id: string) => {
    try {
      await didarApi.settleProducerSettlement(id);
      await load();
      toast("در آداپتر زرین ثبت شد (+ دفتر دوگانه دیدار)");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  const pending = rows.filter((r) => r.status === "pending");

  return (
    <DomainOverviewPage
      domainId="finance"
      title="تسویه تولیدکننده"
      description="دامنه مالی · ثبت تسویه از مسیر آداپتر زرین (حالت تست تا دریافت API)."
      actions={
        apiEnabled() ? (
          <Button
            onClick={() => {
              setOpen(true);
              void refreshQuote(weight);
            }}
          >
            تسویه جدید
          </Button>
        ) : undefined
      }
    >
      <Panel className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-[var(--muted)]">
          «ثبت در زرین» همان payload تولیدی را به آداپتر می‌فرستد؛ الان حالت test است.
        </p>
        <Badge tone="warn">Zarrin adapter · test</Badge>
      </Panel>
      {!apiEnabled() ? (
        <Panel className="mb-4 p-5 text-sm text-[var(--muted)]">
          API دامنه مالی لازم است.
        </Panel>
      ) : null}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Stat label="در انتظار" value={String(pending.length)} />
        <Stat label="کل" value={String(rows.length)} />
      </div>
      <DataTable
        headers={["کد", "تولیدکننده", "وزن", "مبلغ", "زرین", "وضعیت", ""]}
        rows={rows.map((r) => [
          <span key={r.id} data-ltr>
            {r.code}
          </span>,
          r.producer,
          formatWeight(r.weight_grams),
          formatMoney(r.amount_irr / 10),
          <span key={`${r.id}-z`} data-ltr className="font-mono text-xs">
            {r.zarrin_ref || "—"}
          </span>,
          <Badge key={`${r.id}-s`} tone={r.status === "settled" ? "ok" : "warn"}>
            {r.status}
          </Badge>,
          r.status === "pending" ? (
            <Button
              key={`${r.id}-a`}
              className="min-h-11 px-3 py-2 text-xs"
              onClick={() => void settle(r.id)}
            >
              ثبت در زرین
            </Button>
          ) : (
            r.settled_at ?? "—"
          ),
        ])}
        empty="تسویه‌ای ثبت نشده."
      />
      <ActionModal
        open={open}
        onClose={() => setOpen(false)}
        title="تسویه تولیدکننده"
        description="وزن را وارد کنید تا مبلغ پیشنهادی پر شود (۰ = پیشنهاد سرور)."
        confirmLabel="ثبت"
        onConfirm={() => void create()}
      >
        <div className="space-y-3">
          <Field label="تولیدکننده">
            <input
              className="field"
              value={producer}
              onChange={(e) => setProducer(e.target.value)}
            />
          </Field>
          <Field label="وزن (گرم)">
            <input
              className="field"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              onBlur={() => void refreshQuote(weight)}
              dir="ltr"
            />
          </Field>
          <Field label="مبلغ (ریال)">
            <input
              className="field"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              dir="ltr"
            />
          </Field>
          <p className="text-xs text-[var(--muted)]">
            {quoting ? "در حال محاسبه…" : quoteNote || " "}
          </p>
          <Field label="دوره">
            <input
              className="field"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </Field>
        </div>
      </ActionModal>
    </DomainOverviewPage>
  );
}
