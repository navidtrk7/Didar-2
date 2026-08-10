"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlatform } from "@/context/platform-context";
import { useSession } from "@/context/session-context";
import { useSystemSettings } from "@/lib/system-settings";
import { roleHasPermission } from "@/data/domains";
import type { QcInspection, QcResult } from "@/data/types";
import { formatWeight } from "@/lib/utils";
import { useToast } from "@/components/toast";
import { ActionModal } from "@/components/action-modal";
import { Badge, Button, Field, SectionHeader, Stat } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ProductSubnav } from "@/components/product-subnav";

export default function QcInspectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { role, user } = useSession();
  const { settings } = useSystemSettings();
  const { skus, qcQueue, completeQc } = usePlatform();
  const [active, setActive] = useState<QcInspection | null>(null);
  const [measured, setMeasured] = useState("");
  const canQc = roleHasPermission(role, "product.qc_approve");

  useEffect(() => {
    if (role && !canQc) {
      router.replace("/app/product");
    }
  }, [role, canQc, router]);

  if (!canQc) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--muted)]">
        در حال انتقال…
      </div>
    );
  }


  const skuMap = useMemo(
    () => Object.fromEntries(skus.map((s) => [s.id, s])),
    [skus],
  );

  const pending = qcQueue.filter((q) => !q.result).length;

  const finish = async (result: QcResult) => {
    if (!active) return;
    const sku = skuMap[active.skuId];
    const weight = Number(measured);
    if (!Number.isFinite(weight) || weight <= 0) {
      toast("وزن اندازه‌گیری‌شده را وارد کنید", "warn");
      return;
    }
    const delta = sku ? weight - sku.catalogWeight : 0;
    if (result === "pass" && Math.abs(delta) > settings.weightToleranceGrams) {
      toast(
        `اختلاف وزن بیش از تلورانس (±${settings.weightToleranceGrams}g) است`,
        "warn",
      );
      return;
    }
    try {
      await completeQc({
        inspectionId: active.id,
        measuredWeight: weight,
        result,
        inspector: user?.name ?? "بازرس QC",
      });
      setActive(null);
      toast(
        result === "pass"
          ? "تأیید شد — در صف صدور UID انبار قرار گرفت"
          : result === "rework"
            ? "نیازمند اصلاح ثبت شد"
            : "رد شد",
      );
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در ثبت QC", "warn");
    }
  };

  const activeSku = active ? skuMap[active.skuId] : null;
  const delta =
    activeSku && measured
      ? Number(measured) - activeSku.catalogWeight
      : null;

  return (
    <div>
      <SectionHeader
        title="پایش کنترل کیفیت"
        description="بررسی وزن، عیار و ظاهر پیش از ورود به خزانه."
      />
      <ProductSubnav />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="در انتظار بررسی" value={String(pending)} />
        <Stat
          label="تلورانس وزن"
          value={`±${settings.weightToleranceGrams}g`}
        />
        <Stat label="عیار پیش‌فرض" value={`${settings.defaultKarat}K`} />
      </div>

      <DataTable
        headers={[
          "کد فیزیکی",
          "محصول",
          "وزن کاتالوگ",
          "اندازه‌گیری",
          "نتیجه",
          "عملیات",
        ]}
        rows={qcQueue.map((q) => {
          const sku = skuMap[q.skuId];
          return [
            q.physicalCode,
            sku?.name ?? "—",
            sku ? formatWeight(sku.catalogWeight) : "—",
            q.measuredWeight != null ? formatWeight(q.measuredWeight) : "—",
            q.result ? (
              <Badge
                key={`${q.id}-r`}
                tone={
                  q.result === "pass"
                    ? "ok"
                    : q.result === "rework"
                      ? "warn"
                      : "danger"
                }
              >
                {q.result === "pass"
                  ? "تأیید"
                  : q.result === "rework"
                    ? "اصلاح"
                    : "رد"}
              </Badge>
            ) : (
              <Badge key={`${q.id}-w`} tone="warn">
                در انتظار
              </Badge>
            ),
            !q.result ? (
              <Button
                key={`${q.id}-b`}
                variant="secondary"
                className="min-h-11 px-3 py-2 text-xs"
                onClick={() => {
                  setActive(q);
                  setMeasured(q.measuredWeight?.toString() ?? "");
                }}
              >
                بررسی
              </Button>
            ) : (
              "—"
            ),
          ];
        })}
      />

      <ActionModal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title="فرم بازرسی کیفیت"
        description={
          active
            ? `${active.physicalCode} · ${activeSku?.skuCode ?? ""}`
            : undefined
        }
        onConfirm={() => finish("pass")}
        hideFooter
      >
        <Field label="وزن اندازه‌گیری‌شده (گرم)">
          <input
            className="field"
            type="number"
            step="0.01"
            value={measured}
            onChange={(e) => setMeasured(e.target.value)}
            dir="ltr"
          />
        </Field>
        {delta != null && Number.isFinite(delta) ? (
          <p
            className={`text-sm ${
              Math.abs(delta) > settings.weightToleranceGrams
                ? "text-rose-800"
                : "text-emerald-800"
            }`}
          >
            اختلاف با کاتالوگ: {delta > 0 ? "+" : ""}
            {delta.toFixed(2)}g
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button type="button" className="min-h-11" onClick={() => finish("pass")}>
            تأیید
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            onClick={() => finish("rework")}
          >
            نیازمند اصلاح
          </Button>
          <Button
            type="button"
            variant="danger"
            className="min-h-11"
            onClick={() => finish("fail")}
          >
            رد
          </Button>
          <Button type="button" variant="ghost" className="min-h-11" onClick={() => setActive(null)}>
            انصراف
          </Button>
        </div>
      </ActionModal>
    </div>
  );
}
