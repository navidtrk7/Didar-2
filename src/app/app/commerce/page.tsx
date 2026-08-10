"use client";

import { useMemo, useState } from "react";
import { usePlatform } from "@/context/platform-context";
import { useSession } from "@/context/session-context";
import { useWorkspace } from "@/context/workspace-context";
import { formatMoney, formatNumber, formatWeight } from "@/lib/utils";
import {
  DomainLinkButton,
  DomainOverviewPage,
} from "@/components/domain-overview";
import { WorkJourney } from "@/components/work-journey";
import { Button, Panel, Stat } from "@/components/ui";
import { DeliveryStatusBadge, OrderStatusBadge } from "@/components/status";
import { DataTable } from "@/components/data-table";
import { useToast } from "@/components/toast";
import { apiEnabled, didarApi } from "@/lib/api";
import { roleHasPermission } from "@/data/domains";
import type { Delivery } from "@/data/types";

function AgentCommerceHome() {
  const { toast } = useToast();
  const { user } = useSession();
  const { activeHat } = useWorkspace();
  const {
    issuedAssets,
    proformas,
    creditAccounts,
    deliveries,
    refresh,
    assets: platformAssets,
  } = usePlatform();
  const [localDone, setLocalDone] = useState<Set<string>>(new Set());

  const mine = useMemo(() => {
    const agentName = user?.name;
    return deliveries
      .filter((d) => {
        if (!agentName) return true;
        // Own gallery handoffs + warehouse-chained order shipments in queue
        return (
          d.agent === agentName ||
          d.agent === "صف تحقق" ||
          d.agent === "سیستم" ||
          ["awaiting_otp", "en_route", "handover"].includes(d.status)
        );
      })
      .map((d) =>
        localDone.has(d.id)
          ? ({ ...d, status: "completed" } satisfies Delivery)
          : d,
      );
  }, [deliveries, localDone, user?.name]);

  const gallery = platformAssets.filter((a) => a.location.includes("گالری"));
  const awaiting = mine.find((d) => d.status === "awaiting_otp");
  const issuedToday = proformas.filter((p) => p.status === "issued").length;
  const mobileWeight =
    gallery.reduce((s, a) => s + a.weightGrams, 0) +
    issuedAssets
      .filter((a) => (a.location ?? "").includes("گالری"))
      .reduce((s, a) => s + a.weightGrams, 0);

  const confirmDelivery = async () => {
    if (!awaiting) return;
    try {
      if (apiEnabled()) {
        await didarApi.confirmDeliveryOtp(awaiting.id, "1234");
        await refresh();
      } else {
        setLocalDone((prev) => new Set(prev).add(awaiting.id));
      }
      toast(`تحویل ${awaiting.code} تأیید شد.`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "تأیید تحویل ناموفق بود", "warn");
    }
  };

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="وزن گالری سیار" value={formatWeight(mobileWeight)} />
        <Stat label="پیش‌فاکتور صادر" value={formatNumber(issuedToday)} />
        <Stat
          label="خرده‌فروش فعال"
          value={formatNumber(creditAccounts.length)}
        />
        <Stat label="تحویل‌های من" value={formatNumber(mine.length)} />
      </div>

      {awaiting ? (
        <Panel className="mb-6 flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <p className="text-sm font-semibold">منتظر تأیید تحویل</p>
            <p className="mt-1 text-sm text-[var(--muted)]" data-ltr>
              {awaiting.code} · {awaiting.to}
            </p>
          </div>
          <Button onClick={() => void confirmDelivery()}>تأیید با کد</Button>
        </Panel>
      ) : null}

      <DataTable
        headers={["کد", "مسیر", "وضعیت"]}
        rows={mine.slice(0, 5).map((d) => [
          <span key={d.id} data-ltr>
            {d.code}
          </span>,
          `از ${d.from} به ${d.to}`,
          <DeliveryStatusBadge key={`${d.id}-s`} status={d.status} />,
        ])}
        empty="تحویلی ثبت نشده."
      />

      <p className="mt-4 text-xs text-[var(--muted)]">
        محل کار: {activeHat?.partyName ?? user?.org ?? "—"}
      </p>
    </>
  );
}

