"use client";

import { useEffect, useState } from "react";
import type { SystemSettings } from "@/data/types";
import { useSystemSettings } from "@/lib/system-settings";
import { usePlatform } from "@/context/platform-context";
import { useToast } from "@/components/toast";
import { Button, Field, Panel, SectionHeader } from "@/components/ui";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const { settings, save, reset, ready } = useSystemSettings();
  const { resetPlatform } = usePlatform();
  const [form, setForm] = useState<SystemSettings>(settings);

  useEffect(() => {
    if (ready) setForm(settings);
  }, [ready, settings]);

  const patch = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div>
      <SectionHeader
        title="تنظیمات سیستم"
        description="پارامترهای عملیاتی QC، قفل قیمت و پیش‌فاکتور."
        action={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                reset();
                toast("به تنظیمات کارخانه بازگشت");
              }}
            >
              بازنشانی
            </Button>
            <Button
              onClick={() => {
                save(form);
                toast("تنظیمات ذخیره شد");
              }}
            >
              ذخیره
            </Button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel className="space-y-4 p-5">
          <h3 className="font-semibold">پارامترهای عمومی</h3>
          <Field label="تلورانس وزن (گرم)">
            <input
              className="field"
              type="number"
              step="0.01"
              value={form.weightToleranceGrams}
              onChange={(e) =>
                patch("weightToleranceGrams", Number(e.target.value) || 0)
              }
              dir="ltr"
            />
          </Field>
          <Field label="قفل قیمت فاکتور (دقیقه)">
            <select
              className="field"
              value={form.priceLockMinutes}
              onChange={(e) =>
                patch("priceLockMinutes", Number(e.target.value) as 1 | 2 | 3 | 5)
              }
            >
              {[1, 2, 3, 5].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="اعتبار پیش‌فاکتور (دقیقه)">
            <input
              className="field"
              type="number"
              value={form.proformaTtlMinutes}
              onChange={(e) =>
                patch("proformaTtlMinutes", Number(e.target.value) || 15)
              }
              dir="ltr"
            />
          </Field>
          <Field label="عیار پیش‌فرض">
            <select
              className="field"
              value={form.defaultKarat}
              onChange={(e) =>
                patch("defaultKarat", Number(e.target.value) as 18 | 21 | 24)
              }
            >
              <option value={18}>۱۸K</option>
              <option value={21}>۲۱K</option>
              <option value={24}>۲۴K</option>
            </select>
          </Field>
        </Panel>

        <Panel className="space-y-4 p-5">
          <h3 className="font-semibold">مالی و نرخ</h3>
          <Field label="واحد پول">
            <select
              className="field"
              value={form.currency}
              onChange={(e) =>
                patch("currency", e.target.value as "IRT" | "IRR")
              }
            >
              <option value="IRT">تومان</option>
              <option value="IRR">ریال</option>
            </select>
          </Field>
          <Field label="منبع نرخ طلا">
            <select
              className="field"
              value={form.rateSource}
              onChange={(e) =>
                patch(
                  "rateSource",
                  e.target.value as SystemSettings["rateSource"],
                )
              }
            >
              <option value="tgju">سامانه TGJU</option>
              <option value="cbi">بانک مرکزی</option>
              <option value="manual">سرور داخلی (دستی)</option>
            </select>
          </Field>
          <p className="text-sm leading-7 text-[var(--muted)]">
            تنظیمات عملیاتی روی QC، قفل قیمت، پیش‌فاکتور و اعتبار اعمال می‌شود.
          </p>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              resetPlatform();
              toast("داده‌های عملیاتی (SKU / QC / UID / پیش‌فاکتور) بازنشانی شد");
            }}
          >
            بازنشانی داده عملیاتی
          </Button>
        </Panel>
      </div>
    </div>
  );
}
