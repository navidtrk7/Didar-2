"use client";

import { ServiceLifecycleBoard } from "@/components/service-lifecycle-board";

export default function ServiceReturnPage() {
  return (
    <ServiceLifecycleBoard
      kind="return"
      title="مرجوعی (Return)"
      description="دامنه خدمات · بازگشت کالا به خزانه و حضانت دیدار."
    />
  );
}
