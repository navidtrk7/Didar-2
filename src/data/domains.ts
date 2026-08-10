import type { RoleId } from "./types";

/** Business domains — system spine. Roles only get views + permissions on these. */
export type DomainId =
  | "network"
  | "product"
  | "inventory"
  | "commerce"
  | "fulfillment"
  | "finance"
  | "service"
  | "relationship"
  | "intelligence"
  | "governance";

export type DomainPermission =
  | "network.view"
  | "network.manage"
  | "product.view"
  | "product.sku_create"
  | "product.qc_approve"
  | "inventory.view"
  | "inventory.uid_issue"
  | "inventory.allocate"
  | "inventory.custody"
  | "commerce.view"
  | "commerce.pricing"
  | "commerce.proforma"
  | "commerce.order"
  | "commerce.promotion"
  | "fulfillment.view"
  | "fulfillment.stage"
  | "fulfillment.deliver"
  | "finance.view"
  | "finance.ledger"
  | "finance.credit"
  | "finance.settlement"
  | "service.view"
  | "service.warranty"
  | "service.lifecycle"
  | "relationship.view"
  | "relationship.manage"
  | "intelligence.view"
  | "governance.view"
  | "governance.users"
  | "governance.audit";

export type DomainMeta = {
  id: DomainId;
  label: string;
  owns: string;
  href: string;
  status: "live" | "partial" | "planned";
};

export const domains: DomainMeta[] = [
  {
    id: "network",
    label: "شبکه",
    owns: "کارخانه / کارگاه / بنکدار / گالری / خزانه / ایجنت",
    href: "/app/network",
    status: "live",
  },
  {
    id: "product",
    label: "محصول",
    owns: "محصول / SKU / کالکشن / QC",
    href: "/app/product",
    status: "live",
  },
  {
    id: "inventory",
    label: "موجودی",
    owns: "UID / موجودی / تخصیص / حضانت",
    href: "/app/inventory",
    status: "live",
  },
  {
    id: "commerce",
    label: "تجارت",
    owns: "گالری / سفارش / قیمت",
    href: "/app/commerce",
    status: "live",
  },
  {
    id: "fulfillment",
    label: "تحقق سفارش",
    owns: "برداشت / بسته‌بندی / تحویل / کد تأیید",
    href: "/app/fulfillment",
    status: "live",
  },
  {
    id: "finance",
    label: "مالی",
    owns: "اعتبار / مطالبات / تسویه / دفتر",
    href: "/app/finance",
    status: "live",
  },
  {
    id: "service",
    label: "خدمات",
    owns: "گارانتی / مرجوعی / بازخرید",
    href: "/app/service",
    status: "live",
  },
  {
    id: "relationship",
    label: "ارتباطات",
    owns: "مخاطب / کمپین / CRM",
    href: "/app/relationship",
    status: "live",
  },
  {
    id: "intelligence",
    label: "هوش",
    owns: "BI / تحلیل رفتار / پیش‌بینی تقاضا",
    href: "/app/intelligence",
    status: "live",
  },
  {
    id: "governance",
    label: "تنظیمات مدیریتی",
    owns: "کاربر / پروفایل / نقش / ذینفعان / دسترسی / ممیزی",
    href: "/app/governance",
    status: "live",
  },
];

/** Default grants — mirrors backend/app/domains/permissions.py */
export const domainPermissionGrants: Record<
  DomainPermission,
  Partial<Record<RoleId, boolean>>
