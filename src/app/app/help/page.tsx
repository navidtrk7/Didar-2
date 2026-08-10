import { readFile } from "node:fs/promises";
import path from "node:path";
import Link from "next/link";
import { HandbookDoc } from "@/components/handbook-doc";
import { Badge, Panel, SectionHeader } from "@/components/ui";

export const metadata = {
  title: "راهنمای سامانه",
};

const PILOT_STEPS: { href: string; label: string; who: string }[] = [
  { href: "/app/product/catalog", label: "تعریف SKU", who: "تولیدکننده" },
  { href: "/app/product/qc", label: "تأیید QC", who: "QC" },
  { href: "/app/inventory/uids", label: "UID", who: "انبار" },
  { href: "/app/commerce/proforma", label: "پیش‌فاکتور", who: "ایجنت" },
  { href: "/app/retailer/catalog", label: "سفارش", who: "خرده‌فروش" },
  { href: "/app/fulfillment", label: "تحقق", who: "انبار" },
  { href: "/app/finance/settlements", label: "تسویه", who: "مالی" },
];

async function loadHandbook() {
  const filePath = path.join(
    process.cwd(),
    "docs/user-guide/handbook.md",
  );
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return [
      "# راهنمای سامانه",
      "",
      "فایل راهنما پیدا نشد. مسیر مورد انتظار:",
      "",
      "`docs/user-guide/handbook.md`",
    ].join("\n");
  }
}

export default async function HelpPage() {
  const markdown = await loadHandbook();

  return (
    <div>
      <SectionHeader
        title="راهنمای کاربری و عملیاتی"
        description="مسیر پایلوت + راهنمای کامل. اگر چند نقش دارید، از سایدبار نقش فعال را عوض کنید."
      />

      <Panel className="mb-6 p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-[var(--ink)]">
            شروع سریع پایلوت
          </h2>
          <Badge tone="ok">زنده · تست‌شده</Badge>
          <Badge tone="warn">OTP دمو · زرین test</Badge>
        </div>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PILOT_STEPS.map((step, i) => (
            <li key={step.href}>
              <Link
                href={step.href}
                className="flex min-h-11 items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--mist)]/60 px-3 py-2.5 transition-colors hover:bg-[var(--mist)]"
              >
                <span
                  data-ltr
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--ink)] text-xs font-semibold text-white"
                >
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--ink)]">
                    {step.label}
                  </span>
                  <span className="block text-[11px] text-[var(--muted)]">
                    {step.who}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Panel>

      <HandbookDoc markdown={markdown} />
    </div>
  );
}
