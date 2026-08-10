"use client";

import React from "react";
import { SectionHeader, Panel, Badge } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { domainPermissionLabels, domainPermissionGrants, type DomainPermission } from "@/data/domains";
import { roleLabels } from "@/data/labels";
import type { RoleId } from "@/data/types";

export default function GovernancePermissionsPage() {
  const permissions = Object.keys(domainPermissionLabels) as DomainPermission[];
  const allRoles: RoleId[] = ["admin", "qc", "warehouse", "pricing", "agent", "retailer", "finance", "producer", "customer"];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="ماتریس دسترسی دامنه‌ها (Domain-Permission Matrix)"
        description="ارزیابی و مشاهده لایه مجوزهای سیستم بر اساس ۱۰ دامنه عملیاتی."
      />

      <Panel className="p-4">
        <DataTable
          headers={["کلید دسترسی", "عنوان مجوز", ...allRoles.map((r) => roleLabels[r])]}
          rows={permissions.map((perm) => {
            const label = domainPermissionLabels[perm];
            const grants = domainPermissionGrants[perm];
            return [
              <span key={`${perm}-key`} className="font-mono text-xs text-amber-600" data-ltr>
                {perm}
              </span>,
              label,
              ...allRoles.map((r) => {
                const has = r === "admin" ? true : Boolean(grants?.[r]);
                return (
                  <Badge key={`${perm}-${r}`} tone={has ? "ok" : "neutral"} className="text-[10px]">
                    {has ? "مجاز" : "—"}
                  </Badge>
                );
              }),
            ];
          })}
        />
      </Panel>
    </div>
  );
}
