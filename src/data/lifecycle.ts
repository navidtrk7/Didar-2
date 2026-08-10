import type { DomainId } from "./domains";
import type { RoleId } from "./types";

/** End-to-end gold ops chain — backbone of the product, not role folders. */
export type LifecycleStep = {
  id: string;
  label: string;
  href: string;
  domainId: DomainId;
  /** Roles for whom this step is a primary daily action */
  roles?: RoleId[];
};

export const lifecycleSteps: LifecycleStep[] = [
  {
    id: "network",
    label: "شبکه",
    href: "/app/network",
    domainId: "network",
    roles: ["admin", "agent", "finance"],
  },
  {
    id: "product",
    label: "محصول / QC",
    href: "/app/product",
    domainId: "product",
    roles: ["admin", "qc", "producer"],
  },
  {
    id: "inventory",
    label: "موجودی / UID",
    href: "/app/inventory",
    domainId: "inventory",
    roles: ["admin", "warehouse", "agent"],
  },
  {
    id: "commerce",
    label: "سفارش / قیمت",
    href: "/app/commerce",
    domainId: "commerce",
    roles: ["admin", "agent", "retailer", "pricing"],
  },
  {
    id: "allocate",
    label: "تخصیص",
    href: "/app/inventory/allocation",
    domainId: "inventory",
    roles: ["admin", "warehouse"],
  },
  {
    id: "fulfillment",
    label: "تحقق سفارش",
    href: "/app/fulfillment",
    domainId: "fulfillment",
    roles: ["admin", "warehouse", "agent"],
  },
  {
    id: "finance",
    label: "اعتبار / تسویه",
    href: "/app/finance",
    domainId: "finance",
    roles: ["admin", "finance"],
  },
  {
    id: "service",
    label: "گارانتی / بازخرید",
    href: "/app/service",
    domainId: "service",
    roles: ["admin", "customer", "agent", "retailer", "finance"],
  },
];
