"use client";

import { useEffect, useMemo, useState } from "react";
import { usePlatform } from "@/context/platform-context";
import { DomainOverviewPage } from "@/components/domain-overview";
import { DataTable } from "@/components/data-table";
import { ActionModal } from "@/components/action-modal";
import { Badge, Button, Field, Panel, Stat } from "@/components/ui";
import { useToast } from "@/components/toast";
import { apiEnabled, didarApi } from "@/lib/api";
import { formatWeight } from "@/lib/utils";

type AllocationRow = {
  id: string;
  uid: string;
  proforma_id?: string | null;
  order_id?: string | null;
  status: string;
  actor: string;
  created_at: string;
};

export default function InventoryAllocationPage() {
  const { toast } = useToast();
  const { issuedAssets, proformas, orders, refresh } = usePlatform();
  const [rows, setRows] = useState<AllocationRow[]>([]);
  const [open, setOpen] = useState(false);
  const [uid, setUid] = useState("");
  const [proformaId, setProformaId] = useState("");
  const [orderId, setOrderId] = useState("");

  const allocatable = useMemo(() => {
    const activeUids = new Set(
      rows.filter((r) => r.status === "active").map((r) => r.uid.toUpperCase()),
    );
    return issuedAssets.filter(
      (a) =>
        a.status === "available" &&
        !activeUids.has(a.uid.toUpperCase()),
    );
  }, [issuedAssets, rows]);

  const openProformas = useMemo(
    () => proformas.filter((p) => p.status === "issued"),
    [proformas],
  );
  const openOrders = useMemo(
    () =>
      orders.filter(
        (o) => !["delivered", "cancelled"].includes(o.status),
      ),
    [orders],
  );

  const load = async () => {
    if (!apiEnabled()) return;
    try {
      const data = (await didarApi.listAllocations()) as AllocationRow[];
      setRows(data);
    } catch (e) {
      setRows([]);
      toast(e instanceof Error ? e.message : "بارگذاری تخصیص ناموفق", "warn");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const allocate = async () => {
    if (!uid) {
      toast("UID را انتخاب کنید", "warn");
      return;
    }
    try {
      await didarApi.allocateUid(uid, {
        proforma_id: proformaId || undefined,
        order_id: orderId || undefined,
      });
      await refresh();
      await load();
      setOpen(false);
      setProformaId("");
      setOrderId("");
      toast("تخصیص ثبت شد");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در تخصیص", "warn");
    }
  };

  const release = async (id: string) => {
    try {
      await didarApi.releaseAllocation(id);
      await refresh();
      await load();
      toast("تخصیص آزاد شد");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در آزادسازی", "warn");
    }
  };

  const active = rows.filter((r) => r.status === "active");
  const docLabel = (r: AllocationRow) => {
    const bits = [
      r.proforma_id ? `PF:${r.proforma_id}` : null,
      r.order_id ? `ORD:${r.order_id}` : null,
    ].filter(Boolean);
    return bits.length ? bits.join(" · ") : "—";
  };

  return (
    <DomainOverviewPage
      domainId="inventory"
      title="تخصیص (Allocation)"
      description="رزرو UID برای سفارش/پیش‌فاکتور بدون خروج از حضانت — جدا از Asset.status خام."
      actions={
        apiEnabled() ? (
          <Button
            onClick={() => {
              setUid(allocatable[0]?.uid ?? "");
              setOpen(true);
            }}
          >
            تخصیص جدید
          </Button>
        ) : undefined
      }
    >
      {!apiEnabled() ? (
        <Panel className="mb-4 p-5 text-sm text-[var(--muted)]">
          Allocation روی API دامنه موجودی است. `NEXT_PUBLIC_API_URL` را تنظیم کنید.
        </Panel>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="تخصیص فعال" value={String(active.length)} />
        <Stat label="سوابق تخصیص" value={String(rows.length)} />
        <Stat label="UID آزاد (قابل تخصیص)" value={String(allocatable.length)} />
      </div>

      <DataTable
        headers={["UID", "سند", "وضعیت", "عامل", "زمان", ""]}
        rows={rows.map((r) => [
          <span key={r.id} data-ltr className="font-mono text-xs">
            {r.uid}
          </span>,
          <span key={`${r.id}-d`} data-ltr className="font-mono text-[11px]">
            {docLabel(r)}
          </span>,
          <Badge key={`${r.id}-s`} tone={r.status === "active" ? "warn" : "neutral"}>
            {r.status === "active" ? "فعال" : r.status === "released" ? "آزادشده" : r.status}
          </Badge>,
          r.actor,
          r.created_at,
          r.status === "active" ? (
            <Button
              key={`${r.id}-a`}
              className="min-h-11 px-3 py-2 text-xs"
              variant="secondary"
              onClick={() => void release(r.id)}
            >
              آزادسازی
            </Button>
          ) : (
            "—"
          ),
        ])}
        empty="هنوز تخصیصی ثبت نشده."
      />

      <ActionModal
        open={open}
        onClose={() => setOpen(false)}
        title="تخصیص UID"
        description="فقط UIDهای آزاد — می‌توانید به پیش‌فاکتور یا سفارش وصل کنید."
        confirmLabel="ثبت تخصیص"
        onConfirm={() => void allocate()}
      >
        <Field label="UID">
          <select
            className="field"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
          >
            {allocatable.length === 0 ? (
              <option value="">UID آزادی نیست</option>
            ) : null}
            {allocatable.map((a) => (
              <option key={a.id} value={a.uid}>
                {a.uid} — {a.name} ({formatWeight(a.weightGrams)})
              </option>
            ))}
          </select>
        </Field>
        <Field label="پیش‌فاکتور (اختیاری)">
          <select
            className="field"
            value={proformaId}
            onChange={(e) => setProformaId(e.target.value)}
          >
            <option value="">—</option>
            {openProformas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.retailer}
              </option>
            ))}
          </select>
        </Field>
        <Field label="سفارش (اختیاری)">
          <select
            className="field"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          >
            <option value="">—</option>
            {openOrders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.code} · {o.retailer}
              </option>
            ))}
          </select>
        </Field>
      </ActionModal>
    </DomainOverviewPage>
  );
}
