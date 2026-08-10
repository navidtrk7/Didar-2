"use client";

import { FulfillmentBoard } from "@/components/fulfillment-board";

export default function FulfillmentPackPage() {
  return (
    <FulfillmentBoard
      title="بسته‌بندی"
      description="بسته‌بندی قبل از تحویل به ایجنت."
      filterStage="packing"
      allowAdvance
    />
  );
}
