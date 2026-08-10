"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy role-folder entry — AuthGate also redirects here. */
export default function PricingLegacyRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/commerce/pricing");
  }, [router]);
  return null;
}
