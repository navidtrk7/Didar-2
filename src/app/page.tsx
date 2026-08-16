"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  Filter,
  Gem,
  LogOut,
  Plus,
  QrCode,
  RotateCcw,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Users,
} from "lucide-react";
import { GoldTicker } from "@/components/gold-ticker";
import { VaultVisual } from "@/components/vault-visual";
import { Button, Input } from "@/components/ui";
import {
  catalogCategories,
  catalogCollections,
  catalogProducts,
  getFilteredProducts,
  type CatalogCategoryKey,
  type CatalogProduct,
} from "@/data/catalog";
import { LIVE_GOLD } from "@/data/mock";
import { brand } from "@/data/brand";
import { roleLabels } from "@/data/labels";
import { useSession } from "@/context/session-context";
import { useCart } from "@/context/cart-context";
import { formatMoney, formatNumber, formatWeight } from "@/lib/utils";
import { gramPriceFrom18, type TgjuSnapshot } from "@/lib/tgju";
import { CartDrawer } from "@/components/cart-drawer";
import { AuthenticitySection } from "@/components/authenticity-section";
import { useToast } from "@/components/toast";

export default function HomePage() {
  const { isAuthenticated, user, role, isAdmin, homePath, logout } =
    useSession();
  const { addItem, openCart, totalItems, totalWeightGrams } = useCart();
  const { toast } = useToast();

  const [rate, setRate] = useState(LIVE_GOLD.pricePerGram);
  const [rateLive, setRateLive] = useState(false);

  // Category and Collection Filters
  const [selectedCategory, setSelectedCategory] =
    useState<CatalogCategoryKey>("all");
  const [selectedCollection, setSelectedCollection] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Added animation tracker for quick feedback on click
  const [addedSlug, setAddedSlug] = useState<string | null>(null);

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

  const pricePerGram18 = useMemo(() => gramPriceFrom18(rate, 18), [rate]);

  const filteredProducts = useMemo(() => {
    let list = getFilteredProducts(selectedCollection, selectedCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.categoryFa.toLowerCase().includes(q) ||
          p.collection.toLowerCase().includes(q) ||
          p.uidCode.toLowerCase().includes(q),
      );
    }
    return list;
  }, [selectedCollection, selectedCategory, searchQuery]);

  const handleAddToCart = (product: CatalogProduct) => {
    addItem(product, 1);
    setAddedSlug(product.slug);
    setTimeout(() => setAddedSlug(null), 1800);
    toast(`«${product.name}» به سبد سفارش اضافه شد.`, "ok");
  };

  return (
    <div className="min-h-screen bg-[var(--mist)] text-[var(--ink)]">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,162,39,0.16),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(26,58,58,0.12),transparent_40%),linear-gradient(180deg,#F7F9FB_0%,#E8EEF2_100%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)]/70 bg-[var(--surface-glass)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-3 sm:px-8 sm:py-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <Image
              src="/icons/icon-192.png"
              alt="لوگوی دیدار گلد"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 rounded-xl bg-[var(--mist)] object-contain ring-1 ring-[var(--line)]"
              priority
            />
            <p className="truncate font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--ink)] sm:text-3xl">
              دیدار گلد
            </p>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[var(--ink)]">
            <a
              href="#storefront"
              className="transition-colors hover:text-[var(--gold-deep)]"
            >
              فروشگاه و محصولات
            </a>
            <a
              href="#collections"
              className="transition-colors hover:text-[var(--gold-deep)]"
            >
              کالکشن‌ها
            </a>
            <a
              href="#authenticity"
              className="transition-colors hover:text-[var(--gold-deep)]"
            >
              اصالت و گارانتی
            </a>
            <Link
              href="/catalog"
              className="transition-colors hover:text-[var(--gold-deep)]"
            >
              کاتالوگ جامع
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <GoldTicker className="hidden xl:inline-flex" />

            {/* Shopping Cart Button */}
            <button
              type="button"
              onClick={openCart}
              className="relative inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line)] bg-white/90 px-3.5 py-2 text-sm font-semibold text-[var(--ink)] shadow-sm backdrop-blur-md transition-all hover:border-[var(--gold-deep)] hover:bg-white active:scale-95"
              aria-label="سبد خرید"
            >
              <div className="relative">
                <ShoppingBag size={19} className="text-[var(--gold-deep)]" />
                {totalItems > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--gold-deep)] text-[10px] font-bold text-white shadow-sm animate-in zoom-in-75">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">سبد سفارش</span>
              {totalItems > 0 && (
                <span className="hidden md:inline text-xs text-[var(--muted)] border-r border-[var(--line)] pr-2 tabular-nums">
                  {formatWeight(totalWeightGrams)}
                </span>
              )}
            </button>

            {isAuthenticated && user ? (
              <>
                <div className="hidden text-left lg:block">
                  <p className="text-xs text-[var(--muted)]">وارد شده</p>
                  <p className="text-sm font-semibold truncate max-w-[130px]">
                    {user.name}
                    {role ? ` · ${roleLabels[role]}` : ""}
                  </p>
                </div>
                <Link href={homePath}>
                  <Button className="min-h-11 px-3 sm:px-4">
                    {isAdmin ? "پنل مدیریت" : "میز کار"}
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  className="min-h-11 px-3"
                  onClick={() => logout()}
                  aria-label="خروج"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">خروج</span>
                </Button>
              </>
            ) : (
              <Link href="/enter">
                <Button className="min-h-11 px-4">ورود همکاران</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative">
          <VaultVisual />
          <div className="absolute inset-0 flex items-end">
            <div className="mx-auto w-full max-w-7xl px-5 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-24 sm:px-8 sm:pb-14">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="max-w-3xl"
              >
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-black/40 px-3.5 py-1 backdrop-blur-md text-[12px] font-semibold tracking-wide text-white/95 border border-white/15">
                  <Sparkles size={14} className="text-[var(--gold)]" />
                  <span>پلتفرم تخصصی سفارش عمده و بنکداری طلا و جواهر ۱۸ عیار</span>
                </div>
                <h1 className="font-[family-name:var(--font-display)] text-[2.5rem] leading-[1.15] text-white drop-shadow-md sm:text-5xl md:text-6xl">
                  ویترین فروشگاهی دیدار گلد
                </h1>
                <p className="mt-4 max-w-2xl text-[15px] leading-8 text-white/92 sm:text-lg">
                  تامین مستقیم طلا و جواهرات با طراحی اختصاصی، تضمین عیار استاندارد ۷۵۰، صدور
                  پیش‌فاکتور آنی و ثبت سفارش ویژه خرده‌فروشان و گالری‌های طلا در سراسر کشور.
                </p>
                <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                  <a href="#storefront" className="w-full sm:w-auto">
                    <Button variant="onDark" className="w-full sm:w-auto text-base py-3">
                      مشاهده و سفارش آنلاین محصولات
                      <ArrowLeft size={16} />
                    </Button>
                  </a>
                  <a href="#authenticity" className="w-full sm:w-auto">
                    <Button variant="onDarkGhost" className="w-full sm:w-auto py-3">
                      استعلام اصالت و گارانتی
                      <ShieldCheck size={16} />
                    </Button>
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Live Market Bar / Quick Features */}
        <section className="border-b border-[var(--line)] bg-white/70 py-4 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-[var(--ink)]">
                <Scale size={16} className="text-[var(--gold-deep)]" />
                <span>نرخ پایه طلای ۱۸ عیار امروز:</span>
                <strong className="font-mono text-sm sm:text-base text-[var(--gold-deep)]">
                  {formatMoney(pricePerGram18)}
                </strong>
                <span className="text-[11px] text-[var(--muted)]">/ هر گرم</span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--muted)]">
                <span className="flex items-center gap-1">
                  <Check size={14} className="text-emerald-600" />
                  عیار استاندارد ۱۸ (۷۵۰)
                </span>
                <span className="flex items-center gap-1">
                  <Check size={14} className="text-emerald-600" />
                  شناسنامه هولوگرام‌دار UID
                </span>
                <span className="flex items-center gap-1">
                  <Check size={14} className="text-emerald-600" />
                  ارسال بیمه‌شده سراسری
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* STOREFRONT & PRODUCT CATALOG SECTION */}
        <section id="storefront" className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--gold-deep)]">
                <Store size={15} />
                <span>ویترین فروشگاهی محصولات دیدار · ۱۸ عیار</span>
              </div>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl sm:text-4xl text-[var(--ink)] tracking-tight">
                سفارش آنلاین طلا و جواهرات
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[var(--muted)] max-w-xl leading-6">
                قطعات مورد نظر خود را به سبد خرید اضافه کنید. قیمت‌ها بر اساس نرخ زنده طلا و اجرت
                ساخت به صورت لحظه‌ای محاسبه می‌شوند.
              </p>
            </div>

            {/* Quick Search */}
            <div className="w-full md:w-72">
              <Input
                placeholder="جستجوی نام قطعه، کد UID یا نوع کالا…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Categories Bar */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--muted)]">
                دسته‌بندی محصولات:
              </span>
              <span className="text-xs text-[var(--muted)]">
                نمایش {formatNumber(filteredProducts.length)} محصول
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {catalogCategories.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                      active
                        ? "border border-[var(--ink)] bg-[var(--ink)] text-white shadow-sm"
                        : "border border-[var(--line)] bg-white text-[var(--ink)] hover:border-[var(--gold-deep)]/40 hover:bg-white"
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Collections Filter Bar */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-[var(--muted)] ml-2">کالکشن:</span>
            <button
              type="button"
              onClick={() => setSelectedCollection("all")}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                selectedCollection === "all"
                  ? "bg-[var(--gold-deep)] text-white font-semibold"
                  : "bg-white/80 text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)]"
              }`}
            >
              همه کالکشن‌ها
            </button>
            {catalogCollections.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCollection(c.id)}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  selectedCollection === c.id
                    ? "bg-[var(--gold-deep)] text-white font-semibold"
                    : "bg-white/80 text-[var(--muted)] hover:text-[var(--ink)] border border-[var(--line)]"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, i) => {
              const metalValue = product.weightGrams * pricePerGram18;
              const totalPrice = metalValue + product.estimatedCraftFee;
              const isAdded = addedSlug === product.slug;

              return (
                <motion.div
                  key={product.slug}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: (i % 8) * 0.04 }}
                  className="group flex flex-col justify-between overflow-hidden rounded-[1.35rem] border border-[var(--line)] bg-white shadow-[0_8px_24px_-16px_rgba(4,30,66,0.35)] transition-all hover:-translate-y-1 hover:border-[var(--gold-deep)]/45 hover:shadow-lg"
                >
                  <div>
                    {/* Image Box */}
                    <div className="relative aspect-square bg-[#F3F1EC] overflow-hidden">
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                      {/* Top Badges */}
                      <div className="absolute inset-x-3 top-3 flex items-center justify-between pointer-events-none">
                        <span className="rounded-lg bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                          {product.collection}
                        </span>
                        <span className="rounded-lg bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm backdrop-blur-md font-mono">
                          {product.uidCode}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
                        <span>{product.categoryFa}</span>
                        <span className="font-semibold text-emerald-700">
                          {formatNumber(product.karat)} عیار (۷۵۰)
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-[var(--ink)] truncate">
                        <Link
                          href={`/products/${product.slug}`}
                          className="hover:text-[var(--gold-deep)] transition-colors"
                        >
                          {product.name}
                        </Link>
                      </h3>

                      {/* Specs */}
                      <div className="rounded-xl bg-[var(--mist)] p-2.5 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">وزن قطعه:</span>
                          <span className="font-semibold tabular-nums text-[var(--ink)]">
                            {formatWeight(product.weightGrams)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--muted)]">اجرت ساخت:</span>
                          <span className="text-[var(--ink)] tabular-nums">
                            {formatNumber(product.craftFeePct)}٪ (
                            {formatMoney(product.estimatedCraftFee)})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="border-t border-[var(--line)] p-4 bg-white/50 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-[var(--muted)]">ارزش تقریبی کل:</span>
                      <span className="font-bold text-base text-[var(--gold-deep)] tabular-nums">
                        {formatMoney(totalPrice)}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <Link
                        href={`/products/${product.slug}`}
                        className="col-span-1"
                        title="مشاهده جزئیات"
                      >
                        <Button
                          variant="secondary"
                          className="w-full p-2 h-10 flex items-center justify-center"
                        >
                          <Eye size={16} />
                        </Button>
                      </Link>

                      <Button
                        onClick={() => handleAddToCart(product)}
                        className={`col-span-3 h-10 text-xs font-semibold transition-all ${
                          isAdded
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : ""
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check size={16} />
                            <span>اضافه شد</span>
                          </>
                        ) : (
                          <>
                            <Plus size={16} />
                            <span>افزودن به سبد</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="mt-12 rounded-2xl border border-[var(--line)] bg-white p-12 text-center space-y-3">
              <Store size={40} className="mx-auto text-[var(--muted)]" />
              <h3 className="font-semibold text-base">محصولی در این دسته‌بندی یافت نشد</h3>
              <p className="text-xs text-[var(--muted)]">
                فیلترها را تغییر داده یا جستجوی خود را پاک کنید.
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedCollection("all");
                  setSearchQuery("");
                }}
              >
                نمایش همه محصولات
              </Button>
            </div>
          )}
        </section>

        {/* FEATURED COLLECTIONS SECTION */}
        <section id="collections" className="border-t border-[var(--line)] bg-white/50 py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-xs font-semibold text-[var(--gold-deep)]">
                  خطوط طراحی دیدار
                </p>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl sm:text-4xl tracking-tight">
                  کالکشن‌های اختصاصی
                </h2>
              </div>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--gold-deep)] hover:underline"
              >
                مشاهده در کاتالوگ جامع
                <ArrowLeft size={16} />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {catalogCollections.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div
                    onClick={() => {
                      setSelectedCollection(c.id);
                      document
                        .getElementById("storefront")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="group cursor-pointer block overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--gold)]/50 hover:shadow-md"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#F3F1EC]">
                      <Image
                        src={c.image}
                        alt={c.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-4 right-4 left-4 text-white">
                        <span className="rounded-md bg-[var(--gold-deep)]/90 px-2 py-0.5 text-[10px] font-bold">
                          کالکشن دیدار
                        </span>
                        <h3 className="mt-1 text-xl font-bold font-[family-name:var(--font-display)]">
                          {c.name}
                        </h3>
                      </div>
                    </div>
                    <div className="p-5">
                      <p className="text-xs leading-6 text-[var(--muted)]">
                        {c.description}
                      </p>
                      <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[var(--gold-deep)] group-hover:underline">
                        مشاهده قطعات این کالکشن در ویترین
                        <ArrowLeft size={14} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* AUTHENTICITY & WARRANTY SECTION */}
        <AuthenticitySection />

        {/* RETAILER B2B BENEFITS SECTION */}
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
          <div className="rounded-3xl border border-[var(--line)] bg-gradient-to-br from-[#041E42] via-[#092B5A] to-[#041E42] p-8 sm:p-12 text-white shadow-xl">
            <div className="grid gap-8 lg:grid-cols-12 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-[var(--gold-light)] border border-white/15">
                  <Users size={14} />
                  <span>همکاری ویژه خرده‌فروشان و بنکداران صنف طلا</span>
                </div>
                <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl text-white">
                  عضویت در شبکه توزیع و دریافت سقف اعتبار دیدار
                </h2>
                <p className="text-sm leading-8 text-white/85">
                  خرده‌فروشان و گالری‌های طلا پس از ثبت اولین سفارش می‌توانند با بارگذاری پروانه کسب،
                  از امکان صدور پیش‌فاکتور با مهلت تسویه، تسهیلات بنکداری و دریافت کاتالوگ فیزیکی
                  بهره‌مند شوند.
                </p>

                <div className="grid gap-3 sm:grid-cols-2 pt-2 text-xs">
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3 border border-white/10">
                    <Truck size={18} className="text-[var(--gold-light)] shrink-0" />
                    <span>ارسال تخصصی امن با اسکورت و بیمه کامل</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 rounded-xl p-3 border border-white/10">
                    <RotateCcw size={18} className="text-[var(--gold-light)] shrink-0" />
                    <span>تضمین بازخرید و تعویض با نرخ روز</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={openCart}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--gold)] px-5 py-3 text-xs font-bold text-[var(--ink)] shadow-md hover:bg-[var(--gold-light)] transition-all"
                  >
                    <ShoppingBag size={16} />
                    ثبت و تکمیل سفارش در سبد خرید
                  </button>
                  <Link href="/enter">
                    <Button variant="onDarkGhost" className="text-xs">
                      ورود به میز کار خرده‌فروشی
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white/10 rounded-2xl p-6 border border-white/15 backdrop-blur-md space-y-4">
                <h3 className="font-bold text-base text-[var(--gold-light)]">
                  مراحل ساده سفارش تا تحویل
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--ink)]">
                      ۱
                    </span>
                    <div>
                      <p className="font-bold text-white">انتخاب قطعات در سبد</p>
                      <p className="text-white/70 mt-0.5">
                        انتخاب مدل‌ها بر اساس وزن، عیار ۱۸ و اجرت ساخت.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--ink)]">
                      ۲
                    </span>
                    <div>
                      <p className="font-bold text-white">ثبت اطلاعات فروشگاه</p>
                      <p className="text-white/70 mt-0.5">
                        ثبت سریع تلفن و نام گالری برای صدور پیش‌فاکتور.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--gold)] text-xs font-bold text-[var(--ink)]">
                      ۳
                    </span>
                    <div>
                      <p className="font-bold text-white">تایید و ارسال امن</p>
                      <p className="text-white/70 mt-0.5">
                        هماهنگی میز فروش و تحویل فیزیکی با شناسه یکتا.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-[var(--line)] bg-white py-12">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="flex items-center gap-3">
              <Image
                src="/icons/icon-192.png"
                alt=""
                width={36}
                height={36}
                className="rounded-xl object-contain ring-1 ring-[var(--line)]"
              />
              <div>
                <p className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                  {brand.nameFa}
                </p>
                <p className="text-xs text-[var(--muted)]">{brand.tagline}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-xs text-[var(--muted)]">
              <a href="#storefront" className="hover:text-[var(--ink)]">
                ویترین طلا
              </a>
              <a href="#collections" className="hover:text-[var(--ink)]">
                کالکشن‌ها
              </a>
              <a href="#authenticity" className="hover:text-[var(--ink)]">
                استعلام اصالت
              </a>
              <Link href="/catalog" className="hover:text-[var(--ink)]">
                کاتالوگ
              </Link>
              <Link href="/enter" className="hover:text-[var(--ink)]">
                ورود پرسنل
              </Link>
            </div>

            <p className="text-xs text-[var(--muted)]">
              © {new Date().getFullYear()} {brand.nameFa} · تلفن: {brand.phoneDisplay}
            </p>
          </div>
        </footer>
      </main>

      {/* Slide-over Cart Drawer */}
      <CartDrawer goldRate={pricePerGram18} />
    </div>
  );
}
