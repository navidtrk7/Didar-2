"use client";

import { useState } from "react";
import { assets } from "@/data/mock";
import { usePlatform } from "@/context/platform-context";
import { useToast } from "@/components/toast";
import { Button, Field, Panel, SectionHeader } from "@/components/ui";
import Link from "next/link";
import { apiEnabled, didarApi } from "@/lib/api";

const faqs = [
  {
    q: "چگونه اصالت قطعه را تایید کنم؟",
    a: "هر قطعه دارای شناسه یکتا (UID) است. با ورود UID در بخش استعلام، تاریخچه وزن و عیار را می‌بینید.",
  },
  {
    q: "شرایط گارانتی چیست؟",
    a: "گارانتی مادام‌العمر برای اصالت عیار و وزن ثبت‌شده در شناسنامه دیجیتال.",
  },
  {
    q: "در صورت اختلاف وزن چه کنم؟",
    a: "از طریق پشتیبانی با ارائه UID و رسید خرید، درخواست بررسی ثبت کنید.",
  },
];

export default function ServiceWarrantyPage() {
  const { toast } = useToast();
  const { issuedAssets } = usePlatform();
  const [uid, setUid] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const check = async () => {
    const key = uid.trim();
    if (!key) {
      toast("UID را وارد کنید", "warn");
      return;
    }
    try {
      if (apiEnabled()) {
        const data = await didarApi.lookupWarranty(key);
        setResult(data.message);
        toast("وضعیت گارانتی از دامنه Service دریافت شد");
        return;
      }
      const upper = key.toUpperCase();
      const issued = issuedAssets.find((a) => a.uid.toUpperCase() === upper);
      const catalog = assets.find((a) => a.uid.toUpperCase() === upper);
      const found = issued ?? catalog;
      if (!found) {
        setResult(null);
        toast("شناسه یافت نشد", "warn");
        return;
      }
      const name = issued?.name ?? catalog!.name;
      const displayUid = issued?.uid ?? catalog!.uid;
      const status = issued?.status ?? "unknown";
      const active = status === "delivered";
      setResult(
        active
          ? `گارانتی «${name}» فعال است · ${displayUid}`
          : `گارانتی «${name}» فعال نیست (وضعیت: ${status}) · ${displayUid}`,
      );
      toast(
        active ? "گارانتی فعال" : "گارانتی غیرفعال — فقط پس از تحویل",
        active ? undefined : "warn",
      );
    } catch (e) {
      setResult(null);
      toast(e instanceof Error ? e.message : "خطا در استعلام", "warn");
    }
  };

  const openClaim = async () => {
    const key = uid.trim();
    if (!key) {
      toast("ابتدا UID را وارد کنید", "warn");
      return;
    }
    try {
      await didarApi.openWarrantyClaim(key, "درخواست بررسی از پنل خدمات");
      toast("درخواست گارانتی ثبت شد");
    } catch (e) {
      toast(e instanceof Error ? e.message : "ثبت درخواست ناموفق", "warn");
    }
  };

  return (
    <div>
      <SectionHeader
        title="پشتیبانی و گارانتی"
        description="دامنه خدمات · بررسی وضعیت گارانتی و ثبت درخواست."
        action={
          <Link href="/verify">
            <Button variant="secondary">استعلام اصالت</Button>
          </Link>
        }
      />

      <Panel className="mb-8 space-y-4 p-5">
        <p className="font-semibold">بررسی وضعیت گارانتی</p>
        <Field label="شناسه یکتا">
          <input
            className="field"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            dir="ltr"
            placeholder="DDR-18K-ATR01"
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="min-h-11" onClick={() => void check()}>
            استعلام وضعیت
          </Button>
          {apiEnabled() ? (
            <Button
              type="button"
              variant="secondary"
              className="min-h-11"
              onClick={() => void openClaim()}
            >
              ثبت درخواست
            </Button>
          ) : null}
        </div>
        {result ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {result}
          </p>
        ) : null}
      </Panel>

      <div className="space-y-3">
        {faqs.map((f) => (
          <Panel key={f.q} className="p-5">
            <p className="font-semibold">{f.q}</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{f.a}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
