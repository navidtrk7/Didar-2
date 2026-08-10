"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { usePlatform } from "@/context/platform-context";
import { useToast } from "@/components/toast";
import { Badge, Button, Field, SectionHeader } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { formatNumber } from "@/lib/utils";

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export default function AdminAuditPage() {
  const { toast } = useToast();
  const { auditEvents } = usePlatform();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [module, setModule] = useState("همه");
  const [status, setStatus] = useState("همه");

  const modules = useMemo(() => {
    const set = new Set(auditEvents.map((e) => e.module));
    return ["همه", ...Array.from(set).sort((a, b) => a.localeCompare(b, "fa"))];
  }, [auditEvents]);

  const filtered = useMemo(() => {
    const q = normalize(deferredQuery);
    const tokens = q ? q.split(" ").filter(Boolean) : [];

    return auditEvents.filter((e) => {
      if (module !== "همه" && e.module !== module) return false;
      if (status === "موفق" && e.status !== "ok") return false;
      if (status === "خطا" && e.status !== "error") return false;
      if (!tokens.length) return true;

      const haystack = normalize(
        [
          e.timestamp,
          e.actor,
          e.role,
          e.action,
          e.entity,
          e.module,
          e.ip,
          e.status === "ok" ? "موفق ok" : "خطا error",
        ].join(" "),
      );
      return tokens.every((t) => haystack.includes(t));
    });
  }, [auditEvents, deferredQuery, module, status]);

  const exportCsv = () => {
    if (!filtered.length) {
      toast("موردی برای خروجی نیست", "warn");
      return;
    }
    const header = [
      "زمان",
      "کاربر",
      "نقش",
      "ماژول",
      "عملیات",
      "موجودیت",
      "IP",
      "وضعیت",
    ];
    const lines = [
      header.join(","),
      ...filtered.map((e) =>
        [
          e.timestamp,
          e.actor,
          e.role,
          e.module,
          e.action,
          e.entity,
          e.ip,
          e.status === "ok" ? "موفق" : "خطا",
        ]
          .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
          .join(","),
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `didar-audit-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`${formatNumber(filtered.length)} ردیف خروجی گرفته شد`);
  };

  return (
    <div>
      <SectionHeader
        title="گزارش فعالیت‌ها"
        description="جستجو در کاربر، عملیات، موجودیت، IP و ماژول — فیلتر زنده روی رویدادهای ثبت‌شده."
        action={
          <Button onClick={exportCsv} variant="secondary">
            خروجی CSV
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Field label="جستجو">
          <input
            className="field min-h-11"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="نام، عملیات، موجودیت، IP…"
            autoComplete="off"
          />
        </Field>
        <Field label="ماژول">
          <select
            className="field min-h-11"
            value={module}
            onChange={(e) => setModule(e.target.value)}
          >
            {modules.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field label="وضعیت">
          <select
            className="field min-h-11"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>همه</option>
            <option>موفق</option>
            <option>خطا</option>
          </select>
        </Field>
        <div className="flex items-end">
          <p className="pb-3 text-sm text-[var(--muted)]">
            {formatNumber(filtered.length)} از {formatNumber(auditEvents.length)} رویداد
            {query !== deferredQuery ? " · در حال جستجو…" : ""}
          </p>
        </div>
      </div>

      <DataTable
        headers={[
          "زمان",
          "کاربر",
          "نقش",
          "عملیات",
          "موجودیت",
          "IP",
          "وضعیت",
        ]}
        rows={filtered.map((e) => [
          e.timestamp,
          e.actor,
          e.role,
          e.action,
          e.entity,
          <span key={e.id} data-ltr>
            {e.ip}
          </span>,
          <Badge key={`${e.id}-s`} tone={e.status === "ok" ? "ok" : "danger"}>
            {e.status === "ok" ? "موفق" : "خطا"}
          </Badge>,
        ])}
        empty="با این جستجو یا فیلتر موردی پیدا نشد."
      />
    </div>
  );
}
