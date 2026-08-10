"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PricingRulesLegacyRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/commerce/pricing/rules");
  }, [router]);
  return null;
}
