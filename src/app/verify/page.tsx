"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { assets } from "@/data/mock";
import { usePlatform } from "@/context/platform-context";
import { Button, Field, Panel, SectionHeader } from "@/components/ui";
import { apiEnabled, didarApi } from "@/lib/api";

export default function VerifyPage() {
  const router = useRouter();
  const { issuedAssets, assets: platformAssets } = usePlatform();
  const [uid, setUid] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const samples = [
    ...issuedAssets.slice(0, 2).map((a) => a.uid),
    ...(platformAssets.length ? platformAssets : assets)
      .slice(0, 3)
      .map((a) => a.uid),
  ].filter((v, i, arr) => arr.indexOf(v) === i);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const key = uid.trim().toUpperCase();
    if (!key) {
      setError("شناسه یکتا را وارد کنید");
      return;
    }

    setPending(true);
    setError(null);
    try {
      if (apiEnabled()) {
        const res = await didarApi.verify(key);
        if (!res.found || !res.asset) {
          setError("شناسه‌ای یافت نشد. نمونه: DDR-18K-ATR01");
          return;
        }
        const targetUid = String(res.asset.uid ?? key);
        router.push(`/verify/${encodeURIComponent(targetUid)}`);
        return;
      }

      const issued = issuedAssets.find((a) => a.uid.toUpperCase() === key);
      const catalog = (platformAssets.length ? platformAssets : assets).find(
        (a) => a.uid.toUpperCase() === key,
      );
      const targetUid = issued?.uid ?? catalog?.uid;
      if (!targetUid) {
        setError("شناسه‌ای یافت نشد. نمونه: DDR-18K-ATR01");
        return;
      }
      router.push(`/verify/${encodeURIComponent(targetUid)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "استعلام ناموفق بود");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--mist)]">
      <div className="mx-auto max-w-lg px-5 py-12">
        <Link
          href="/"
          className="text-sm text-[var(--muted)] hover:text-[var(--ink)]"
        >
          بازگشت به دیدار گلد
        </Link>
        <SectionHeader
          title="استعلام اصالت"
          description="شناسه یکتای محصول را وارد کنید یا از نمونه زیر استفاده کنید."
        />
        <Panel className="p-6">
          <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
            <Field label="شناسه یکتا (UID)">
              <input
                className="field"
                value={uid}
                onChange={(e) => {
                  setUid(e.target.value);
                  setError(null);
                }}
                placeholder="DDR-18K-ATR01"
                dir="ltr"
              />
            </Field>
            {error ? (
              <p className="text-sm text-rose-800" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "در حال استعلام…" : "استعلام"}
            </Button>
          </form>
          <p className="mt-4 text-xs text-[var(--muted)]">
            نمونه‌ها:{" "}
            {samples.map((s, i) => (
              <button
                key={s}
                type="button"
                className="ms-1 underline"
                data-ltr
                onClick={() => setUid(s)}
              >
                {s}
                {i < samples.length - 1 ? "،" : ""}
              </button>
            ))}
          </p>
        </Panel>
      </div>
    </div>
  );
}
