import type { Asset } from "./types";
import { brand } from "./brand";

export const catalogCollections = [
  {
    id: "signature",
    name: "امضای دیدار",
    title: "کالکشن امضای دیدار",
    description:
      "کالکشن امضای دیدار؛ فرم‌های خالص، آرام و ماندگار برای تجربه‌ای معاصر از طلا و جواهر.",
    image: "/collections/collection-01.jpg",
  },
  {
    id: "heritage",
    name: "میراث",
    title: "کالکشن میراث دیدار",
    description:
      "کالکشن میراث دیدار؛ بازخوانی نقش‌ها و حافظه ایرانی در زبان طراحی معاصر طلا و جواهر.",
    image: "/collections/collection-02.jpg",
  },
  {
    id: "ceremony",
    name: "مراسم",
    title: "کالکشن مراسم دیدار",
    description:
      "کالکشن مراسم دیدار؛ قطعاتی برای لحظه‌های خاص، هدیه‌های ماندگار و حضور رسمی.",
    image: "/collections/collection-03.jpg",
  },
] as const;

export type CatalogCategoryKey =
  | "all"
  | "necklace"
  | "bracelet"
  | "ring"
  | "earring"
  | "bangle"
  | "set";

export interface CatalogCategory {
  id: CatalogCategoryKey;
  name: string;
  count: number;
}

export const catalogCategories: { id: CatalogCategoryKey; name: string }[] = [
  { id: "all", name: "همه محصولات" },
  { id: "necklace", name: "گردنبند و آویز" },
  { id: "bracelet", name: "دستبند" },
  { id: "ring", name: "انگشتر" },
  { id: "earring", name: "گوشواره" },
  { id: "bangle", name: "النگو" },
  { id: "set", name: "نیم‌ست و سرویس" },
];

export type CatalogProduct = {
  slug: string;
  name: string;
  category: Asset["category"];
  categoryFa: string;
  collection: string;
  collectionId: (typeof catalogCollections)[number]["id"];
  karat: 18;
  weightGrams: number;
  craftFeePct: number;
  estimatedCraftFee: number;
  goldType: "18K";
  imageUrl: string;
  title: string;
  description: string;
  brandUrl: string;
  uidCode: string;
  inStock: boolean;
  warrantyMonths: number;
  featured?: boolean;
};

