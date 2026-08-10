"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Legacy retailer path — AuthGate redirects to commerce orders. */
export default function RetailerOrdersLegacyRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/app/commerce/orders");
  }, [router]);
  return null;
}
