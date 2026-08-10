import { Badge } from "./ui";
import type {
  AssetStatus,
  DeliveryStatus,
  OrderStatus,
} from "@/data/types";
import {
  assetStatusLabels,
  deliveryStatusLabels,
  orderStatusLabels,
} from "@/data/labels";

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  const tones: Record<AssetStatus, "warn" | "info" | "ok" | "gold" | "neutral" | "danger"> = {
    pending_qc: "warn",
    awaiting_uid: "info",
    available: "ok",
    reserved: "gold",
    in_transit: "info",
    delivered: "neutral",
    qc_hold: "warn",
    discrepancy: "danger",
    buyback: "warn",
    returned: "info",
    secondary: "gold",
  };
  return <Badge tone={tones[status]}>{assetStatusLabels[status]}</Badge>;
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tones = {
    draft: "neutral" as const,
    submitted: "info" as const,
    confirmed: "gold" as const,
    picking: "warn" as const,
    shipped: "info" as const,
    delivered: "ok" as const,
    cancelled: "danger" as const,
  };
  return <Badge tone={tones[status]}>{orderStatusLabels[status]}</Badge>;
}

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  const tones = {
    scheduled: "neutral" as const,
    picking: "warn" as const,
    packing: "gold" as const,
    handover: "info" as const,
    en_route: "info" as const,
    awaiting_otp: "warn" as const,
    completed: "ok" as const,
    failed: "danger" as const,
  };
  return <Badge tone={tones[status]}>{deliveryStatusLabels[status]}</Badge>;
}
