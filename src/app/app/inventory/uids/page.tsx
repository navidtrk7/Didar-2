"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePlatform } from "@/context/platform-context";
import type { SkuItem } from "@/data/types";
import { formatWeight } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { ActionModal } from "@/components/action-modal";
import { Badge, Button, Panel, SectionHeader, Stat } from "@/components/ui";
import { DataTable } from "@/components/data-table";

/** Inventory domain — UID seal / issue (canonical path). */
export default function InventoryUidsPage() {
  const { toast } = useToast();
  const { skus, issuedAssets, issueUid } = usePlatform();
  const [active, setActive] = useState<SkuItem | null>(null);
  const [lastUid, setLastUid] = useState<string | null>(null);

  const queue = useMemo(
    () =>
      skus.filter(
        (s) =>
          s.status === "approved" &&
          !issuedAssets.some((a) => a.skuId === s.id),
      ),
    [skus, issuedAssets],
  );

  const confirmIssue = async () => {
    if (!active) return;
    try {
      const uid = await issueUid(active.id);
      setActive(null);
      if (uid) {
        setLastUid(uid);
        toast(`UID صادر شد: ${uid}`);
      } else toast("صدور ممکن نبود", "warn");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در صدور UID", "warn");
    }
  };

  return (
    <div>
      <SectionHeader
        title="صدور UID"
        description="دامنه موجودی · پس از صدور، وزن و عیار قفل می‌شوند و کالا در حضانت خزانه قرار می‌گیرد."
      />

      {lastUid ? (
        <Panel className="mb-6 flex flex-wrap items-center justify-between gap-3 border-[var(--gold)]/30 p-4">
          <div>
            <p className="text-sm font-semibold">آخرین UID صادرشده</p>
            <p className="font-mono text-sm" data-ltr>
              {lastUid}
            </p>
          </div>
          <Link href={`/verify/${encodeURIComponent(lastUid)}`}>
            <Button variant="secondary">مشاهده شناسنامه</Button>
          </Link>
          <Link href="/app/inventory/uids">
            <Button variant="ghost">ادامه صدور</Button>
          </Link>
        </Panel>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="صف صدور" value={String(queue.length)} />
        <Stat label="صادرشده" value={String(issuedAssets.length)} />
        <Stat label="موقعیت پیش‌فرض" value="خزانه تهران-الف" />
      </div>

      <DataTable
        headers={["محصول", "SKU", "وزن", "عیار", "وضعیت", "عملیات"]}
        rows={queue.map((s) => [
          s.name,
          <span key={s.id} data-ltr className="font-mono text-xs">
            {s.skuCode}
          </span>,
          formatWeight(s.catalogWeight),
          `${s.karat}K`,
          <Badge key={`${s.id}-b`} tone="ok">
            تأیید QC
          </Badge>,
          <Button
            key={`${s.id}-a`}
            className="min-h-11 px-3 py-2 text-xs"
            onClick={() => setActive(s)}
          >
            صدور UID
          </Button>,
        ])}
      />

      {issuedAssets.length > 0 ? (
        <div className="mt-8">
          <SectionHeader title="UIDهای صادرشده" />
          <DataTable
            headers={["UID", "محصول", "وزن", "محل", "شناسنامه"]}
            rows={issuedAssets.map((a) => [
              <span key={a.id} data-ltr className="font-mono text-xs">
                {a.uid}
              </span>,
              a.name,
              formatWeight(a.weightGrams),
              a.location,
              <Link
                key={`${a.id}-v`}
                href={`/verify/${encodeURIComponent(a.uid)}`}
                className="text-sm font-semibold text-[var(--gold-deep)] underline"
              >
                مشاهده
              </Link>,
            ])}
          />
        </div>
      ) : null}

      <ActionModal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title="تأیید صدور شناسه یکتا"
        description="مقادیر وزن و عیار پس از صدور غیرقابل بازگشت هستند."
        confirmLabel="صدور نهایی و ثبت"
        onConfirm={confirmIssue}
      >
        {active ? (
          <div className="space-y-2 rounded-2xl bg-[var(--mist)] p-4 text-sm">
            <p>
              <span className="text-[var(--muted)]">محصول: </span>
              {active.name}
            </p>
            <p>
              <span className="text-[var(--muted)]">وزن قفل: </span>
              {formatWeight(active.catalogWeight)}
            </p>
            <p>
              <span className="text-[var(--muted)]">عیار قفل: </span>
              {active.karat}K
            </p>
          </div>
        ) : null}
      </ActionModal>
    </div>
  );
}
