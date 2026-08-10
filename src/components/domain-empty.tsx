"use client";

import Link from "next/link";
import { Panel } from "@/components/ui";

export function DomainEmptyState({
  title,
  body,
  href,
  actionLabel,
}: {
  title: string;
  body: string;
  href?: string;
  actionLabel?: string;
}) {
  return (
    <Panel className="mb-4 border-dashed p-5">
      <p className="text-sm font-semibold text-[var(--ink)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{body}</p>
      {href && actionLabel ? (
        <Link
          href={href}
          className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[var(--ink)] px-4 text-sm font-medium text-white"
        >
          {actionLabel}
        </Link>
      ) : null}
    </Panel>
  );
}
