"use client";

import { FulfillmentBoard } from "@/components/fulfillment-board";

export default function FulfillmentHandoverPage() {
  return (
    <FulfillmentBoard
      title="تحویل به ایجنت"
      description="انتقال حضانت از انبار به ایجنت؛ سپس آماده‌سازی کد تأیید."
      filterStage="handover"
      allowAdvance
    />
  );
}
