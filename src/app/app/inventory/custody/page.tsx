"use client";

import { useEffect, useMemo, useState } from "react";
import { usePlatform } from "@/context/platform-context";
import { DomainOverviewPage } from "@/components/domain-overview";
import { DataTable } from "@/components/data-table";
import { ActionModal } from "@/components/action-modal";
import { Badge, Button, Field, Panel, Stat } from "@/components/ui";
import { useToast } from "@/components/toast";
import { apiEnabled, didarApi } from "@/lib/api";

type Transfer = {
  id: string;
  uid: string;
  from_custodian: string;
  to_custodian: string;
  from_location: string;
  to_location: string;
  actor: string;
  created_at: string;
};

type Discrepancy = {
  id: string;
  uid: string;
  expected_weight: number;
  measured_weight: number;
  delta_grams: number;
  reason: string;
  status: string;
  actor: string;
  resolution_notes: string;
  created_at: string;
  resolved_at?: string | null;
};

type PartyOpt = { id: string; name: string; kind_label?: string };

const FALLBACK_DESTINATIONS = [
  "خزانه مرکزی",
  "گالری سیار شماره ۴",
  "انبار تحقق",
];

export default function InventoryCustodyPage() {
  const { toast } = useToast();
  const { issuedAssets, refresh } = usePlatform();
  const [rows, setRows] = useState<Transfer[]>([]);
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [parties, setParties] = useState<PartyOpt[]>([]);
  const [open, setOpen] = useState(false);
  const [discOpen, setDiscOpen] = useState(false);
  const [uid, setUid] = useState("");
  const [toCustodian, setToCustodian] = useState(FALLBACK_DESTINATIONS[0]);
  const [toLocation, setToLocation] = useState(FALLBACK_DESTINATIONS[0]);
  const [discUid, setDiscUid] = useState("");
  const [measured, setMeasured] = useState("");
  const [reason, setReason] = useState("اختلاف وزن در شمارش");

  const transferable = useMemo(
    () =>
      issuedAssets.filter((a) => {
        const status = a.status ?? "available";
        return ["available", "reserved", "in_transit", "picked", "packed"].includes(
          status,
        );
      }),
    [issuedAssets],
  );

  const destinations = useMemo(() => {
    const fromParties = parties.map((p) => p.name).filter(Boolean);
    const fromAssets = issuedAssets.map((a) => a.location).filter(Boolean);
    return Array.from(
      new Set([...fromParties, ...fromAssets, ...FALLBACK_DESTINATIONS]),
    );
  }, [parties, issuedAssets]);

  const load = async () => {
    if (!apiEnabled()) return;
    try {
      const [transfers, partyRows, discRows] = await Promise.all([
        didarApi.listCustody() as Promise<Transfer[]>,
        didarApi.listParties().catch(() => []) as Promise<PartyOpt[]>,
        didarApi.listDiscrepancies() as Promise<Discrepancy[]>,
      ]);
      setRows(transfers);
      setParties(partyRows);
      setDiscrepancies(discRows);
    } catch (e) {
      setRows([]);
      setDiscrepancies([]);
      toast(e instanceof Error ? e.message : "بارگذاری حضانت ناموفق", "warn");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async () => {
    if (!uid) {
      toast("UID را انتخاب کنید", "warn");
      return;
    }
    try {
      await didarApi.transferCustody({
        uid,
        to_custodian: toCustodian,
        to_location: toLocation,
      });
      await refresh();
      await load();
      setOpen(false);
      toast("حضانت منتقل شد");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  const submitDisc = async () => {
    if (!discUid) {
      toast("UID را انتخاب کنید", "warn");
      return;
    }
    const w = Number(measured);
    if (!Number.isFinite(w) || w <= 0) {
      toast("وزن اندازه‌گیری‌شده نامعتبر است", "warn");
      return;
    }
    try {
      await didarApi.openDiscrepancy({
        uid: discUid,
        measured_weight: w,
        reason,
      });
      await refresh();
      await load();
      setDiscOpen(false);
      toast("اختلاف ثبت شد — UID قفل شد");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  const resolveDisc = async (id: string, acceptMeasured: boolean) => {
    try {
      await didarApi.resolveDiscrepancy(id, {
        resolution: "resolved",
        notes: acceptMeasured ? "پذیرش وزن اندازه‌گیری‌شده" : "تایید وزن پلمپ",
        accept_measured: acceptMeasured,
      });
      await refresh();
      await load();
      toast("اختلاف بسته شد");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  const openDiscs = discrepancies.filter((d) => d.status === "open");

  return (
    <DomainOverviewPage
      domainId="inventory"
      title="حضانت (Custody)"
      description="انتقال حضانت و ثبت اختلاف فیزیکی UID."
      actions={
        apiEnabled() ? (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setUid(transferable[0]?.uid ?? "");
                const dest = destinations[0] ?? FALLBACK_DESTINATIONS[0];
                setToCustodian(dest);
                setToLocation(dest);
                setOpen(true);
              }}
            >
              انتقال حضانت
            </Button>
            <Button
              className="bg-[var(--surface)] text-[var(--ink)]"
              onClick={() => {
                const a = issuedAssets[0];
                setDiscUid(a?.uid ?? "");
                setMeasured(a ? String(a.weightGrams) : "");
                setDiscOpen(true);
              }}
            >
              ثبت اختلاف
            </Button>
          </div>
        ) : undefined
      }
    >
      {!apiEnabled() ? (
        <Panel className="mb-4 p-5 text-sm text-[var(--muted)]">
          Custody روی API دامنه موجودی است.
        </Panel>
      ) : null}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Stat label="انتقال‌ها" value={String(rows.length)} />
        <Stat label="اختلاف باز" value={String(openDiscs.length)} />
      </div>

      <h3 className="mb-3 text-sm font-medium">اختلاف فیزیکی</h3>
      <DataTable
        headers={["UID", "انتظار", "اندازه‌گیری", "Δ", "وضعیت", ""]}
        rows={discrepancies.map((d) => [
          <span key={d.id} data-ltr className="font-mono text-xs">
            {d.uid}
          </span>,
          `${d.expected_weight}g`,
          `${d.measured_weight}g`,
          `${d.delta_grams > 0 ? "+" : ""}${d.delta_grams.toFixed(3)}g`,
          <Badge key={`${d.id}-s`} tone={d.status === "open" ? "warn" : "ok"}>
            {d.status}
          </Badge>,
          d.status === "open" ? (
            <div key={`${d.id}-a`} className="flex flex-wrap gap-1">
              <Button
                className="min-h-11 px-2 py-1 text-xs"
                onClick={() => void resolveDisc(d.id, false)}
              >
                تایید پلمپ
              </Button>
              <Button
                className="min-h-11 bg-[var(--surface)] px-2 py-1 text-xs text-[var(--ink)]"
                onClick={() => void resolveDisc(d.id, true)}
              >
                پذیرش وزن جدید
              </Button>
            </div>
          ) : (
            d.resolved_at ?? "—"
          ),
        ])}
        empty="اختلافی ثبت نشده."
      />

      <h3 className="mb-3 mt-8 text-sm font-medium">انتقال حضانت</h3>
      <DataTable
        headers={["UID", "از", "به", "موقعیت جدید", "عامل", "زمان"]}
        rows={rows.map((r) => [
          <span key={r.id} data-ltr className="font-mono text-xs">
            {r.uid}
          </span>,
          r.from_custodian,
          r.to_custodian,
          r.to_location,
          r.actor,
          r.created_at,
        ])}
        empty="هنوز انتقال حضانتی ثبت نشده."
      />

      <ActionModal
        open={open}
        onClose={() => setOpen(false)}
        title="انتقال حضانت"
        description="فقط UIDهای در گردش — مقصد از شبکه/موقعیت‌های شناخته‌شده."
        confirmLabel="ثبت انتقال"
        onConfirm={() => void submit()}
      >
        <div className="space-y-3">
          <Field label="UID">
            <select
              className="field"
              value={uid}
              onChange={(e) => setUid(e.target.value)}
            >
              {transferable.length === 0 ? (
                <option value="">UID قابل انتقال نیست</option>
              ) : null}
              {transferable.map((a) => (
                <option key={a.id} value={a.uid}>
                  {a.uid} — {a.name} ({a.location})
                </option>
              ))}
            </select>
          </Field>
          <Field label="حضانت مقصد">
            <select
              className="field"
              value={toCustodian}
              onChange={(e) => {
                setToCustodian(e.target.value);
                setToLocation(e.target.value);
              }}
            >
              {destinations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="موقعیت مقصد">
            <select
              className="field"
              value={toLocation}
              onChange={(e) => setToLocation(e.target.value)}
            >
              {destinations.map((d) => (
                <option key={`loc-${d}`} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </ActionModal>

      <ActionModal
        open={discOpen}
        onClose={() => setDiscOpen(false)}
        title="ثبت اختلاف فیزیکی"
        description="UID قفل می‌شود تا اختلاف بسته شود."
        confirmLabel="ثبت اختلاف"
        onConfirm={() => void submitDisc()}
      >
        <div className="space-y-3">
          <Field label="UID">
            <select
              className="field"
              value={discUid}
              onChange={(e) => {
                setDiscUid(e.target.value);
                const a = issuedAssets.find((x) => x.uid === e.target.value);
                if (a) {
                  setMeasured(String(a.weightGrams));
                }
              }}
            >
              {issuedAssets.length === 0 ? (
                <option value="">UID موجود نیست</option>
              ) : null}
              {issuedAssets.map((a) => (
                <option key={a.id} value={a.uid}>
                  {a.uid} — {a.name} ({a.status})
                </option>
              ))}
            </select>
          </Field>
          <Field label="وزن اندازه‌گیری‌شده (گرم)">
            <input
              className="field"
              value={measured}
              onChange={(e) => setMeasured(e.target.value)}
              dir="ltr"
            />
          </Field>
          <Field label="علت">
            <input
              className="field"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </Field>
        </div>
      </ActionModal>
    </DomainOverviewPage>
  );
}
