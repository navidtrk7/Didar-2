"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = async () => {
      try {
        // Drop stale workers/caches from previous deploys (avoids server-action 500s)
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.update()));
        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(
            keys
              .filter((k) => k.startsWith("didar-shell-") && k !== "didar-shell-v2")
              .map((k) => caches.delete(k)),
          );
        }
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // ignore registration failures in unsupported contexts
      }
    };

    void register();
  }, []);

  return null;
}
