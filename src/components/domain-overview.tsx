"use client";

import { domains, type DomainId } from "@/data/domains";
import { Badge, Button, Panel, SectionHeader } from "@/components/ui";

const statusLabel = {
  live: "فعال",
  partial: "در حال تکمیل",
  planned: "به‌زودی",
} as const;

const statusTone = {
  live: "ok",
  partial: "warn",
  planned: "neutral",
} as const;

export function DomainOverviewPage({
  domainId,
  title,
  description,
  children,
  actions,
}: {
  domainId: DomainId;
  title: string;
  description: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const meta = domains.find((d) => d.id === domainId);

  return (
    <div>
      <SectionHeader
        title={title}
        description={description}
        action={actions}
      />
      {meta ? (
        <Panel className="mb-6 flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="text-xs font-semibold text-[var(--muted)]">
              بخش عملیاتی
            </p>
            <p className="mt-1 text-sm font-semibold">
              {meta.label}
              <span className="mx-2 text-[var(--muted)]">·</span>
              <span className="font-normal text-[var(--muted)]">{meta.owns}</span>
            </p>
          </div>
          <Badge tone={statusTone[meta.status]}>{statusLabel[meta.status]}</Badge>
        </Panel>
      ) : null}
      {children}
    </div>
  );
}

export function DomainLinkButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Button href={href} variant="secondary" className="min-h-11">
      {children}
    </Button>
  );
}