function RetailerCommerceHome() {
  const { user } = useSession();
  const { activeHat } = useWorkspace();
  const { proformas, creditAccounts, orders, assets: platformAssets } =
    usePlatform();
  const org = activeHat?.partyName ?? user?.org ?? "";
  const mine = orders.filter((o) => !org || o.retailer === org);
  const available = platformAssets.filter((a) => a.status === "available");
  const credit = creditAccounts.find((c) => c.retailer === org);
  const myProformas = proformas.filter((p) => !org || p.retailer === org);

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="سفارش‌های باز"
          value={formatNumber(
            mine.filter((o) => !["delivered", "cancelled"].includes(o.status))
              .length,
          )}
        />
        <Stat
          label="پیش‌فاکتور فعال"
          value={formatNumber(myProformas.length)}
        />
        <Stat
          label="اعتبار قابل استفاده"
          value={
            credit
              ? formatWeight(credit.ceilingGrams - credit.usedGrams)
              : "—"
          }
        />
        <Stat
          label="موجود در کاتالوگ"
          value={formatNumber(available.length)}
        />
      </div>

      {myProformas[0] ? (
        <Panel className="mb-6 p-5">
          <p className="text-sm text-[var(--muted)]">آخرین پیش‌فاکتور</p>
          <p className="mt-1 font-semibold" data-ltr>
            {myProformas[0].code}
          </p>
          <p className="text-sm text-[var(--muted)]">
            {formatMoney(myProformas[0].totalIrr)} · {myProformas[0].createdAt}
          </p>
          <Button
            href="/app/commerce/orders"
            variant="secondary"
            className="mt-3"
          >
            سفارش‌ها و پیش‌فاکتورها
          </Button>
        </Panel>
      ) : null}

      <DataTable
        headers={["سفارش", "وزن", "مبلغ", "وضعیت"]}
        rows={mine.slice(0, 5).map((o) => [
          <span key={o.id} data-ltr>
            {o.code}
          </span>,
          formatWeight(o.totalWeight),
          formatMoney(o.value),
          <OrderStatusBadge key={`${o.id}-s`} status={o.status} />,
        ])}
        empty="سفارشی نیست."
      />
    </>
  );
}

export default function CommerceDomainPage() {
  const { role } = useSession();
  const canPricing = roleHasPermission(role, "commerce.pricing");
  const canProforma = roleHasPermission(role, "commerce.proforma");
  const canOrder = roleHasPermission(role, "commerce.order");
  const canDeliver = roleHasPermission(role, "fulfillment.deliver");

  const links =
    role === "agent" ? (
      <>
        {canProforma ? (
          <DomainLinkButton href="/app/commerce/proforma">پیش‌فاکتور</DomainLinkButton>
        ) : null}
        <DomainLinkButton href="/app/commerce/gallery">گالری سیار</DomainLinkButton>
        {canOrder ? (
          <DomainLinkButton href="/app/commerce/orders">سفارش‌ها</DomainLinkButton>
        ) : null}
        {canDeliver ? (
          <DomainLinkButton href="/app/fulfillment/delivery">
            تحویل نهایی
          </DomainLinkButton>
        ) : null}
      </>
    ) : role === "retailer" ? (
      <>
        <DomainLinkButton href="/app/retailer/catalog">کاتالوگ</DomainLinkButton>
        {canOrder ? (
          <DomainLinkButton href="/app/commerce/orders">سفارش‌ها</DomainLinkButton>
        ) : null}
        <DomainLinkButton href="/app/retailer/inventory">
          موجودی شعبه
        </DomainLinkButton>
        <DomainLinkButton href="/app/retailer/credit">اعتبار</DomainLinkButton>
      </>
    ) : (
      <>
        {canPricing ? (
          <DomainLinkButton href="/app/commerce/pricing">قیمت‌گذاری</DomainLinkButton>
        ) : null}
        {canProforma ? (
          <DomainLinkButton href="/app/commerce/proforma">پیش‌فاکتور</DomainLinkButton>
        ) : null}
        {canProforma ? (
          <DomainLinkButton href="/app/commerce/gallery">گالری سیار</DomainLinkButton>
        ) : null}
        {canOrder ? (
          <DomainLinkButton href="/app/commerce/orders">سفارش‌ها</DomainLinkButton>
        ) : null}
        {canPricing ? (
          <DomainLinkButton href="/app/product/catalog">کاتالوگ</DomainLinkButton>
        ) : null}
      </>
    );

  return (
    <div>
      <WorkJourney role={role} />
      <DomainOverviewPage
        domainId="commerce"
        title="تجارت"
        description="سفارش، قیمت، گالری و پیش‌فاکتور — یک موتور فروش برای ایجنت و خرده‌فروش."
        actions={<div className="flex flex-wrap gap-2">{links}</div>}
      >
        {role === "agent" ? <AgentCommerceHome /> : null}
        {role === "retailer" ? <RetailerCommerceHome /> : null}
        {role !== "agent" && role !== "retailer" ? (
          <Panel className="p-5 text-sm leading-7 text-[var(--muted)]">
            از منوی بالا یا دکمه‌های میانبر وارد بخش موردنظر شوید. جریان کامل
            فروش در نوار «جریان کار طلا» دیده می‌شود.
          </Panel>
        ) : null}
      </DomainOverviewPage>
    </div>
  );
}
