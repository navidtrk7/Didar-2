"use client";

import { useEffect, useState } from "react";
import { usePlatform } from "@/context/platform-context";
import { useSession } from "@/context/session-context";
import { categoryLabels, skuStatusLabels } from "@/data/labels";
import { roleHasPermission } from "@/data/domains";
import type { Asset, SkuStatus } from "@/data/types";
import { formatWeight } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { ActionModal } from "@/components/action-modal";
import { Badge, Button, Field, SectionHeader } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ProductSubnav } from "@/components/product-subnav";
import { apiEnabled, didarApi, resolveMediaUrl } from "@/lib/api";

const statusTone: Record<SkuStatus, "neutral" | "warn" | "danger" | "ok"> = {
  draft: "neutral",
  awaiting_qc: "warn",
  needs_rework: "danger",
  approved: "ok",
};

const CATEGORIES: Asset["category"][] = [
  "ring",
  "necklace",
  "bracelet",
  "earring",
  "bar",
  "coin",
  "plaque",
];

const KARATS = [18, 21, 22, 24] as const;

const IMAGE_OPTIONS = [
  "/products/product-01.jpg",
  "/products/product-02.jpg",
  "/products/product-03.jpg",
  "/products/product-04.jpg",
  "/products/product-05.jpg",
  "/products/product-06.jpg",
];

type Col = { id: string; name: string };

