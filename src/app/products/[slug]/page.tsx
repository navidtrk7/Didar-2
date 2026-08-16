"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Plus,
  QrCode,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { getCatalogProduct, catalogProducts } from "@/data/catalog";
import { LIVE_GOLD } from "@/data/mock";
import { brand } from "@/data/brand";
import { formatMoney, formatNumber, formatWeight } from "@/lib/utils";
import { gramPriceFrom18, type TgjuSnapshot } from "@/lib/tgju";
import { Button, Panel } from "@/components/ui";
import { useCart } from "@/context/cart-context";
import { CartDrawer } from "@/components/cart-drawer";
import { useToast } from "@/components/toast";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const product = getCatalogProduct(slug);
  const { addItem, openCart, totalItems } = useCart();
  const { toast } = useToast();

  const [rate, setRate] = useState(LIVE_GOLD.pricePerGram);
  const [rateLive, setRateLive] = useState(false);
  const [added, setAdded] = useState(false);

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
  const grandTotal = metalValue + product.estimatedCraftFee;

  const related = catalogProducts.filter(
    (p) => p.collectionId === product.collectionId && p.slug !== product.slug,
  );

  const handleAddToCart = () => {
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    toast(`«${product.name}» به سبد سفارش اضافه شد.`, "ok");
  };

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
          <button
            type="button"
            onClick={openCart}
            className="relative inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--ink)] shadow-sm hover:border-[var(--gold-deep)] transition-all"
          >
            <ShoppingBag size={17} className="text-[var(--gold-deep)]" />
            <span className="hidden sm:inline">سبد خرید</span>
            {totalItems > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gold-deep)] text-[10px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>
          <Link href="/catalog">
            <Button variant="secondary">کاتالوگ</Button>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 pb-16 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          <ArrowRight size={16} />
          بازگشت به فروشگاه
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
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-mono px-3 py-1 rounded-xl">
              کد شناسنامه: {product.uidCode}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[var(--gold-deep)]/15 px-2.5 py-1 text-xs font-bold text-[var(--gold-deep)]">
                کالکشن {product.collection}
              </span>
              <span className="text-xs text-[var(--muted)]">
                شناسنامه معتبر ۱۸ عیار
              </span>
            </div>

            <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-tight sm:text-4xl text-[var(--ink)]">
              {product.name}
            </h1>
            <p className="mt-3 text-sm leading-8 text-[var(--muted)]">
              {product.description}
            </p>

            <Panel className="mt-6 grid grid-cols-2 gap-4 p-5">
              <div>
                <p className="text-xs text-[var(--muted)]">دسته‌بندی</p>
                <p className="mt-1 font-semibold">{product.categoryFa}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">عیار استاندارد</p>
                <p className="mt-1 font-semibold">
                  {formatNumber(product.karat)} عیار · ۷۵۰
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">وزن دقیق قطعه</p>
                <p className="mt-1 font-semibold tabular-nums">
                  {formatWeight(product.weightGrams)}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">
                  اجرت ساخت
                </p>
                <p className="mt-1 font-semibold tabular-nums">
                  {formatNumber(product.craftFeePct)}٪ ({formatMoney(product.estimatedCraftFee)})
                </p>
              </div>
              <div className="col-span-2 border-t border-[var(--line)] pt-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[var(--muted)]">مبلغ کل برآورد شده</p>
                  <p className="mt-0.5 text-lg font-bold text-[var(--gold-deep)] tabular-nums">
                    {formatMoney(grandTotal)}
                  </p>
                </div>
                <div className="text-left text-xs text-[var(--muted)]">
                  گارانتی: ۲۴ ماهه سراسری
                </div>
              </div>
            </Panel>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={handleAddToCart}
                className={`py-3 px-6 text-sm font-bold ${
                  added ? "bg-emerald-600 hover:bg-emerald-700" : ""
                }`}
              >
                {added ? (
                  <>
                    <Check size={16} />
                    به سبد اضافه شد
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    افزودن به سبد سفارش
                  </>
                )}
              </Button>

              <Link href="/enter?next=%2Fapp%2Fretailer%2Fcatalog">
                <Button variant="secondary">
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
                  className="group overflow-hidden rounded-2xl border border-[var(--line)] bg-white transition-all hover:-translate-y-1 hover:border-[var(--gold)]/50"
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
                    <p className="font-semibold text-sm">{p.name}</p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {formatWeight(p.weightGrams)} · {p.categoryFa}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <CartDrawer goldRate={pricePerGram} />
    </div>
  );
}
