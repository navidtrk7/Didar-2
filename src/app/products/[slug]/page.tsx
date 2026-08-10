"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { getCatalogProduct, catalogProducts } from "@/data/catalog";
import { LIVE_GOLD } from "@/data/mock";
import { brand } from "@/data/brand";
import { formatMoney, formatNumber, formatWeight } from "@/lib/utils";
import { gramPriceFrom18, type TgjuSnapshot } from "@/lib/tgju";
import { Button, Panel } from "@/components/ui";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const product = getCatalogProduct(slug);
  const [rate, setRate] = useState(LIVE_GOLD.pricePerGram);
  const [rateLive, setRateLive] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/prices", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as TgjuSnapshot;
        if (!cancelled && data.geram18Toman) {
          setRate(data.geram18Toman);
          setRateLive(true);
        }
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--mist)] px-5">
        <p className="text-[var(--muted)]">محصول یافت نشد.</p>
        <Link href="/catalog">
          <Button>بازگشت به کاتالوگ</Button>
        </Link>
      </div>
    );
  }

  const pricePerGram = gramPriceFrom18(rate, product.karat);
  const metalValue = product.weightGrams * pricePerGram;
  const related = catalogProducts.filter(
    (p) => p.collectionId === product.collectionId && p.slug !== product.slug,
  );

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
        <Link href="/catalog">
          <Button variant="secondary">کاتالوگ</Button>
        </Link>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          <ArrowRight size={16} />
          کاتالوگ
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-[var(--line)] bg-[#F3F1EC]">
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div>
            <p className="text-[11px] font-semibold text-[var(--gold-deep)]">
              کالکشن {product.collection}
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-tight sm:text-5xl">
              {product.name}
            </h1>
            <p className="mt-4 text-base leading-8 text-[var(--muted)]">
              {product.description}
            </p>

            <Panel className="mt-6 grid grid-cols-2 gap-4 p-5">
              <div>
                <p className="text-xs text-[var(--muted)]">دسته</p>
                <p className="mt-1 font-semibold">{product.categoryFa}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">عیار</p>
                <p className="mt-1 font-semibold">
                  {formatNumber(product.karat)} عیار · {product.goldType}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">وزن</p>
                <p className="mt-1 font-semibold tabular-nums">
                  {formatWeight(product.weightGrams)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">
                  ارزش تقریبی فلز
                  {!rateLive ? " (کش)" : ""}
                </p>
                <p className="mt-1 font-semibold tabular-nums">
                  {formatMoney(metalValue)}
                </p>
              </div>
            </Panel>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/enter?next=%2Fapp%2Fretailer%2Fcatalog">
                <Button>
                  سفارش از میز فروش
                  <ArrowLeft size={16} />
                </Button>
              </Link>
              <a href={product.brandUrl} target="_blank" rel="noreferrer">
                <Button variant="secondary">
                  صفحه برند
                  <ExternalLink size={14} />
                </Button>
              </a>
            </div>
          </div>
        </div>

        {related.length ? (
          <section className="mt-16">
            <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
              از همین کالکشن
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <Link
                  key={p.slug}
                  href={`/products/${p.slug}`}
                  className="group overflow-hidden rounded-2xl border border-[var(--line)] bg-white transition-all hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/3] bg-[#F3F1EC]">
                    <Image
                      src={p.imageUrl}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-semibold">{p.name}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {formatWeight(p.weightGrams)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
