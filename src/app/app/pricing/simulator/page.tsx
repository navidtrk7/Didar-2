"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PricingSimulatorLegacyRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/commerce/pricing/simulator");
  }, [router]);
  return null;
}
