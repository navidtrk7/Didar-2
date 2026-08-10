export type TgjuQuote = {
  key: string;
  title: string;
  /** قیمت به ریال */
  priceRial: number;
  /** قیمت به تومان */
  priceToman: number;
  changePct: number;
  direction: "high" | "low" | "";
  updatedAt: string;
  updatedAtFa: string;
};

export type TgjuSnapshot = {
  source: "tgju.org";
  fetchedAt: string;
  quotes: TgjuQuote[];
  /** گرم ۱۸ عیار — مبنای رایج بازار ایران */
  geram18Toman: number;
  geram24Toman: number;
  mesghalToman: number;
  dollarToman: number;
  onsUsd: number;
};

type RawItem = {
  p?: string;
  dp?: number;
  dt?: string;
  t?: string;
  ts?: string;
};

const LABELS: Record<string, string> = {
  geram18: "طلای ۱۸ عیار (هر گرم)",
  geram24: "طلای ۲۴ عیار (هر گرم)",
  mesghal: "مثقال طلا",
  gold_melted_wholesale: "آبشده بنکداری",
  gold_melted_transfer: "آبشده نقدی",
  sekee: "سکه امامی",
  sekeb: "سکه بهار آزادی",
  nim: "نیم‌سکه",
  rob: "ربع‌سکه",
  gerami: "سکه گرمی",
  price_dollar_rl: "دلار آزاد",
  price_eur: "یورو",
  ons: "انس جهانی طلا",
};

const KEYS = Object.keys(LABELS);

function parsePrice(raw: string | undefined): number {
  if (!raw) return 0;
  return Number(String(raw).replace(/,/g, "").trim()) || 0;
}

function toQuote(key: string, item: RawItem): TgjuQuote {
  const priceRial = parsePrice(item.p);
  const isOns = key === "ons";
  return {
    key,
    title: LABELS[key] ?? key,
    priceRial: isOns ? priceRial : priceRial,
    // انس به دلار است؛ بقیه به ریال → تومان
    priceToman: isOns ? priceRial : Math.round(priceRial / 10),
    changePct: Number(item.dp ?? 0),
    direction: (item.dt as TgjuQuote["direction"]) || "",
    updatedAt: item.ts ?? "",
    updatedAtFa: item.t ?? "",
  };
}

/** قیمت تقریبی هر گرم بر اساس عیار، از روی ۱۸ عیار TGJU */
export function gramPriceFrom18(geram18Toman: number, karat: number) {
  return Math.round((geram18Toman * karat) / 18);
}

export async function fetchTgjuSnapshot(): Promise<TgjuSnapshot> {
  const res = await fetch("https://call2.tgju.org/ajax.json", {
    headers: { "User-Agent": "DidarPlatform/0.1" },
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`TGJU HTTP ${res.status}`);
  }

  const json = (await res.json()) as { current: Record<string, RawItem> };
  const current = json.current ?? {};

  const quotes = KEYS.filter((k) => current[k]).map((k) =>
    toQuote(k, current[k]),
  );

  const byKey = Object.fromEntries(quotes.map((q) => [q.key, q]));

  return {
    source: "tgju.org",
    fetchedAt: new Date().toISOString(),
    quotes,
    geram18Toman: byKey.geram18?.priceToman ?? 0,
    geram24Toman: byKey.geram24?.priceToman ?? 0,
    mesghalToman: byKey.mesghal?.priceToman ?? 0,
    dollarToman: byKey.price_dollar_rl?.priceToman ?? 0,
    onsUsd: byKey.ons?.priceRial ?? 0,
  };
}
