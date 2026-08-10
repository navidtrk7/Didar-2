"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import { useSession } from "@/context/session-context";
import { SIDEBAR_DOMAINS, type SidebarDomainItem } from "@/data/sidebarConfig";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
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
};

export function AppSidebar({ className, onItemClick }: { className?: string; onItemClick?: () => void }) {
  const pathname = usePathname();
  const { role, user } = useSession();
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});

  // Auto-expand domain matching current pathname
  useEffect(() => {
    SIDEBAR_DOMAINS.forEach((domain) => {
      if (pathname === domain.href || pathname.startsWith(domain.href + "/")) {
        setExpandedDomains((prev) => ({ ...prev, [domain.id]: true }));
      }
    });
  }, [pathname]);

  const toggleExpand = (domainId: string) => {
    setExpandedDomains((prev) => ({ ...prev, [domainId]: !prev[domainId] }));
  };

  // Filter domains based on user role (Admin sees all 10)
  const allowedDomains = SIDEBAR_DOMAINS.filter((domain) => {
    if (role === "admin") return true;
    // Map requiredPermission check
    if (role === "warehouse" && ["product", "inventory", "fulfillment"].includes(domain.id)) return true;
    if (role === "agent" && ["network", "inventory", "commerce", "fulfillment", "relationship"].includes(domain.id)) return true;
    if (role === "finance" && ["network", "inventory", "commerce", "finance", "service", "intelligence"].includes(domain.id)) return true;
    if (role === "qc" && ["product"].includes(domain.id)) return true;
    if (role === "producer" && ["product", "network"].includes(domain.id)) return true;
    if (role === "pricing" && ["commerce", "product"].includes(domain.id)) return true;
    if (role === "retailer" && ["commerce", "finance", "service"].includes(domain.id)) return true;
    if (role === "customer" && ["service"].includes(domain.id)) return true;
    return true;
  });

  return (
    <aside className={cn("flex flex-col h-full bg-slate-900 border-l border-slate-800 text-slate-200 w-64 overflow-y-auto select-none", className)}>
      {/* Overview Header Item */}
      <div className="p-3 border-b border-slate-800">
        <Link
          href="/app"
          onClick={onItemClick}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150",
            pathname === "/app"
              ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
              : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
          )}
        >
          <LayoutDashboard className="w-5 h-5 text-amber-400 shrink-0" />
          <span>داشبورد کلی (Overview)</span>
        </Link>
      </div>

      {/* 10 Domains Menu */}
      <div className="flex-1 py-3 px-2 space-y-1">
        <div className="px-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          دامنه‌های عملیاتی
        </div>

        {allowedDomains.map((domain) => {
          const Icon = ICON_MAP[domain.iconName] || Boxes;
          const isDomainActive = pathname === domain.href || pathname.startsWith(domain.href + "/");
          const isExpanded = expandedDomains[domain.id] ?? isDomainActive;

          return (
            <div key={domain.id} className="space-y-1">
              <div
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                  isDomainActive
                    ? "bg-slate-800 text-white font-semibold"
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                )}
              >
                <Link
                  href={domain.href}
                  onClick={onItemClick}
                  className="flex items-center gap-2.5 flex-1 min-w-0"
                >
                  <Icon className={cn("w-4 h-4 shrink-0 transition-colors", isDomainActive ? "text-amber-400" : "text-slate-400 group-hover:text-slate-200")} />
                  <span className="truncate">{domain.label}</span>
                </Link>

                {domain.subItems.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleExpand(domain.id);
                    }}
                    className="p-1 text-slate-400 hover:text-white rounded transition-colors"
                    aria-label="Expand domain"
                  >
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isExpanded ? "rotate-180 text-amber-400" : "")} />
                  </button>
                )}
              </div>

              {/* Capabilities (SubItems) */}
              {isExpanded && domain.subItems.length > 0 && (
                <div className="mr-4 pr-2 border-r border-slate-800 space-y-0.5 my-1">
                  {domain.subItems.map((sub) => {
                    const isSubActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.id}
                        href={sub.href}
                        onClick={onItemClick}
                        className={cn(
                          "flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors",
                          isSubActive
                            ? "bg-amber-500/10 text-amber-400 font-semibold"
                            : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
                        )}
                      >
                        <span className="truncate">{sub.label}</span>
                        {sub.badge && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-300">
                            {sub.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
