"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { roleHasPermission, type DomainPermission } from "@/data/domains";
import { useSession } from "@/context/session-context";

const LINKS: {
  href: string;
  label: string;
  exact?: boolean;
  /** Hide unless role has this permission. Omit = any product viewer. */
  permission?: DomainPermission;
}[] = [
  { href: "/app/product", label: "نمای کلی", exact: true },
  { href: "/app/product/catalog", label: "کاتالوگ SKU" },
  {
    href: "/app/product/qc",
    label: "پایش QC",
    permission: "product.qc_approve",
  },
  { href: "/app/product/collections", label: "کالکشن‌ها" },
];

/** Product subnav — sensitive tools (e.g. QC) are hidden without permission. */
export function ProductSubnav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { role } = useSession();

  const links = LINKS.filter(
    (link) =>
      !link.permission || roleHasPermission(role, link.permission),
  );

  return (
    <nav
      aria-label="زیربخش‌های دامنه محصول"
      className={cn("mb-6 flex flex-wrap gap-2", className)}
    >
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href || pathname === `${link.href}/`
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Button
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            variant={active ? "primary" : "secondary"}
            className="min-h-11 px-4 py-2 text-sm"
          >
            {link.label}
          </Button>
        );
      })}
    </nav>
  );
}
