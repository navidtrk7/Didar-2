"use client";

import { FulfillmentBoard } from "@/components/fulfillment-board";

export default function FulfillmentPickPage() {
  return (
    <FulfillmentBoard
      title="برداشت"
      description="برداشت کالاهای تخصیص‌یافته از خزانه."
      filterStage="picking"
      allowAdvance
    />
  );
}
