"use client";

import { ServiceLifecycleBoard } from "@/components/service-lifecycle-board";

export default function ServiceBuybackPage() {
  return (
    <ServiceLifecycleBoard
      kind="buyback"
      title="بازخرید (Buyback)"
      description="فقط قطعهٔ delivered · پیشنهاد نرخ دیدار · بستن پرونده از مسیر آداپتر زرین (test تا کلید واقعی)."
    />
  );
}