export default function ProductCatalogPage() {
  const { toast } = useToast();
  const { role, user } = useSession();
  const { skus, addSku, sendSkuToQc, refresh } = usePlatform();
  const canCreate = roleHasPermission(role, "product.sku_create");

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [skuCode, setSkuCode] = useState("");
  const [category, setCategory] = useState<Asset["category"]>("ring");
  const [karat, setKarat] = useState<(typeof KARATS)[number]>(18);
  const [weight, setWeight] = useState("4.2");
  const [collection, setCollection] = useState("امضای دیدار");
  const [imageUrl, setImageUrl] = useState(IMAGE_OPTIONS[0]);
  const [previewUrl, setPreviewUrl] = useState(IMAGE_OPTIONS[0]);
  const [uploading, setUploading] = useState(false);
  const [pending, setPending] = useState(false);
  const [sendToQc, setSendToQc] = useState(true);
  const [collections, setCollections] = useState<Col[]>([]);

  useEffect(() => {
    if (!apiEnabled()) {
      setCollections([
        { id: "c1", name: "امضای دیدار" },
        { id: "c2", name: "روژان" },
        { id: "c3", name: "مهتاب" },
        { id: "c4", name: "مراسم" },
      ]);
      return;
    }
    void didarApi
      .listCollections()
      .then((rows) => setCollections(rows as Col[]))
      .catch((e: unknown) => {
        setCollections([]);
        toast(
          e instanceof Error ? e.message : "بارگذاری کالکشن‌ها ناموفق",
          "warn",
        );
      });
  }, []);

  const resetForm = () => {
    setName("");
    setSkuCode("");
    setCategory("ring");
    setKarat(18);
    setWeight("4.2");
    setCollection(collections[0]?.name ?? "امضای دیدار");
    setImageUrl(IMAGE_OPTIONS[0]);
    setPreviewUrl(IMAGE_OPTIONS[0]);
    setSendToQc(true);
    setUploading(false);
    setPending(false);
  };

  const onPickImage = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("فقط فایل تصویر مجاز است", "warn");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast("حجم تصویر حداکثر ۵ مگابایت است", "warn");
      return;
    }

    if (!apiEnabled()) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        setImageUrl(dataUrl);
        setPreviewUrl(dataUrl);
      };
      reader.readAsDataURL(file);
      return;
    }

    setUploading(true);
    try {
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      const { url } = await didarApi.uploadProductImage(file);
      setImageUrl(url);
      setPreviewUrl(resolveMediaUrl(url));
      URL.revokeObjectURL(localPreview);
      toast("تصویر بارگذاری شد");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در بارگذاری تصویر", "warn");
      setPreviewUrl(resolveMediaUrl(imageUrl) || IMAGE_OPTIONS[0]);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!name.trim() || !skuCode.trim()) {
      toast("نام و کد SKU الزامی است", "warn");
      return;
    }
    const catalogWeight = Number(weight);
    if (!Number.isFinite(catalogWeight) || catalogWeight <= 0) {
      toast("وزن کاتالوگ نامعتبر است", "warn");
      return;
    }
    if (uploading) {
      toast("صبر کنید تا بارگذاری تصویر تمام شود", "warn");
      return;
    }

    const payload = {
      name: name.trim(),
      category,
      skuCode: skuCode.trim(),
      karat,
      catalogWeight,
      collection: collection.trim() || "امضای دیدار",
      imageUrl: imageUrl.trim() || IMAGE_OPTIONS[0],
      producerOrg: user?.org,
    };

    setPending(true);
    try {
      if (apiEnabled()) {
        const created = (await didarApi.createSku({
          name: payload.name,
          category: payload.category,
          sku_code: payload.skuCode,
          karat: payload.karat,
          catalog_weight: payload.catalogWeight,
          collection: payload.collection,
          image_url: payload.imageUrl,
          status: "draft",
          producer_org: payload.producerOrg,
        })) as { id: string };
        if (sendToQc && created?.id) {
          await didarApi.sendSkuToQc(created.id);
          toast("محصول ثبت و به صف QC ارسال شد");
        } else {
          toast("SKU پیش‌نویس ثبت شد");
        }
        await refresh();
      } else {
        const createdId = addSku(payload);
        if (sendToQc && createdId) {
          await sendSkuToQc(createdId);
          toast("محصول ثبت و به صف QC ارسال شد");
        } else {
          toast("SKU پیش‌نویس ثبت شد");
        }
      }
      setOpen(false);
      resetForm();
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در ثبت", "warn");
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="کاتالوگ محصولات (SKU)"
        description="تعریف محصولات و ارسال به صف کنترل کیفیت."
        action={
          canCreate ? (
            <Button
              onClick={() => {
                resetForm();
                setOpen(true);
              }}
            >
              افزودن محصول
            </Button>
          ) : undefined
        }
      />
      <ProductSubnav />

      <DataTable
        headers={["تصویر", "محصول", "کد", "دسته", "وزن کاتالوگ", "وضعیت", "عملیات"]}
        rows={skus.map((s) => [
          <div
            key={`${s.id}-img`}
            className="relative h-12 w-12 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--mist)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveMediaUrl(s.imageUrl) || IMAGE_OPTIONS[0]}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>,
          s.name,
          <span key={`${s.id}-c`} data-ltr className="font-mono text-xs">
            {s.skuCode}
          </span>,
          categoryLabels[s.category],
          formatWeight(s.catalogWeight),
          <Badge key={`${s.id}-st`} tone={statusTone[s.status]}>
            {skuStatusLabels[s.status]}
          </Badge>,
          s.status === "draft" && canCreate ? (
            <Button
              key={`${s.id}-a`}
              variant="secondary"
              className="min-h-11 px-3 py-2 text-xs"
              onClick={() => {
                void (async () => {
                  try {
                    await sendSkuToQc(s.id);
                    toast("به صف QC ارسال شد");
                  } catch (e) {
                    toast(
                      e instanceof Error ? e.message : "خطا در ارسال به QC",
                      "warn",
                    );
                  }
                })();
              }}
            >
              ارسال به QC
            </Button>
          ) : (
            "—"
          ),
        ])}
      />

      <ActionModal
        open={open}
        onClose={() => setOpen(false)}
        title="افزودن محصول جدید"
        description="ثبت SKU در دامنه محصول — پس از ثبت می‌توانید به QC بفرستید."
        confirmLabel={
          pending || uploading
            ? "در حال انجام…"
            : sendToQc
              ? "ثبت و ارسال به QC"
              : "ثبت پیش‌نویس"
        }
        onConfirm={() => void submit()}
        busy={pending || uploading}
      >
        <Field label="نام محصول">
          <input
            className="field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً انگشتر مهتاب"
          />
        </Field>
        <Field label="کد SKU">
          <input
            className="field"
            value={skuCode}
            onChange={(e) => setSkuCode(e.target.value)}
            placeholder="RG-XXX-18K"
            dir="ltr"
          />
        </Field>
        <Field label="دسته">
          <select
            className="field"
            value={category}
            onChange={(e) => setCategory(e.target.value as Asset["category"])}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {categoryLabels[c]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="عیار">
          <select
            className="field"
            value={karat}
            onChange={(e) =>
              setKarat(Number(e.target.value) as (typeof KARATS)[number])
            }
          >
            {KARATS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </Field>
        <Field label="وزن کاتالوگ (گرم)">
          <input
            className="field"
            type="number"
            min="0.1"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            dir="ltr"
          />
        </Field>
        <Field label="کالکشن">
          <select
            className="field"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
          >
            {collections.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
            {!collections.some((c) => c.name === collection) && collection ? (
              <option value={collection}>{collection}</option>
            ) : null}
          </select>
        </Field>

        <Field label="تصویر محصول">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--mist)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl || IMAGE_OPTIONS[0]}
                alt="پیش‌نمایش"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="field min-h-11 cursor-pointer py-2 file:me-3 file:rounded-lg file:border-0 file:bg-[var(--ink)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[var(--mist)]"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  void onPickImage(file);
                  e.target.value = "";
                }}
              />
              <p className="text-xs text-[var(--muted)]">
                JPEG / PNG / WebP — حداکثر ۵ مگابایت
                {uploading ? " · در حال بارگذاری…" : ""}
              </p>
              <select
                className="field"
                value={IMAGE_OPTIONS.includes(imageUrl) ? imageUrl : ""}
                onChange={(e) => {
                  if (!e.target.value) return;
                  setImageUrl(e.target.value);
                  setPreviewUrl(e.target.value);
                }}
                dir="ltr"
              >
                <option value="">
                  {IMAGE_OPTIONS.includes(imageUrl)
                    ? "یا از تصاویر آماده انتخاب کنید"
                    : "تصویر بارگذاری‌شده · یا انتخاب آماده"}
                </option>
                {IMAGE_OPTIONS.map((src) => (
                  <option key={src} value={src}>
                    {src}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Field>

        {user?.org ? (
          <p className="text-xs text-[var(--muted)]">
            تولیدکننده / سازمان: {user.org}
          </p>
        ) : null}
        <label className="mt-2 flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={sendToQc}
            onChange={(e) => setSendToQc(e.target.checked)}
          />
          ارسال فوری به صف QC
        </label>
      </ActionModal>
    </div>
  );
}
