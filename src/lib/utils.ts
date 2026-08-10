import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Public catalog placeholder when SKU/asset has no photo. */
export const DEFAULT_PRODUCT_IMAGE = "/products/product-01.jpg";

export function resolveProductImage(url?: string | null): string {
  const u = (url ?? "").trim();
  return u || DEFAULT_PRODUCT_IMAGE;
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat("fa-IR", options).format(value);
}

export function formatWeight(grams: number) {
  if (grams >= 1000) {
    return `${formatNumber(grams / 1000, { maximumFractionDigits: 3 })} کیلوگرم`;
  }
  return `${formatNumber(grams, { maximumFractionDigits: 2 })} گرم`;
}

/** مبلغ به تومان */
export function formatMoney(amount: number) {
  return `${formatNumber(amount, { maximumFractionDigits: 0 })} تومان`;
}

export function formatRial(amount: number) {
  return formatMoney(amount);
}

export function formatCompact(n: number) {
  return new Intl.NumberFormat("fa-IR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

export function formatPercent(n: number, digits = 1) {
  return `${formatNumber(n, { maximumFractionDigits: digits })}٪`;
}
