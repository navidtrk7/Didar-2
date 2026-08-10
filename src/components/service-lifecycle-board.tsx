"use client";

import { useEffect, useState } from "react";
import { DomainOverviewPage } from "@/components/domain-overview";
import { DataTable } from "@/components/data-table";
import { ActionModal } from "@/components/action-modal";
import { Badge, Button, Field, Panel, Stat } from "@/components/ui";
import { useToast } from "@/components/toast";
import { apiEnabled, didarApi } from "@/lib/api";
import { formatMoney } from "@/lib/utils";

type CaseRow = {
  id: string;
  uid: string;
  kind: string;
  status: string;
  claimant: string;
  notes: string;
  amount_irr: number;
  created_at: string;
  zarrin_ref?: string | null;
  zarrin_status?: string | null;
};

const kindLabel: Record<string, string> = {
  return: "مرجوعی",
  buyback: "بازخرید",
  secondary: "چرخه ثانویه",
};

export function ServiceLifecycleBoard({
  kind,
  title,
  description,
}: {
  kind: "return" | "buyback" | "secondary";
  title: string;
  description: string;
}) {
  const { toast } = useToast();
  const [rows, setRows] = useState<CaseRow[]>([]);
  const [open, setOpen] = useState(false);
  const [uid, setUid] = useState("");
  const [notes, setNotes] = useState("");
  const [amount, setAmount] = useState("0");
  const [quoteHint, setQuoteHint] = useState("");
  const [quoting, setQuoting] = useState(false);

  const load = async () => {
    if (!apiEnabled()) return;
    try {
      const data = (await didarApi.listServiceCases(kind)) as CaseRow[];
      setRows(data);
    } catch (e) {
      setRows([]);
      toast(e instanceof Error ? e.message : "بارگذاری پرونده‌ها ناموفق", "warn");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  const fetchBuybackQuote = async (value: string) => {
    if (kind !== "buyback" || !apiEnabled() || !value.trim()) {
      setQuoteHint("");
      return;
    }
    setQuoting(true);
    try {
      const q = await didarApi.buybackQuote(value.trim());
      setAmount(String(q.offer_irr));
      setQuoteHint(
        `${q.note} · فلز ${formatMoney(q.metal_irr / 10)} − اجرت ${formatMoney(q.craft_irr / 10)}`,
      );
    } catch (e) {
      setQuoteHint("");
      toast(e instanceof Error ? e.message : "پیشنهاد بازخرید ناموفق", "warn");
    } finally {
      setQuoting(false);
    }
  };

  const submit = async () => {
    if (!uid.trim()) {
      toast("UID الزامی است", "warn");
      return;
    }
    try {
      await didarApi.openServiceCase({
        uid: uid.trim(),
        kind,
        notes,
        amount_irr: Number(amount) || 0,
      });
      await load();
      setOpen(false);
      setUid("");
      setNotes("");
      setAmount("0");
      setQuoteHint("");
      toast(`${kindLabel[kind]} ثبت شد`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  const close = async (id: string) => {
    try {
      const closed = (await didarApi.closeServiceCase(id)) as CaseRow;
      await load();
      if (kind === "buyback") {
        toast(
          closed.zarrin_ref
            ? `بسته شد · زرین ${closed.zarrin_ref}`
            : "پرونده بسته شد (+ آداپتر زرین)",
        );
      } else {
        toast("پرونده بسته شد");
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  return (
    <DomainOverviewPage
      domainId="service"
      title={title}
      description={description}
      actions={
        apiEnabled() ? (
          <Button
            onClick={() => {
              setOpen(true);
              setQuoteHint("");
            }}
          >
            ثبت {kindLabel[kind]}
          </Button>
        ) : undefined
      }
    >
      <Panel className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-sm text-[var(--muted)]">
          {kind === "buyback"
            ? "فقط UID با وضعیت delivered. پیشنهاد نرخ از فلز − اجرت؛ با «بستن» در آداپتر زرین (test) و دفتر دوگانه ثبت می‌شود و قطعه به خزانه برمی‌گردد."
            : "ثبت پرونده خدمات — مسیر مالی کامل هنوز برای همهٔ انواع یکسان نیست."}
        </p>
        <Badge tone="warn">
          {kind === "buyback" ? "Zarrin adapter · test" : "دستی / در حال تکمیل"}
        </Badge>
      </Panel>
      {!apiEnabled() ? (
        <Panel className="mb-4 p-5 text-sm text-[var(--muted)]">
          برای ثبت پرونده، اتصال به سرویس را فعال کنید.
        </Panel>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Stat label="باز" value={String(rows.filter((r) => r.status === "open").length)} />
        <Stat label="کل" value={String(rows.length)} />
      </div>

      <DataTable
        headers={
          kind === "buyback"
            ? ["UID", "وضعیت", "مبلغ", "زرین", "یادداشت", "زمان", ""]
            : ["UID", "وضعیت", "مبلغ", "یادداشت", "زمان", ""]
        }
        rows={rows.map((r) => {
          const base = [
            <span key={r.id} data-ltr className="font-mono text-xs">
              {r.uid}
            </span>,
            <Badge key={`${r.id}-s`} tone={r.status === "open" ? "warn" : "ok"}>
              {r.status}
            </Badge>,
            formatMoney(r.amount_irr / 10),
          ];
          const zarrinCol =
            kind === "buyback"
              ? [
                  <span key={`${r.id}-z`} data-ltr className="font-mono text-xs">
                    {r.zarrin_ref || "—"}
                  </span>,
                ]
              : [];
          const rest = [
            r.notes || "—",
            r.created_at,
            r.status === "open" ? (
              <Button
                key={`${r.id}-c`}
                className="min-h-11 px-3 py-2 text-xs"
                variant="secondary"
                onClick={() => void close(r.id)}
              >
                {kind === "buyback" ? "بستن → زرین" : "بستن"}
              </Button>
            ) : (
              "—"
            ),
          ];
          return [...base, ...zarrinCol, ...rest];
        })}
        empty="پرونده‌ای نیست."
      />

      <ActionModal
        open={open}
        onClose={() => setOpen(false)}
        title={`ثبت ${kindLabel[kind]}`}
        description={
          kind === "buyback"
            ? "UID باید delivered باشد. با بستن پرونده، آداپتر زرین صدا زده می‌شود."
            : "روی شناسه کالا اثر خدمات اعمال می‌شود."
        }
        confirmLabel="ثبت"
        onConfirm={() => void submit()}
      >
        <div className="space-y-3">
          <Field label="UID">
            <input
              className="field"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
              onBlur={() => void fetchBuybackQuote(uid)}
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
          {kind === "buyback" ? (
            <p className="text-xs text-[var(--muted)]">
              {quoting
                ? "در حال محاسبه پیشنهاد…"
                : quoteHint || "با ترک فیلد UID پیشنهاد خودکار پر می‌شود (۰ = پیشنهاد سرور)."}
            </p>
          ) : null}
          <Field label="یادداشت">
            <input
              className="field"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>
      </ActionModal>
    </DomainOverviewPage>
  );
}
