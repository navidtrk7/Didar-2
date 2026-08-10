"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { assets } from "@/data/mock";
import { usePlatform } from "@/context/platform-context";
import { categoryLabels } from "@/data/labels";
import { formatWeight, resolveProductImage } from "@/lib/utils";
import { Badge, Button, Panel, SectionHeader } from "@/components/ui";
import { apiEnabled, didarApi } from "@/lib/api";
import type { Asset } from "@/data/types";

type VerifyView = {
  name: string;
  imageUrl: string;
  karat: number;
  weight: number;
  category: Asset["category"];
  collection?: string;
  producer: string;
  location: string;
  displayUid: string;
  createdAt: string;
  status: string;
};

export default function VerifyUidPage({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = use(params);
  const decoded = decodeURIComponent(uid).toUpperCase();
  const { issuedAssets, assets: platformAssets, apiMode } = usePlatform();
  const [remote, setRemote] = useState<VerifyView | null>(null);
  const [loading, setLoading] = useState(apiEnabled());
  const [notFoundRemote, setNotFoundRemote] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiEnabled()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNetworkError(null);
    didarApi
      .verify(decoded)
      .then((res) => {
        if (cancelled) return;
        if (!res.found || !res.asset) {
          setNotFoundRemote(true);
          setRemote(null);
          return;
        }
        const a = res.asset;
        setRemote({
          name: String(a.name ?? ""),
          imageUrl: resolveProductImage(
            a.image_url != null ? String(a.image_url) : null,
          ),
          karat: Number(a.karat ?? 18),
          weight: Number(a.weight_grams ?? 0),
          category: String(a.category ?? "ring") as Asset["category"],
          collection: a.collection ? String(a.collection) : undefined,
          producer: String(a.producer ?? "خانه ساخت دیدار گلد"),
          location: String(a.location ?? "خزانه"),
          displayUid: String(a.uid ?? decoded),
          createdAt: String(a.issued_at ?? "—"),
          status: String(a.status ?? ""),
        });
        setNotFoundRemote(false);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setRemote(null);
          setNotFoundRemote(false);
          setNetworkError(
            e instanceof Error ? e.message : "خطا در استعلام",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [decoded]);

  const issued = issuedAssets.find((a) => a.uid.toUpperCase() === decoded);
  const catalog = (
    platformAssets.length ? platformAssets : apiMode ? [] : assets
  ).find((a) => a.uid.toUpperCase() === decoded);

  const localView: VerifyView | null =
    !apiEnabled() && (issued || catalog)
      ? {
          name: issued?.name ?? catalog!.name,
          imageUrl: resolveProductImage(
            issued?.imageUrl ?? catalog!.imageUrl,
          ),
          karat: issued?.karat ?? catalog!.karat,
          weight: issued?.weightGrams ?? catalog!.weightGrams,
          category: issued?.category ?? catalog!.category,
          collection: catalog?.collection,
          producer: catalog?.producer ?? "خانه ساخت دیدار گلد",
          location: issued?.location ?? catalog?.location ?? "خزانه",
          displayUid: issued?.uid ?? catalog!.uid,
          createdAt: issued?.issuedAt ?? catalog?.createdAt ?? "—",
          status: issued?.status ?? catalog?.status ?? "",
        }
      : null;

  const view = remote ?? localView;
  const warrantyActive = view?.status === "delivered";

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center text-sm text-[var(--muted)]">
        در حال استعلام…
      </div>
    );
  }

  if (networkError) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <p className="text-lg font-semibold">استعلام موقتاً در دسترس نیست</p>
        <p className="mt-2 text-sm text-[var(--muted)]">{networkError}</p>
        <Link href="/verify" className="mt-4 inline-block">
          <Button variant="secondary">بازگشت</Button>
        </Link>
      </div>
    );
  }

  if (!view || (apiEnabled() && notFoundRemote)) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <p className="text-lg font-semibold">شناسه یافت نشد</p>
        <Link href="/verify" className="mt-4 inline-block">
          <Button variant="secondary">بازگشت</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--mist)]">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <Link
          href="/verify"
          className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          استعلام جدید
        </Link>
        {" · "}
        <Link
          href="/app/inventory/uids"
          className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          بازگشت به موجودی
        </Link>
        <SectionHeader
          title="شناسنامه دیجیتال محصول"
          description="اصالت، وزن و سوابق منشأ."
          action={
            <Badge tone={remote || localView ? "ok" : "neutral"}>
              {remote ? "اصالت تأیید شد" : "نمایش آفلاین"}
            </Badge>
          }
        />

        <Panel className="overflow-hidden">
          <div className="relative aspect-[4/3] bg-[var(--ink)]/5">
            <Image
              src={view.imageUrl}
              alt={view.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 640px"
            />
          </div>
          <div className="space-y-4 p-5">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-3xl">
                {view.name}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {view.collection ? `${view.collection} · ` : ""}
                {categoryLabels[view.category]}
              </p>
              <p className="mt-2 font-mono text-sm" data-ltr>
                {view.displayUid}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-[var(--muted)]">عیار</p>
                <p className="font-semibold">{view.karat}K</p>
              </div>
              <div>
                <p className="text-[var(--muted)]">وزن</p>
                <p className="font-semibold">{formatWeight(view.weight)}</p>
              </div>
              <div>
                <p className="text-[var(--muted)]">گارانتی</p>
                <p className="font-semibold">
                  {warrantyActive ? "فعال" : "پس از تحویل"}
                </p>
              </div>
              <div>
                <p className="text-[var(--muted)]">کارگاه</p>
                <p className="font-semibold">{view.producer}</p>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">تاریخچه عمومی</p>
              <ol className="space-y-2 text-sm text-[var(--muted)]">
                <li>تولید و ثبت در دفتر دیدار — {view.createdAt}</li>
                <li>تأیید QC و صدور UID</li>
                <li>ورود به {view.location}</li>
              </ol>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => window.print()}
            >
              دانلود / چاپ گواهی
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
