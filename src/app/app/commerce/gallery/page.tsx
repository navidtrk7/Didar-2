"use client";

import { useMemo } from "react";
import { usePlatform } from "@/context/platform-context";
import { useSession } from "@/context/session-context";
import type { Asset } from "@/data/types";
import { AssetCard } from "@/components/asset-card";
import { Button, EmptyHint, SectionHeader, Stat } from "@/components/ui";
import { formatNumber, formatWeight } from "@/lib/utils";

function isGalleryAsset(a: Asset, agentName?: string | null, org?: string | null) {
  const loc = a.location || "";
  const cust = a.custodian || "";
  if (loc.includes("گالری سیار")) return true;
  if (agentName && cust.includes(agentName)) return true;
  if (org && (cust.includes(org) || loc.includes(org))) return true;
  if (["available", "reserved", "in_transit"].includes(a.status)) {
    return loc.includes("گالری") || cust.includes("ایجنت");
  }
  return false;
}

export default function CommerceGalleryPage() {
  const { user } = useSession();
  const { assets, issuedAssets, proformas, creditAccounts } = usePlatform();

  const pool = useMemo(() => {
    const fromPlatform = assets.filter((a) =>
      isGalleryAsset(a, user?.name, user?.org),
    );

    const issuedAsAssets: Asset[] = issuedAssets
      .filter((a) => a.status === "available" || !a.status)
      .map((a) => ({
        id: a.id,
        uid: a.uid,
        name: a.name,
        slug: a.skuId,
        category: a.category,
        karat: a.karat,
        weightGrams: a.weightGrams,
        craftFee: Math.round(a.weightGrams * 18_578_200 * (a.craftFeePct / 100)),
        status: "available" as const,
        producer: "خانه ساخت دیدار گلد",
        location: a.location || "گالری سیار — تازه صادر",
        custodian: user?.name || "ایجنت",
        imageTone: "#041E42",
        imageUrl: a.imageUrl,
        createdAt: a.issuedAt,
      }));

    const byUid = new Map<string, Asset>();
    for (const a of [...fromPlatform, ...issuedAsAssets]) {
      if (!byUid.has(a.uid)) byUid.set(a.uid, a);
    }
    const merged = [...byUid.values()];
    if (merged.length) return merged;

    // Fallback: all available pieces from live inventory
    return assets.filter((a) => a.status === "available" && Boolean(a.uid));
  }, [assets, issuedAssets, user?.name, user?.org]);

  const weight = pool.reduce((s, a) => s + a.weightGrams, 0);

  return (
    <div>
      <SectionHeader
        title="گالری سیار"
        description="موجودی قابل فروش تحت حضانت ایجنت — از دامنه Inventory / Commerce."
        action={
          <Button href="/app/commerce/proforma">پیش‌فاکتور</Button>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="تعداد قلم" value={formatNumber(pool.length)} />
        <Stat label="وزن همراه" value={formatWeight(weight)} />
        <Stat
          label="خرده‌فروشان فعال"
          value={formatNumber(creditAccounts.length)}
          hint={`${formatNumber(proformas.length)} پیش‌فاکتور`}
        />
      </div>
      {pool.length === 0 ? (
        <EmptyHint>هنوز کالایی در گالری سیار نیست.</EmptyHint>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pool.map((asset, i) => (
            <AssetCard key={asset.id} asset={asset} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
