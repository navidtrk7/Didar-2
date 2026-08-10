"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./ui";

export function ActionModal({
  open,
  title,
  description,
  children,
  confirmLabel = "تأیید",
  cancelLabel = "انصراف",
  onConfirm,
  onClose,
  busy,
  hideFooter,
}: {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  busy?: boolean;
  hideFooter?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-[rgba(4,30,66,0.45)] backdrop-blur-[2px]"
        aria-label="بستن"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-3xl border border-[var(--line)] bg-white p-5 shadow-[0_30px_80px_-30px_rgba(15,20,25,0.55)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-xl tracking-tight">
              {title}
            </h3>
            {description ? (
              <p className="mt-1 text-sm leading-7 text-[var(--muted)]">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--mist)]"
            aria-label="بستن"
          >
            <X size={16} />
          </button>
        </div>

        {children ? <div className="mt-4">{children}</div> : null}

        {hideFooter ? null : (
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button type="button" onClick={onConfirm} disabled={busy}>
              {confirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
