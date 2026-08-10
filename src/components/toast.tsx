"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type ToastTone = "ok" | "info" | "warn";

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, tone: ToastTone = "ok") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[100] flex flex-col items-center gap-2 px-4 pb-[env(safe-area-inset-bottom)]">
        <AnimatePresence>
          {items.map((item) => {
            const Icon =
              item.tone === "warn"
                ? AlertTriangle
                : item.tone === "info"
                  ? Info
                  : CheckCircle2;
            const iconClass =
              item.tone === "warn"
                ? "text-amber-700"
                : item.tone === "info"
                  ? "text-sky-700"
                  : "text-emerald-700";
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm shadow-[0_20px_50px_-24px_rgba(15,20,25,0.55)]"
                role="status"
              >
                <Icon size={18} className={`mt-0.5 shrink-0 ${iconClass}`} />
                <p className="flex-1 leading-6 text-[var(--ink)]">
                  {item.message}
                </p>
                <button
                  type="button"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--mist)]"
                  onClick={() =>
                    setItems((prev) => prev.filter((t) => t.id !== item.id))
                  }
                  aria-label="بستن"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
