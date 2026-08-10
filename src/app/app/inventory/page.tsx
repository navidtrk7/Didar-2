"use client";

import { usePlatform } from "@/context/platform-context";
import { formatNumber, formatWeight } from "@/lib/utils";
import {
  DomainLinkButton,
  DomainOverviewPage,
} from "@/components/domain-overview";
import { WorkJourney } from "@/components/work-journey";
import { Button, Stat } from "@/components/ui";
import { useSession } from "@/context/session-context";
import { roleHasPermission } from "@/data/domains";

export default function InventoryDomainPage() {
  const { role } = useSession();
  const { skus, issuedAssets, inventory } = usePlatform();
  const canIssue = roleHasPermission(role, "inventory.uid_issue");
  const canAllocate = roleHasPermission(role, "inventory.allocate");
  const canCustody = roleHasPermission(role, "inventory.custody");

  const ready = skus.filter(
    (s) =>
      s.status === "approved" &&
      !issuedAssets.some((a) => a.skuId === s.id),
  ).length;
  const vault = inventory.filter((i) => i.type === "vault");

  return (
    <div>
      <WorkJourney role={role} compact />
      <DomainOverviewPage
        domainId="inventory"
        title="موجودی"
        description="شناسه کالا، موجودی فیزیکی، تخصیص و حضانت."
        actions={
          canIssue ? <Button href="/app/inventory/uids">صدور شناسه</Button> : null
        }
      >
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="آماده صدور UID" value={formatNumber(ready)} />
        <Stat label="UID مهرشده" value={formatNumber(issuedAssets.length)} />
        <Stat
          label="وزن خزانه"
          value={formatWeight(vault.reduce((s, r) => s + r.weightGrams, 0))}
        />
        <Stat label="تخصیص / حضانت" value="فعال" />
      </div>

      <div className="flex flex-wrap gap-3">
        {canIssue ? (
          <DomainLinkButton href="/app/inventory/uids">
            صدور و فهرست شناسه
          </DomainLinkButton>
        ) : null}
        <DomainLinkButton href="/app/inventory/stock">موجودی موقعیت‌ها</DomainLinkButton>
        {canAllocate ? (
          <DomainLinkButton href="/app/inventory/allocation">تخصیص</DomainLinkButton>
        ) : null}
        {canCustody ? (
          <DomainLinkButton href="/app/inventory/custody">حضانت</DomainLinkButton>
        ) : null}
      </div>
      </DomainOverviewPage>
    </div>
  );
}
