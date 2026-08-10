"use client";

import {
  domainPermissionGrants,
  domainPermissionLabels,
  type DomainPermission,
} from "@/data/domains";
import { roleLabels } from "@/data/labels";
import type { RoleId } from "@/data/types";
import { Badge, Panel, SectionHeader } from "@/components/ui";

const matrixRoles: RoleId[] = [
  "admin",
  "qc",
  "warehouse",
  "pricing",
  "agent",
  "retailer",
  "finance",
  "customer",
  "producer",
];

/** Read-only view of code/backend ROLE_GRANTS — not an editable policy UI. */
export default function AdminAccessPage() {
  return (
    <div>
      <SectionHeader
        title="ماتریس دسترسی دامنه"
        description="نمای فقط‌خواندنی مجوزهای فعلی (کد فرانت + backend/app/domains/permissions.py). تغییر از اینجا ذخیره نمی‌شود — برای تغییر واقعی باید مجوز در کد/API به‌روز شود."
      />

      <Panel className="mb-4 p-4 text-sm leading-7 text-[var(--muted)]">
        نقش «مدیر کل» همیشه همه مجوزها را دارد. دامنه‌های پارک‌شده (مثل هوش) در
        ماتریس خالی می‌مانند.
      </Panel>

      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--mist)]/80">
              <th className="px-4 py-3 text-start text-[11px] text-[var(--muted)]">
                مجوز دامنه / نقش
              </th>
              {matrixRoles.map((r) => (
                <th
                  key={r}
                  className="px-3 py-3 text-center text-[11px] text-[var(--muted)]"
                >
                  {roleLabels[r]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {(Object.keys(domainPermissionLabels) as DomainPermission[]).map(
              (perm) => (
                <tr key={perm}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{domainPermissionLabels[perm]}</p>
                    <p
                      className="font-mono text-[10px] text-[var(--muted)]"
                      data-ltr
                    >
                      {perm}
                    </p>
                  </td>
                  {matrixRoles.map((role) => {
                    const on =
                      role === "admin" ||
                      Boolean(domainPermissionGrants[perm]?.[role]);
                    return (
                      <td key={role} className="px-3 py-3 text-center">
                        <Badge tone={on ? "ok" : "neutral"}>
                          {on ? "فعال" : "—"}
                        </Badge>
                      </td>
                    );
                  })}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
