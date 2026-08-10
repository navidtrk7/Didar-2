"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { lifecycleSteps } from "@/data/lifecycle";
import {
  domainFromPath,
  pathPermissionDenied,
  roleCanAccessDomain,
} from "@/data/domains";
import type { RoleId } from "@/data/types";
import { cn } from "@/lib/utils";

export function WorkJourney({
  role,
  compact,
  title = "جریان کار طلا",
  description = "مسیر از شبکه تا خدمات — روی هر مرحله بزنید.",
}: {
  role?: RoleId | null;
  compact?: boolean;
  title?: string;
  description?: string;
}) {
  const pathname = usePathname();
  const currentDomain = domainFromPath(pathname);

  const steps = lifecycleSteps.filter(
    (step) =>
      roleCanAccessDomain(role, step.domainId) &&
      !pathPermissionDenied(role, step.href),
  );

  if (!steps.length) return null;

  return (
    <section
      className={cn(
        "mb-6 rounded-2xl border border-[var(--line)] bg-white/70 p-4 sm:p-5",
        compact && "mb-4 p-3 sm:p-4",
      )}
      aria-label={title}
    >
      {!compact ? (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-[var(--ink)]">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {description}
          </p>
        </div>
      ) : (
        <p className="mb-3 text-xs font-semibold text-[var(--muted)]">{title}</p>
      )}

      <ol className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {steps.map((step, index) => {
          const active =
            pathname === step.href ||
            pathname.startsWith(`${step.href}/`) ||
            (currentDomain === step.domainId &&
              step.href === `/app/${step.domainId}`);
          const primary = Boolean(role && step.roles?.includes(role));

          return (
            <li key={step.id} className="flex shrink-0 items-center gap-2">
              {index > 0 ? (
                <span
                  className="hidden h-px w-4 bg-[var(--line)] sm:block"
                  aria-hidden
                />
              ) : null}
              <Link
                href={step.href}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                  active
                    ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                    : primary
                      ? "border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--ink)] hover:border-[var(--gold)]"
                      : "border-[var(--line)] bg-white text-[var(--ink)]/80 hover:bg-[var(--mist)]",
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-lg text-[11px] font-semibold",
                    active
                      ? "bg-white/15 text-white"
                      : "bg-[var(--mist)] text-[var(--muted)]",
                  )}
                >
                  {index + 1}
                </span>
                {step.label}
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
