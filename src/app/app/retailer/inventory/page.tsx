"use client";

import { useMemo } from "react";
import { usePlatform } from "@/context/platform-context";
import { useSession } from "@/context/session-context";
import { useWorkspace } from "@/context/workspace-context";
import { formatNumber, formatWeight } from "@/lib/utils";
import { AssetStatusBadge } from "@/components/status";
import { DataTable } from "@/components/data-table";
import { Panel, SectionHeader, Stat } from "@/components/ui";

export default function RetailerInventoryPage() {
  const { user } = useSession();
  const { activeHat } = useWorkspace();
  const { assets, inventory, error } = usePlatform();
  const org = activeHat?.partyName ?? user?.org ?? "";

  const local = useMemo(() => {
    if (!org) return [];
    return assets.filter(
      (a) => a.location === org || a.custodian === org,
    );
  }, [assets, org]);

  const branch = useMemo(() => {
    if (!org) return undefined;
    return inventory.find((i) => i.location === org);
  }, [inventory, org]);

  const pieces = branch?.pieces ?? local.length;
  const availableGrams =
    branch?.availableGrams ??
    local.reduce((s, a) => s + a.weightGrams, 0);
  const utilization = branch?.utilization ?? (pieces ? 100 : 0);

  return (
    <div>
      <SectionHeader
        title="موجودی شعبه"
        description={
          org
            ? `موجودی «${org}» پس از تأیید تحویل.`
            : "موجودی شعبه پس از تأیید تحویل."
        }
      />
      {error ? (
        <Panel className="mb-4 p-4 text-sm text-amber-950 bg-amber-50">
          داده زنده بارگذاری نشد: {error}
        </Panel>
      ) : null}
      {!org ? (
        <Panel className="mb-4 p-4 text-sm text-[var(--muted)]">
          سازمان/شعبه برای این کاربر مشخص نیست.
        </Panel>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="اقلام موجود" value={formatNumber(pieces)} />
        <Stat label="وزن قابل استفاده" value={formatWeight(availableGrams)} />
        <Stat label="بهره‌برداری" value={`${formatNumber(utilization)}٪`} />
      </div>

      {org && !error ? (
        <DataTable
          headers={["شناسه", "نام", "عیار", "وزن", "وضعیت", "مسئول نگهداری"]}
          empty="موجودی برای این شعبه ثبت نشده است."
          rows={local.map((a) => [
            <span key={`${a.id}-u`} className="font-mono text-xs" data-ltr>
              {a.uid}
            </span>,
            a.name,
            String(a.karat),
            formatWeight(a.weightGrams),
            <AssetStatusBadge key={`${a.id}-s`} status={a.status} />,
            a.custodian,
          ])}
        />
      ) : null}
    </div>
  );
}
