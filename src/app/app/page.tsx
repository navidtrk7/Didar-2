"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "@/context/session-context";
import { usePlatform } from "@/context/platform-context";
import { formatNumber, formatMoney } from "@/lib/utils";
import { resolveGoldRate } from "@/lib/gold-rate";
import { SectionHeader, Stat, Panel, Badge } from "@/components/ui";
import { filterSidebarForRole } from "@/data/sidebarConfig";
import {
  Users,
  Package,
  Boxes,
  ShoppingCart,
  Truck,
  CreditCard,
  ShieldCheck,
  UserCheck,
  BarChart3,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

const DOMAIN_ICONS: Record<string, React.ElementType> = {
  network: Users,
  product: Package,
  inventory: Boxes,
  commerce: ShoppingCart,
  fulfillment: Truck,
  finance: CreditCard,
  service: ShieldCheck,
  relationship: UserCheck,
  intelligence: BarChart3,
  governance: ShieldAlert,
};

export default function ExecutiveOverviewPage() {
  const { user, role } = useSession();
  const { skus, qcQueue, liveGoldPrice } = usePlatform();
  const currentRate = resolveGoldRate(liveGoldPrice);
  const allowedDomains = filterSidebarForRole(role);

  const pendingQc = qcQueue.filter((q) => !q.result).length;
  const totalSkus = skus.length;

  return (
    <div className="space-y-8">
      <SectionHeader
        title="داشبورد اجرایی (Executive Overview)"
        description={`سلام ${user?.name || ""} — نمای تجمیعی دامنه‌هایی که با نقش فعال شما در دسترس است.`}
      />

      {/* Main Pulse Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="نرخ طلای ۱۸ عیار" value={formatMoney(currentRate)} hint="تومان / گرم" />
        <Stat label="کل SKUهای ثبت‌شده" value={formatNumber(totalSkus)} />
        <Stat label="صف کنترل کیفیت (QC)" value={formatNumber(pendingQc)} hint="نیازمند بررسی" />
        <Stat label="نقش فعال" value={role || "کاربر"} hint="سطح دسترسی دامنه‌ها" />
      </div>

      {/* Domains the active role can open */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[var(--ink)]">
          دامنه‌های در دسترس ({allowedDomains.length})
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {allowedDomains.map((domain) => {
            const Icon = DOMAIN_ICONS[domain.id] || Boxes;
            return (
              <Panel key={domain.id} className="p-4 flex flex-col justify-between hover:border-amber-500/40 transition-colors group">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </span>
                    <Badge tone="neutral" className="text-[10px]">
                      {domain.subItems.length} زیرشاخه
                    </Badge>
                  </div>
                  <h3 className="font-bold text-sm text-[var(--ink)] mb-1">{domain.label}</h3>
                  <ul className="text-xs text-[var(--muted)] space-y-1 mb-4">
                    {domain.subItems.slice(0, 3).map((sub) => (
                      <li key={sub.id} className="truncate">• {sub.label}</li>
                    ))}
                  </ul>
                </div>

                <Link
                  href={domain.href}
                  className="flex items-center justify-between text-xs font-semibold text-amber-600 hover:text-amber-700 pt-2 border-t border-[var(--line)]"
                >
                  <span>ورود به دامنه</span>
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                </Link>
              </Panel>
            );
          })}
        </div>
      </div>
    </div>
  );
}
