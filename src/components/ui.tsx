"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "gold" | "ok" | "warn" | "danger" | "info";
  className?: string;
}) {
  const tones = {
    neutral: "bg-[var(--ink)]/8 text-[var(--ink)]",
    gold: "bg-[var(--gold)]/15 text-[var(--gold-deep)]",
    ok: "bg-emerald-500/12 text-emerald-800",
    warn: "bg-amber-500/14 text-amber-900",
    danger: "bg-rose-500/12 text-rose-800",
    info: "bg-sky-500/12 text-sky-900",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "onDark"
  | "onDarkGhost";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--ink)] text-[var(--mist)] hover:bg-[var(--ink-soft)] shadow-[0_10px_30px_-18px_rgba(15,20,25,0.8)]",
  secondary:
    "bg-white text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--mist)]",
  ghost: "bg-transparent text-[var(--ink)] hover:bg-[var(--ink)]/5",
  danger: "bg-rose-700 text-white hover:bg-rose-800",
  /** Gold CTA on dark/hero backgrounds — navy text, never white-on-white */
  onDark:
    "bg-[var(--gold-bright)] text-[var(--ink)] hover:bg-[var(--gold)] shadow-[0_12px_28px_-16px_rgba(0,0,0,0.55)]",
  /** Solid white CTA on dark/hero — navy text for contrast */
  onDarkGhost:
    "bg-white text-[var(--ink)] border border-white/40 hover:bg-[var(--mist)] shadow-[0_12px_28px_-16px_rgba(0,0,0,0.45)]",
};

function buttonClassName(variant: ButtonVariant, className?: string) {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[15px] font-semibold transition-all duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--mist)]",
    BUTTON_VARIANTS[variant],
    className,
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  href,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** When set, renders a Next.js Link with button styles (avoids nested interactive elements). */
  href?: string;
}) {
  const classes = buttonClassName(variant, className);

  if (href) {
    const { type: _type, disabled, ...rest } = props;
    return (
      <Link
        href={href}
        className={cn(classes, disabled && "pointer-events-none opacity-50")}
        aria-disabled={disabled || undefined}
        {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden break-words rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: string;
}) {
  return (
    <Panel className="p-5 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-xs font-semibold tracking-wide text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-3 break-words font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
        {value}
      </p>
      <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted)]">
        {trend ? (
          <span className="font-semibold text-emerald-700">{trend}</span>
        ) : null}
        {hint ? <span>{hint}</span> : null}
      </div>
    </Panel>
  );
}

export function SectionHeader({
  title,
  description,
  action,
  level = 1,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  level?: 1 | 2;
}) {
  const Heading = level === 1 ? "h1" : "h2";
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <Heading
          className={
            level === 1
              ? "font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)] sm:text-3xl"
              : "font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] sm:text-2xl"
          }
        >
          {title}
        </Heading>
        {description ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--line)] px-4 py-8 text-center text-sm text-[var(--muted)]">
      {children}
    </div>
  );
}

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="block">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
        {label}
      </label>
      {children}
      {hint && !error ? (
        <p className="mt-1.5 text-xs text-[var(--muted)]">{hint}</p>
      ) : null}
      {error ? (
        <p id={id ? `${id}-error` : undefined} className="mt-1.5 text-xs text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink)] placeholder:text-[var(--muted)] shadow-sm outline-none transition-all focus:border-[var(--gold-deep)] focus:ring-2 focus:ring-[var(--gold-deep)]/20",
        className,
      )}
      {...props}
    />
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  if (!open) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full my-8 rounded-3xl border border-[var(--line)] bg-white p-6 sm:p-7 shadow-2xl text-[var(--ink)] max-h-[90vh] overflow-y-auto",
          sizeClasses[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4 mb-5">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xl sm:text-2xl tracking-tight font-bold">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--muted)] hover:bg-[var(--mist)] hover:text-[var(--ink)] transition-colors"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

