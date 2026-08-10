import { LIVE_GOLD } from "@/data/mock";

/** Prefer platform/API gold rate; mock only for local offline fallback. */
export function resolveGoldRate(liveGoldPrice?: number | null): number {
  if (typeof liveGoldPrice === "number" && liveGoldPrice > 0) {
    return liveGoldPrice;
  }
  return LIVE_GOLD.pricePerGram;
}
