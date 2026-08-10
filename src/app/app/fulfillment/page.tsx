"use client";

import {
  DomainLinkButton,
  DomainOverviewPage,
} from "@/components/domain-overview";
import { FulfillmentBoard } from "@/components/fulfillment-board";
import { WorkJourney } from "@/components/work-journey";
import { useSession } from "@/context/session-context";
import { roleHasPermission } from "@/data/domains";

export default function FulfillmentDomainPage() {
  const { role } = useSession();
  const canStage = roleHasPermission(role, "fulfillment.stage");
  const canDeliver = roleHasPermission(role, "fulfillment.deliver");

  return (
    <div>
      <WorkJourney role={role} compact />
      <DomainOverviewPage
        domainId="fulfillment"
        title="تحقق سفارش"
        description="برداشت، بسته‌بندی، تحویل به ایجنت، سپس تحویل نهایی با کد تأیید."
      >
        <div className="mb-6 flex flex-wrap gap-3">
          {canStage ? (
            <>
              <DomainLinkButton href="/app/fulfillment/pick">برداشت</DomainLinkButton>
              <DomainLinkButton href="/app/fulfillment/pack">بسته‌بندی</DomainLinkButton>
              <DomainLinkButton href="/app/fulfillment/handover">
                تحویل به ایجنت
              </DomainLinkButton>
            </>
          ) : null}
          {canDeliver ? (
            <DomainLinkButton href="/app/fulfillment/delivery">
              تحویل نهایی
            </DomainLinkButton>
          ) : null}
        </div>
      </DomainOverviewPage>
      <FulfillmentBoard
        title="صف تحقق سفارش"
        description="پیشبرد مراحل یا تأیید تحویل از همین بخش."
        allowAdvance={canStage}
        allowOtp={canDeliver}
        showCreate={canStage}
      />
    </div>
  );
}
