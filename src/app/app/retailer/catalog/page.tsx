"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlatform } from "@/context/platform-context";
import { useSession } from "@/context/session-context";
import { useWorkspace } from "@/context/workspace-context";
import { AssetCard } from "@/components/asset-card";
import { ActionModal } from "@/components/action-modal";
import { Button, Panel, SectionHeader } from "@/components/ui";
import { useToast } from "@/components/toast";
import { resolveGoldRate } from "@/lib/gold-rate";
import { formatWeight } from "@/lib/utils";

export default function RetailerCatalogPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useSession();
  const { activeHat } = useWorkspace();
  const {
    assets: platformAssets,
    liveGoldPrice,
    createOrder,
    apiMode,
    ready,
    error,
  } = usePlatform();
  const org = activeHat?.partyName ?? user?.org ?? "";
  const catalog = useMemo(
    () =>
      platformAssets.filter((a) =>
        ["available", "reserved"].includes(a.status),
      ),
    [platformAssets],
  );
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!selected && catalog[0]) setSelected(catalog[0].id);
  }, [catalog, selected]);

  const submitOrder = async () => {
    const item = catalog.find((a) => a.id === selected);
    if (!item) return;
    if (!org) {
      toast("سازمان/شعبه شما مشخص نیست — سفارش ثبت نشد.", "warn");
      return;
    }
    setPending(true);
    try {
      const rate = resolveGoldRate(liveGoldPrice);
      await createOrder({
        retailer: org,
        items: 1,
        totalWeight: item.weightGrams,
        value: Math.round(item.weightGrams * rate),
        uids: item.uid ? [item.uid] : [],
      });
      setOpen(false);
      toast(
        item.uid
          ? `سفارش ${item.name} ثبت شد — تخصیص و صف تحقق شروع شد.`
          : `سفارش ${item.name} ثبت شد.`,
      );
      router.push("/app/commerce/orders");
    } catch (e) {
      toast(e instanceof Error ? e.message : "ثبت سفارش ناموفق بود", "warn");
    } finally {
      setPending(false);
    }
  };

  return (
    <div>
      <SectionHeader
        title="کاتالوگ"
        description="قطعات رسمی دیدار گلد — موجود برای سفارش."
        action={
          <Button
            onClick={() => setOpen(true)}
            disabled={!catalog.length || pending}
          >
            ثبت سفارش
          </Button>
        }
      />
      {error ? (
        <Panel className="mb-4 p-4 text-sm text-amber-950 bg-amber-50">
          داده زنده بارگذاری نشد: {error}
        </Panel>
      ) : null}
      {ready && apiMode && !catalog.length && !error ? (
        <Panel className="mb-4 p-5 text-sm text-[var(--muted)]">
          قطعه‌ای با وضعیت موجود/رزرو در سامانه نیست.
        </Panel>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {catalog.map((asset, i) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            index={i}
            ratePerGram={liveGoldPrice}
          />
        ))}
      </div>

      <ActionModal
        open={open}
        title="ثبت سفارش عمده"
        description="قطعه مورد نظر را انتخاب کنید؛ پس از تأیید به فهرست سفارش‌ها می‌روید."
        confirmLabel={pending ? "در حال ثبت…" : "ثبت سفارش"}
        onClose={() => setOpen(false)}
        onConfirm={() => void submitOrder()}
        busy={pending}
      >
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">قطعه</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--mist)] px-3 py-2.5"
          >
            {catalog.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {formatWeight(a.weightGrams)}
              </option>
            ))}
          </select>
        </label>
      </ActionModal>
    </div>
  );
}