> = {
    "network.view": { admin: true, agent: true, finance: true },
    "network.manage": { admin: true },
  "product.view": {
    admin: true,
    qc: true,
    warehouse: true,
    pricing: true,
    agent: true,
    retailer: true,
    producer: true,
  },
  "product.sku_create": { admin: true, qc: true, producer: true },
  "product.qc_approve": { admin: true, qc: true },
  "inventory.view": {
    admin: true,
    warehouse: true,
    agent: true,
    finance: true,
  },
  "inventory.uid_issue": { admin: true, warehouse: true },
  "inventory.allocate": { admin: true, warehouse: true },
  "inventory.custody": { admin: true, warehouse: true, agent: true },
  "commerce.view": {
    admin: true,
    pricing: true,
    agent: true,
    retailer: true,
  },
  "commerce.pricing": { admin: true, pricing: true },
  "commerce.proforma": { admin: true, agent: true },
  "commerce.order": { admin: true, agent: true, retailer: true },
  "commerce.promotion": { admin: true, pricing: true, agent: true },
  "fulfillment.view": { admin: true, warehouse: true, agent: true },
  "fulfillment.stage": { admin: true, warehouse: true },
  "fulfillment.deliver": { admin: true, agent: true, warehouse: true },
  "finance.view": { admin: true, finance: true, agent: true },
  "finance.ledger": { admin: true, finance: true },
  "finance.credit": { admin: true, finance: true, agent: true },
  "finance.settlement": { admin: true, finance: true },
  "service.view": {
    admin: true,
    customer: true,
    agent: true,
    retailer: true,
    finance: true,
  },
  "service.warranty": { admin: true, customer: true, agent: true },
  "service.lifecycle": {
    admin: true,
    agent: true,
    retailer: true,
    finance: true,
  },
  "relationship.view": { admin: true, agent: true, retailer: true },
  "relationship.manage": { admin: true, agent: true },
  "intelligence.view": { admin: true, finance: true, pricing: true, agent: true },
  "governance.view": { admin: true },
  "governance.users": { admin: true },
  "governance.audit": { admin: true },
};

export const domainPermissionLabels: Record<DomainPermission, string> = {
  "network.view": "مشاهده شبکه",
  "network.manage": "مدیریت شبکه",
  "product.view": "مشاهده محصول",
  "product.sku_create": "ایجاد SKU",
  "product.qc_approve": "تأیید QC",
  "inventory.view": "مشاهده موجودی",
  "inventory.uid_issue": "صدور UID",
  "inventory.allocate": "تخصیص موجودی",
  "inventory.custody": "انتقال حضانت",
  "commerce.view": "مشاهده تجارت",
  "commerce.pricing": "قیمت‌گذاری",
  "commerce.proforma": "صدور پیش‌فاکتور",
  "commerce.order": "سفارش",
  "commerce.promotion": "پروموشن",
  "fulfillment.view": "مشاهده تحقق سفارش",
  "fulfillment.stage": "پیشبرد مراحل تحقق سفارش",
  "fulfillment.deliver": "تحویل نهایی / کد تأیید",
  "finance.view": "مشاهده مالی",
  "finance.ledger": "دفتر معین",
  "finance.credit": "مدیریت اعتبار",
  "finance.settlement": "تسویه تولیدکننده",
  "service.view": "مشاهده خدمات",
  "service.warranty": "گارانتی",
  "service.lifecycle": "مرجوعی / بازخرید / ثانویه",
  "relationship.view": "مشاهده ارتباط",
  "relationship.manage": "مدیریت مخاطب / کمپین",
  "intelligence.view": "مشاهده هوش",
  "governance.view": "مشاهده حاکمیت",
  "governance.users": "مدیریت کاربران",
  "governance.audit": "ممیزی",
};

export const DOMAIN_PATH_RE =
  /^\/app\/(network|product|inventory|commerce|fulfillment|finance|service|relationship|intelligence|governance)(?:\/|$)/;

export function domainFromPath(pathname: string): DomainId | null {
  const m = pathname.match(DOMAIN_PATH_RE);
  return m ? (m[1] as DomainId) : null;
}

export function roleHasPermission(
  role: RoleId | null | undefined,
  permission: DomainPermission,
): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  return Boolean(domainPermissionGrants[permission]?.[role]);
}

export function roleCanAccessDomain(
  role: RoleId | null | undefined,
  domain: DomainId,
): boolean {
  if (!role) return false;
  if (role === "admin") return true;
  return (Object.keys(domainPermissionGrants) as DomainPermission[]).some(
    (perm) =>
      perm.startsWith(`${domain}.`) &&
      Boolean(domainPermissionGrants[perm]?.[role]),
  );
}

/**
 * Sensitive tools: longest-prefix wins.
 * Any-of permissions: role needs at least one.
 * Hide in nav + AuthGate redirect — no dead-end toasts.
 */
