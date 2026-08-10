"use client";

import {
  DomainLinkButton,
  DomainOverviewPage,
} from "@/components/domain-overview";
import { WorkJourney } from "@/components/work-journey";
import { DomainEmptyState } from "@/components/domain-empty";
import { useSession } from "@/context/session-context";
import { roleHasPermission } from "@/data/domains";

export default function ServiceDomainPage() {
  const { role } = useSession();
  const canWarranty = roleHasPermission(role, "service.warranty");
  const canLifecycle = roleHasPermission(role, "service.lifecycle");

  return (
    <div>
      <WorkJourney role={role} compact />
      <DomainOverviewPage
        domainId="service"
        title="خدمات"
        description="گارانتی، مرجوعی، بازخرید و چرخه ثانویه پس از فروش."
      >
        {role === "customer" ? (
          <DomainEmptyState
            title="پورتال مشتری"
            body="از اینجا اصالت قطعه را استعلام کنید یا وضعیت گارانتی را ببینید."
            href="/verify"
            actionLabel="استعلام اصالت"
          />
        ) : null}
        <div className="flex flex-wrap gap-3">
          {canWarranty ? (
            <DomainLinkButton href="/app/service/warranty">گارانتی</DomainLinkButton>
          ) : null}
          {canLifecycle ? (
            <>
              <DomainLinkButton href="/app/service/returns">مرجوعی</DomainLinkButton>
              <DomainLinkButton href="/app/service/buyback">بازخرید</DomainLinkButton>
              <DomainLinkButton href="/app/service/secondary">
                چرخه ثانویه
              </DomainLinkButton>
            </>
          ) : null}
          <DomainLinkButton href="/verify">استعلام اصالت</DomainLinkButton>
        </div>
      </DomainOverviewPage>
    </div>
  );
}
