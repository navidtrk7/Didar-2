"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PricingRateRequestsLegacyRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/commerce/pricing/rate-requests");
  }, [router]);
  return null;
}
