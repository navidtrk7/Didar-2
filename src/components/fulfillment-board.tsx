"use client";

import { useMemo, useState } from "react";
import { usePlatform } from "@/context/platform-context";
import type { Delivery, DeliveryStatus } from "@/data/types";
import { formatNumber, formatWeight } from "@/lib/utils";
import { DataTable } from "@/components/data-table";
import { DeliveryStatusBadge } from "@/components/status";
import { ActionModal } from "@/components/action-modal";
import { Badge, Button, Field, Panel, SectionHeader, Stat } from "@/components/ui";
import { useToast } from "@/components/toast";
import { apiEnabled, didarApi } from "@/lib/api";

const STAGE_NEXT_LABEL: Partial<Record<DeliveryStatus, string>> = {
  scheduled: "شروع برداشت",
  picking: "تأیید بسته‌بندی",
  packing: "تحویل به ایجنت",
  handover: "آماده‌سازی کد تأیید",
};

function normalizeStage(status: DeliveryStatus): DeliveryStatus {
  if (status === "en_route") return "awaiting_otp";
  if (status === "scheduled") return "picking";
  return status;
}

export function FulfillmentBoard({
  title,
  description,
  filterStage,
  showCreate,
  allowAdvance,
  allowOtp,
}: {
  title: string;
  description: string;
  filterStage?: DeliveryStatus;
  showCreate?: boolean;
  allowAdvance?: boolean;
  allowOtp?: boolean;
}) {
  const { toast } = useToast();
  const { deliveries, proformas, refresh, error } = usePlatform();
  const [otpOpen, setOtpOpen] = useState<string | null>(null);
  const [shipOpen, setShipOpen] = useState(false);
  const [proformaId, setProformaId] = useState("");

  const issued = useMemo(
    () => proformas.filter((p) => p.status === "issued"),
    [proformas],
  );

  const rows = useMemo(() => {
    if (!filterStage) return deliveries;
    const target = normalizeStage(filterStage);
    return deliveries.filter((d) => normalizeStage(d.status) === target);
  }, [deliveries, filterStage]);

  const counts = useMemo(() => {
    const c = {
      picking: 0,
      packing: 0,
      handover: 0,
      awaiting_otp: 0,
      completed: 0,
    };
    for (const d of deliveries) {
      const s = normalizeStage(d.status);
      if (s in c) c[s as keyof typeof c] += 1;
    }
    return c;
  }, [deliveries]);

  const advance = async (id: string) => {
    try {
      if (apiEnabled()) {
        await didarApi.advanceFulfillment(id);
        await refresh();
      } else {
        toast("برای پیشبرد مرحله، اتصال به سرویس را فعال کنید", "warn");
        return;
      }
      toast("مرحله پیش رفت");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در پیشبرد", "warn");
    }
  };

  const confirmOtp = async (id: string) => {
    try {
      if (!apiEnabled()) {
        toast("برای تأیید کد، اتصال به سرویس را فعال کنید", "warn");
        return;
      }
      await didarApi.confirmDeliveryOtp(id, "1234");
      await refresh();
      setOtpOpen(null);
      toast("تحویل با کد 1234 تأیید شد.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در تأیید", "warn");
    }
  };

  const createShip = async () => {
    if (!proformaId) {
      toast("پیش‌فاکتور را انتخاب کنید", "warn");
      return;
    }
    try {
      await didarApi.createDelivery(proformaId);
      await refresh();
      setShipOpen(false);
      toast("حواله در مرحله برداشت ایجاد شد");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در ایجاد تحویل", "warn");
    }
  };

  const canAdvance = (d: Delivery) => {
    const raw = d.status;
    // Prefer exact stage label; fall back after legacy alias normalize.
    return Boolean(
      allowAdvance &&
        (STAGE_NEXT_LABEL[raw] || STAGE_NEXT_LABEL[normalizeStage(raw)]),
    );
  };

  const advanceLabel = (d: Delivery) =>
    STAGE_NEXT_LABEL[d.status] ||
    STAGE_NEXT_LABEL[normalizeStage(d.status)] ||
    "مرحله بعد";

  const canOtp = (d: Delivery) =>
    Boolean(
      allowOtp &&
        (d.status === "awaiting_otp" || d.status === "en_route"),
    );

  return (
    <div>
      <SectionHeader
        title={title}
        description={description}
        action={
          showCreate && apiEnabled() ? (
            <Button
              variant="secondary"
              onClick={() => {
                setProformaId(issued[0]?.id ?? "");
                setShipOpen(true);
              }}
            >
              حواله از پیش‌فاکتور
            </Button>
          ) : null
        }
      />
      {error ? (
        <Panel className="mb-4 p-4 text-sm text-amber-950 bg-amber-50">
          داده زنده بارگذاری نشد: {error}
        </Panel>
      ) : null}

      {!filterStage ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Stat label="برداشت" value={String(counts.picking)} />
          <Stat label="بسته‌بندی" value={String(counts.packing)} />
          <Stat label="تحویل به ایجنت" value={String(counts.handover)} />
          <Stat label="منتظر کد تأیید" value={String(counts.awaiting_otp)} />
          <Stat label="تکمیل" value={String(counts.completed)} />
        </div>
      ) : null}

      <DataTable
        headers={["کد", "ایجنت", "مسیر", "اقلام", "وزن", "زمان", "وضعیت", ""]}
        rows={rows.map((d) => [
          <span key={`${d.id}-c`} data-ltr className="font-semibold">
            {d.code}
          </span>,
          d.agent,
          `از ${d.from} به ${d.to}`,
          formatNumber(d.pieces),
          formatWeight(d.weightGrams),
          d.scheduledAt,
          <DeliveryStatusBadge key={`${d.id}-s`} status={d.status} />,
          <div key={`${d.id}-a`} className="flex flex-wrap gap-2">
            {canAdvance(d) ? (
              <Button
                className="min-h-11 px-3 py-2 text-xs"
                variant="secondary"
                onClick={() => void advance(d.id)}
              >
                {advanceLabel(d)}
              </Button>
            ) : null}
            {canOtp(d) ? (
              <Button
                className="min-h-11 px-3 py-2 text-xs"
                onClick={() => setOtpOpen(d.id)}
              >
                تأیید کد دمو
              </Button>
            ) : null}
            {d.otpRequired &&
            (d.status === "awaiting_otp" || d.status === "en_route") ? (
              <Badge tone="warn">کد دمو · 1234</Badge>
            ) : null}
          </div>,
        ])}
      />

      <ActionModal
        open={Boolean(otpOpen)}
        onClose={() => setOtpOpen(null)}
        title="تأیید تحویل"
        description="SMS واقعی هنوز وصل نیست. برای پایلوت کد دمو را بزنید: 1234"
        confirmLabel="تأیید با کد دمو 1234"
        onConfirm={() => {
          if (otpOpen) void confirmOtp(otpOpen);
        }}
      />

      <ActionModal
        open={shipOpen}
        onClose={() => setShipOpen(false)}
        title="ایجاد حواله تحقق سفارش"
        description="از پیش‌فاکتور صادرشده — از مرحله برداشت شروع می‌شود."
        confirmLabel="ایجاد حواله"
        onConfirm={() => void createShip()}
      >
        <Field label="پیش‌فاکتور">
          <select
            className="field"
            value={proformaId}
            onChange={(e) => setProformaId(e.target.value)}
          >
            {issued.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.retailer}
              </option>
            ))}
          </select>
        </Field>
      </ActionModal>
    </div>
  );
}
