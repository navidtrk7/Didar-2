"use client";

import { usePlatform } from "@/context/platform-context";
import { useSession } from "@/context/session-context";
import { proformaStatusLabels } from "@/data/labels";
import { formatMoney } from "@/lib/utils";
import { Badge, SectionHeader } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import Link from "next/link";
import { Button } from "@/components/ui";

export default function RetailerProformasPage() {
  const { user } = useSession();
  const { proformas } = usePlatform();
  const org = user?.org ?? "گالری مهر طلا";
  const mine = proformas.filter((p) => p.retailer === org);

  return (
    <div>
      <SectionHeader
        title="پیش‌فاکتورهای من"
        description={`اسناد صادرشده برای ${org}.`}
      />
      <DataTable
        headers={["کد", "ایجنت", "اقلام", "مبلغ", "وضعیت", "زمان"]}
        empty={
          <span>
            هنوز پیش‌فاکتوری برای شما ثبت نشده. از ایجنت فروش بخواهید سند صادر
            کند.{" "}
            <Link href="/app/retailer/catalog" className="font-semibold underline">
              کاتالوگ
            </Link>
          </span>
        }
        rows={mine.map((p) => [
          <span key={p.id} data-ltr>
            {p.code}
          </span>,
          p.agent,
          String(p.lines.length),
          formatMoney(p.totalIrr),
          <Badge key={`${p.id}-s`} tone="ok">
            {proformaStatusLabels[p.status]}
          </Badge>,
          p.createdAt,
        ])}
      />
      {mine.length === 0 ? null : (
        <div className="mt-4">
          <Link href="/app/retailer/credit">
            <Button variant="secondary">مشاهده اعتبار</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
