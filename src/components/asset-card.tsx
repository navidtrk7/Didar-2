"use client";

import Image from "next/image";
import Link from "next/link";
import type { Asset } from "@/data/types";
import {
  formatMoney,
  formatNumber,
  formatWeight,
  resolveProductImage,
} from "@/lib/utils";
import { categoryLabels } from "@/data/labels";
import { resolveGoldRate } from "@/lib/gold-rate";
import { gramPriceFrom18 } from "@/lib/tgju";
import { AssetStatusBadge } from "./status";
import { Panel } from "./ui";
import { motion } from "framer-motion";

export function AssetCard({
  asset,
  index = 0,
  href,
  ratePerGram,
}: {
  asset: Asset;
  index?: number;
  href?: string;
  /** 18k rate from platform/API; falls back to offline mock only if omitted. */
  ratePerGram?: number;
}) {
  const pricePerGram = gramPriceFrom18(
    resolveGoldRate(ratePerGram),
    asset.karat,
  );
  const metalValue = asset.weightGrams * pricePerGram;
  const to = href ?? (asset.slug ? `/products/${asset.slug}` : undefined);

  const card = (
    <Panel className="overflow-hidden transition-transform duration-300 hover:-translate-y-1">
      <div className="relative h-44 bg-[#F3F1EC]">
        <Image
          src={resolveProductImage(asset.imageUrl)}
          alt={asset.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 25vw"
          priority={index < 4}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <div>
            <p className="font-[family-name:var(--font-display)] text-lg text-white drop-shadow-md">
              {formatNumber(asset.karat)} عیار
            </p>
            <p className="text-xs font-medium text-white">
              {formatWeight(asset.weightGrams)}
            </p>
          </div>
          <AssetStatusBadge status={asset.status} />
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-[var(--ink)]">{asset.name}</h3>
            <span className="shrink-0 text-[11px] text-[var(--muted)]">
              {categoryLabels[asset.category]}
            </span>
          </div>
          {asset.collection ? (
            <p className="mt-0.5 text-[11px] text-[var(--gold-deep)]">
              کالکشن {asset.collection}
            </p>
          ) : null}
          <p className="mt-0.5 font-mono text-[11px] text-[var(--muted)]" data-ltr>
            {asset.uid}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-[var(--muted)]">ارزش فلز</p>
            <p className="font-semibold tabular-nums">
              {formatMoney(metalValue)}
            </p>
          </div>
          <div>
            <p className="text-[var(--muted)]">اجرت ساخت</p>
            <p className="font-semibold tabular-nums">
              {formatMoney(asset.craftFee)}
            </p>
          </div>
          <div>
            <p className="text-[var(--muted)]">موقعیت</p>
            <p className="font-medium">{asset.location}</p>
          </div>
          <div>
            <p className="text-[var(--muted)]">مسئول نگهداری</p>
            <p className="font-medium">{asset.custodian}</p>
          </div>
        </div>
      </div>
    </Panel>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      {to ? (
        <Link href={to} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)] rounded-2xl">
          {card}
        </Link>
      ) : (
        card
      )}
    </motion.div>
  );
}
