import type { Asset } from "./types";
import { brand } from "./brand";

/**
 * کاتالوگ رسمی از https://didargold.com
 * منبع: sitemap + دادهٔ محصولات سایت برند (۶ قطعه)
 */
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

export type CatalogProduct = {
  slug: string;
  name: string;
  category: Asset["category"];
  categoryFa: string;
  collection: string;
  collectionId: (typeof catalogCollections)[number]["id"];
  karat: 18;
  weightGrams: number;
  goldType: "18K";
  imageUrl: string;
  title: string;
  description: string;
  brandUrl: string;
};

const base = [
  {
    slug: "atrin-necklace",
    name: "گردنبند آترین",
    category: "necklace" as const,
    categoryFa: "گردنبند",
    collection: "امضای دیدار",
    collectionId: "signature" as const,
    weightGrams: 7.2,
    imageUrl: "/products/product-01.jpg",
  },
  {
    slug: "vira-bracelet",
    name: "دستبند ویرا",
    category: "bracelet" as const,
    categoryFa: "دستبند",
    collection: "امضای دیدار",
    collectionId: "signature" as const,
    weightGrams: 11.5,
    imageUrl: "/products/product-02.jpg",
  },
  {
    slug: "mahtab-ring",
    name: "انگشتر مهتاب",
    category: "ring" as const,
    categoryFa: "انگشتر",
    collection: "میراث",
    collectionId: "heritage" as const,
    weightGrams: 4.9,
    imageUrl: "/products/product-03.jpg",
  },
  {
    slug: "nadia-earrings",
    name: "گوشواره نادیا",
    category: "earring" as const,
    categoryFa: "گوشواره",
    collection: "مراسم",
    collectionId: "ceremony" as const,
    weightGrams: 5.6,
    imageUrl: "/products/product-04.jpg",
  },
  {
    slug: "leila-ring",
    name: "انگشتر لیلا",
    category: "ring" as const,
    categoryFa: "انگشتر",
    collection: "امضای دیدار",
    collectionId: "signature" as const,
    weightGrams: 4.2,
    imageUrl: "/products/product-05.jpg",
  },
  {
    slug: "raha-necklace",
    name: "گردنبند رها",
    category: "necklace" as const,
    categoryFa: "گردنبند",
    collection: "مراسم",
    collectionId: "ceremony" as const,
    weightGrams: 7.1,
    imageUrl: "/products/product-06.jpg",
  },
];

export const catalogProducts: CatalogProduct[] = base.map((p) => ({
  ...p,
  karat: 18,
  goldType: "18K",
  title: `${p.name} | ${brand.nameFa}`,
  description: `${p.name} از کالکشن ${p.collection} در دیدار گلد؛ ${p.categoryFa} طلا با عیار ۱۸K، آماده بررسی اصالت، گارانتی و مشاوره خصوصی.`,
  brandUrl: `${brand.url}/products/${p.slug}`,
}));

export function getCatalogProduct(slug: string) {
  return catalogProducts.find((p) => p.slug === slug) ?? null;
}

export function productsByCollection(collectionId: string) {
  return catalogProducts.filter((p) => p.collectionId === collectionId);
}