const baseProducts = [
  {
    slug: "atrin-necklace",
    name: "گردنبند آترین",
    category: "necklace" as const,
    categoryFa: "گردنبند",
    collection: "امضای دیدار",
    collectionId: "signature" as const,
    weightGrams: 7.2,
    craftFeePct: 12,
    estimatedCraftFee: 14_800_000,
    imageUrl: "/products/product-01.jpg",
    uidCode: "DDR-18K-ATR01",
    featured: true,
  },
  {
    slug: "vira-bracelet",
    name: "دستبند ویرا",
    category: "bracelet" as const,
    categoryFa: "دستبند",
    collection: "امضای دیدار",
    collectionId: "signature" as const,
    weightGrams: 11.5,
    craftFeePct: 14,
    estimatedCraftFee: 16_200_000,
    imageUrl: "/products/product-02.jpg",
    uidCode: "DDR-18K-VIR02",
    featured: true,
  },
  {
    slug: "mahtab-ring",
    name: "انگشتر مهتاب",
    category: "ring" as const,
    categoryFa: "انگشتر",
    collection: "میراث",
    collectionId: "heritage" as const,
    weightGrams: 4.9,
    craftFeePct: 15,
    estimatedCraftFee: 9_800_000,
    imageUrl: "/products/product-03.jpg",
    uidCode: "DDR-18K-MHT03",
    featured: true,
  },
  {
    slug: "nadia-earrings",
    name: "گوشواره نادیا",
    category: "earring" as const,
    categoryFa: "گوشواره",
    collection: "مراسم",
    collectionId: "ceremony" as const,
    weightGrams: 5.6,
    craftFeePct: 13,
    estimatedCraftFee: 11_400_000,
    imageUrl: "/products/product-04.jpg",
    uidCode: "DDR-18K-NAD04",
    featured: true,
  },
  {
    slug: "leila-ring",
    name: "انگشتر لیلا",
    category: "ring" as const,
    categoryFa: "انگشتر",
    collection: "امضای دیدار",
    collectionId: "signature" as const,
    weightGrams: 4.2,
    craftFeePct: 14,
    estimatedCraftFee: 8_500_000,
    imageUrl: "/products/product-05.jpg",
    uidCode: "DDR-18K-LEI05",
    featured: true,
  },
  {
    slug: "raha-necklace",
    name: "گردنبند رها",
    category: "necklace" as const,
    categoryFa: "گردنبند",
    collection: "مراسم",
    collectionId: "ceremony" as const,
    weightGrams: 7.1,
    craftFeePct: 11,
    estimatedCraftFee: 13_900_000,
    imageUrl: "/products/product-06.jpg",
    uidCode: "DDR-18K-RAH06",
    featured: true,
  },
  {
    slug: "anita-bangle",
    name: "النگو آنیتا",
    category: "bracelet" as const,
    categoryFa: "النگو",
    collection: "میراث",
    collectionId: "heritage" as const,
    weightGrams: 8.8,
    craftFeePct: 10,
    estimatedCraftFee: 12_500_000,
    imageUrl: "/products/p01.jpg",
    uidCode: "DDR-18K-ANI07",
    featured: false,
  },
  {
    slug: "dorin-set",
    name: "نیم‌ست زرین دورین",
    category: "necklace" as const,
    categoryFa: "نیم‌ست و سرویس",
    collection: "مراسم",
    collectionId: "ceremony" as const,
    weightGrams: 16.4,
    craftFeePct: 16,
    estimatedCraftFee: 32_000_000,
    imageUrl: "/products/p02.jpg",
    uidCode: "DDR-18K-DOR08",
    featured: true,
  },
  {
    slug: "shahrzad-ring",
    name: "انگشتر شهرزاد",
    category: "ring" as const,
    categoryFa: "انگشتر",
    collection: "میراث",
    collectionId: "heritage" as const,
    weightGrams: 5.3,
    craftFeePct: 13,
    estimatedCraftFee: 9_900_000,
    imageUrl: "/products/p03.jpg",
    uidCode: "DDR-18K-SHZ09",
    featured: false,
  },
  {
    slug: "taraneh-bracelet",
    name: "دستبند ترانه",
    category: "bracelet" as const,
    categoryFa: "دستبند",
    collection: "امضای دیدار",
    collectionId: "signature" as const,
    weightGrams: 6.7,
    craftFeePct: 12,
    estimatedCraftFee: 11_800_000,
    imageUrl: "/products/p04.jpg",
    uidCode: "DDR-18K-TRN10",
    featured: false,
  },
  {
    slug: "parmis-earrings",
    name: "گوشواره پارمیس",
    category: "earring" as const,
    categoryFa: "گوشواره",
    collection: "امضای دیدار",
    collectionId: "signature" as const,
    weightGrams: 3.8,
    craftFeePct: 14,
    estimatedCraftFee: 7_600_000,
    imageUrl: "/products/p05.jpg",
    uidCode: "DDR-18K-PAR11",
    featured: false,
  },
  {
    slug: "kimiya-necklace",
    name: "گردنبند کیمیا",
    category: "necklace" as const,
    categoryFa: "گردنبند",
    collection: "میراث",
    collectionId: "heritage" as const,
    weightGrams: 9.4,
    craftFeePct: 13,
    estimatedCraftFee: 17_500_000,
    imageUrl: "/products/p06.jpg",
    uidCode: "DDR-18K-KIM12",
    featured: false,
  },
  {
    slug: "yasaman-bangle",
    name: "النگو تراش یاسمن",
    category: "bracelet" as const,
    categoryFa: "النگو",
    collection: "امضای دیدار",
    collectionId: "signature" as const,
    weightGrams: 10.2,
    craftFeePct: 9,
    estimatedCraftFee: 13_200_000,
    imageUrl: "/products/p07.jpg",
    uidCode: "DDR-18K-YAS13",
    featured: false,
  },
  {
    slug: "negin-ring",
    name: "انگشتر تک‌نگین دیدار",
    category: "ring" as const,
    categoryFa: "انگشتر",
    collection: "مراسم",
    collectionId: "ceremony" as const,
    weightGrams: 6.1,
    craftFeePct: 15,
    estimatedCraftFee: 12_800_000,
    imageUrl: "/products/p08.jpg",
    uidCode: "DDR-18K-NEG14",
    featured: false,
  },
  {
    slug: "baran-earrings",
    name: "گوشواره آویز باران",
    category: "earring" as const,
    categoryFa: "گوشواره",
    collection: "میراث",
    collectionId: "heritage" as const,
    weightGrams: 4.7,
    craftFeePct: 14,
    estimatedCraftFee: 9_200_000,
    imageUrl: "/products/p09.jpg",
    uidCode: "DDR-18K-BAR15",
    featured: false,
  },
  {
    slug: "gohar-set",
    name: "سرویس مجلسی گوهر",
    category: "necklace" as const,
    categoryFa: "نیم‌ست و سرویس",
    collection: "مراسم",
    collectionId: "ceremony" as const,
    weightGrams: 24.8,
    craftFeePct: 17,
    estimatedCraftFee: 54_000_000,
    imageUrl: "/products/p10.jpg",
    uidCode: "DDR-18K-GOH16",
    featured: true,
  },
];

export const catalogProducts: CatalogProduct[] = baseProducts.map((p) => ({
  ...p,
  karat: 18,
  goldType: "18K",
  inStock: true,
  warrantyMonths: 24,
  title: `${p.name} | ${brand.nameFa}`,
  description: `${p.name} از کالکشن ${p.collection} در دیدار گلد؛ ${p.categoryFa} طلا با عیار ۱۸K، شناسنامه هولوگرام‌دار و گارانتی تعویض و بازخرید رسمی.`,
  brandUrl: `${brand.url}/products/${p.slug}`,
}));

export function getCatalogProduct(slug: string) {
  return catalogProducts.find((p) => p.slug === slug) ?? null;
}

export function productsByCollection(collectionId: string) {
  if (collectionId === "all") return catalogProducts;
  return catalogProducts.filter((p) => p.collectionId === collectionId);
}

export function productsByCategory(category: CatalogCategoryKey) {
  if (category === "all") return catalogProducts;
  if (category === "bangle") {
    return catalogProducts.filter((p) => p.categoryFa.includes("النگو"));
  }
  if (category === "set") {
    return catalogProducts.filter((p) => p.categoryFa.includes("نیم‌ست") || p.categoryFa.includes("سرویس"));
  }
  return catalogProducts.filter((p) => p.category === category);
}

export function getFilteredProducts(collectionId: string, category: CatalogCategoryKey) {
  return catalogProducts.filter((p) => {
    const matchCollection = collectionId === "all" || p.collectionId === collectionId;
    let matchCategory = category === "all" || p.category === category;
    if (category === "bangle") {
      matchCategory = p.categoryFa.includes("النگو");
    } else if (category === "set") {
      matchCategory = p.categoryFa.includes("نیم‌ست") || p.categoryFa.includes("سرویس");
    }
    return matchCollection && matchCategory;
  });
}