export type RoutePermissionGate = {
  prefix: string;
  anyOf: DomainPermission[];
};

export const routePermissionGates: RoutePermissionGate[] = [
  { prefix: "/app/product/qc", anyOf: ["product.qc_approve"] },
  { prefix: "/app/network", anyOf: ["network.view"] },
  { prefix: "/app/inventory/uids", anyOf: ["inventory.uid_issue"] },
  { prefix: "/app/inventory/allocation", anyOf: ["inventory.allocate"] },
  { prefix: "/app/inventory/custody", anyOf: ["inventory.custody"] },
  { prefix: "/app/inventory", anyOf: ["inventory.view"] },
  { prefix: "/app/commerce/pricing", anyOf: ["commerce.pricing"] },
  { prefix: "/app/commerce/promotions", anyOf: ["commerce.promotion"] },
  { prefix: "/app/commerce/proforma", anyOf: ["commerce.proforma"] },
  { prefix: "/app/commerce/gallery", anyOf: ["commerce.proforma"] },
  { prefix: "/app/commerce/orders", anyOf: ["commerce.order"] },
  { prefix: "/app/commerce", anyOf: ["commerce.view"] },
  { prefix: "/app/fulfillment/delivery", anyOf: ["fulfillment.deliver"] },
  { prefix: "/app/fulfillment/pick", anyOf: ["fulfillment.stage"] },
  { prefix: "/app/fulfillment/pack", anyOf: ["fulfillment.stage"] },
  { prefix: "/app/fulfillment/handover", anyOf: ["fulfillment.stage"] },
  { prefix: "/app/fulfillment", anyOf: ["fulfillment.view"] },
  { prefix: "/app/finance", anyOf: ["finance.view"] },
  { prefix: "/app/service/warranty", anyOf: ["service.warranty"] },
  { prefix: "/app/service/returns", anyOf: ["service.lifecycle"] },
  { prefix: "/app/service/buyback", anyOf: ["service.lifecycle"] },
  { prefix: "/app/service/secondary", anyOf: ["service.lifecycle"] },
  {
    prefix: "/app/service",
    anyOf: ["service.view", "service.warranty", "service.lifecycle"],
  },
  { prefix: "/app/relationship", anyOf: ["relationship.view"] },
  { prefix: "/app/intelligence", anyOf: ["intelligence.view"] },
  { prefix: "/app/governance", anyOf: ["governance.view"] },
];

/**
 * Parked from product UI (code kept for later).
 * Not core gold spine: CRM, deep BI, promotions engine, design studio, pricing depth.
 * Kept live: /app/commerce/pricing (rate pulse) + /app/admin/prices + price lock on proforma.
 */
export const parkedPathPrefixes: string[] = [
  "/app/intelligence",
  "/app/relationship",
  "/app/commerce/promotions",
  "/app/product/designs",
  "/app/commerce/pricing/rules",
  "/app/commerce/pricing/simulator",
  "/app/commerce/pricing/rate-requests",
  "/app/pricing/rules",
  "/app/pricing/simulator",
  "/app/pricing/rate-requests",
  "/app/qc/designs",
  "/app/producer/designs",
  "/app/producer/capacity",
  "/app/producer/releases",
];

function pathMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isParkedPath(pathname: string): boolean {
  return parkedPathPrefixes.some((prefix) => pathMatchesPrefix(pathname, prefix));
}

export function matchRoutePermissionGate(
  pathname: string,
): RoutePermissionGate | null {
  let best: RoutePermissionGate | null = null;
  for (const gate of routePermissionGates) {
    if (!pathMatchesPrefix(pathname, gate.prefix)) continue;
    if (!best || gate.prefix.length > best.prefix.length) best = gate;
  }
  return best;
}

/** True when a sensitive path exists and the role lacks every required grant. */
export function pathPermissionDenied(
  role: RoleId | null | undefined,
  pathname: string,
): boolean {
  if (isParkedPath(pathname)) return true;
  const gate = matchRoutePermissionGate(pathname);
  if (!gate) return false;
  if (!role) return true;
  if (role === "admin") return false;
  return !gate.anyOf.some((perm) => roleHasPermission(role, perm));
}
