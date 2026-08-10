"use client";

import { useCallback, useEffect, useState } from "react";
import { systemSettingsSeed } from "@/data/platform";
import type { SystemSettings } from "@/data/types";
import { apiEnabled, didarApi } from "@/lib/api";

const KEY = "didar.system.settings";

function readSettings(): SystemSettings {
  if (typeof window === "undefined") return systemSettingsSeed;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return systemSettingsSeed;
    return { ...systemSettingsSeed, ...JSON.parse(raw) };
  } catch {
    return systemSettingsSeed;
  }
}

function mapFromApi(s: {
  weight_tolerance_grams: number;
  price_lock_minutes: number;
  proforma_ttl_minutes: number;
  default_karat: number;
  rate_source: string;
  currency: string;
}): SystemSettings {
  return {
    weightToleranceGrams: s.weight_tolerance_grams,
    priceLockMinutes: s.price_lock_minutes,
    proformaTtlMinutes: s.proforma_ttl_minutes,
    defaultKarat: s.default_karat as SystemSettings["defaultKarat"],
    rateSource: s.rate_source as SystemSettings["rateSource"],
    currency: s.currency as SystemSettings["currency"],
  };
}

function toApiBody(next: SystemSettings) {
  return {
    weight_tolerance_grams: next.weightToleranceGrams,
    price_lock_minutes: next.priceLockMinutes,
    proforma_ttl_minutes: next.proformaTtlMinutes,
    default_karat: next.defaultKarat,
    rate_source: next.rateSource,
    currency: next.currency,
  };
}

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(systemSettingsSeed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (apiEnabled()) {
        try {
          const data = await didarApi.platform();
          if (!cancelled) {
            setSettings(mapFromApi(data.settings));
            setReady(true);
          }
        } catch {
          if (!cancelled) {
            setSettings(systemSettingsSeed);
            setReady(true);
          }
        }
        return;
      }
      if (!cancelled) {
        setSettings(readSettings());
        setReady(true);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = useCallback(async (next: SystemSettings) => {
    setSettings(next);
    if (apiEnabled()) {
      await didarApi.patchSettings(toApiBody(next));
      return;
    }
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const reset = useCallback(() => {
    void save(systemSettingsSeed);
  }, [save]);

  return { settings, save, reset, ready };
}
