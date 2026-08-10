"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { catalogCollections, catalogProducts } from "@/data/catalog";
import { brand } from "@/data/brand";
import { formatNumber, formatWeight } from "@/lib/utils";
import { GoldTicker } from "@/components/gold-ticker";
import { Button } from "@/components/ui";

function CatalogContent() {
  const searchParams = useSearchParams();
  const initial =
    searchParams.get("collection") &&
    catalogCollections.some((c) => c.id === searchParams.get("collection"))
      ? (searchParams.get("collection") as string)
      : "all";

  const [collectionId, setCollectionId] = useState(initial);

  useEffect(() => {
    setCollectionId(initial);
  }, [initial]);

  const items = useMemo(() => {
    if (collectionId === "all") return catalogProducts;
    return catalogProducts.filter((p) => p.collectionId === collectionId);
  }, [collectionId]);

  return (
    <div className="min-h-screen bg-[var(--mist)] text-[var(--ink)]">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={36}
            height={36}
            className="rounded-xl object-contain ring-1 ring-[var(--line)]"
          />
          <span className="font-[family-name:var(--font-display)] text-2xl">
            {brand.nameFa}
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <GoldTicker className="hidden md:inline-flex" />
          <Link href="/enter">
            <Button>ورود</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          <ArrowRight size={16} />
          بازگشت
        </Link>

        <div className="mt-6">
          <p className="text-[11px] font-semibold text-[var(--muted)]">
            ویترین برند · didargold.com
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-tight">
            کالکشن‌ها و قطعات
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
            نمایش بازاریابی برند — موجودی قابل سفارش و شناسه کالا در میز فروش
            سامانه ثبت می‌شود، نه در این ویترین.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCollectionId("all")}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              collectionId === "all"
                ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--gold)]"
            }`}
          >
            همه
          </button>
          {catalogCollections.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCollectionId(c.id)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                collectionId === c.id
                  ? "border-[var(--ink)] bg-[var(--ink)] text-white"
                  : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--gold)]"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {items.map((product, i) => (
            <motion.div
              key={product.slug}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/products/${product.slug}`}
                className="group block overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-white shadow-[0_10px_30px_-22px_rgba(4,30,66,0.45)] transition-all active:scale-[0.99] hover:-translate-y-1 hover:border-[var(--gold)]/45"
              >
                <div className="relative aspect-square bg-[#F3F1EC]">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
                <div className="space-y-1 p-3.5 sm:p-4">
                  <p className="text-[12px] font-semibold text-[var(--gold-deep)]">
                    {product.collection}
                  </p>
                  <h2 className="truncate text-[15px] font-semibold text-[var(--ink)] sm:text-lg">
                    {product.name}
                  </h2>
                  <p className="text-[13px] leading-5 text-[var(--muted)]">
                    {product.categoryFa} · {formatNumber(product.karat)} عیار ·{" "}
                    {formatWeight(product.weightGrams)}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <section className="mt-16">
          <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
            کالکشن‌ها
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {catalogCollections.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCollectionId(c.id);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white text-right transition-all hover:border-[var(--gold)]/40"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={c.image}
                    alt={c.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-semibold">{c.name}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    {c.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">
          در حال بارگذاری کاتالوگ…
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
