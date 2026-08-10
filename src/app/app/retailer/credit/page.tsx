"use client";

import { usePlatform } from "@/context/platform-context";
import { useSession } from "@/context/session-context";
import { useWorkspace } from "@/context/workspace-context";
import { formatMoney, formatNumber, formatWeight } from "@/lib/utils";
import { Badge, Panel, SectionHeader, Stat } from "@/components/ui";
import { DataTable } from "@/components/data-table";

export default function RetailerCreditPage() {
  const { user } = useSession();
  const { activeHat } = useWorkspace();
  const { creditAccounts, creditDocuments, error } = usePlatform();
  const org = activeHat?.partyName ?? user?.org ?? "";
  const account = org
    ? creditAccounts.find((c) => c.retailer === org)
    : undefined;

  if (error) {
    return (
      <div>
        <SectionHeader
          title="اعتبار و تراز مالی"
          description="سقف اعتبار و اسناد سررسید"
        />
        <Panel className="p-5 text-sm text-amber-950 bg-amber-50">
          داده زنده بارگذاری نشد: {error}
        </Panel>
      </div>
    );
  }

  if (!org) {
    return (
      <div>
        <SectionHeader
          title="اعتبار و تراز مالی"
          description="سقف اعتبار و اسناد سررسید"
        />
        <Panel className="p-5 text-sm text-[var(--muted)]">
          سازمان/شعبه برای این کاربر مشخص نیست.
        </Panel>
      </div>
    );
  }

  if (!account) {
    return (
      <div>
        <SectionHeader
          title="اعتبار و تراز مالی"
          description={`سقف اعتبار — ${org}`}
        />
        <Panel className="p-5 text-sm text-[var(--muted)]">
          حساب اعتباری برای «{org}» یافت نشد.
        </Panel>
      </div>
    );
  }

  const docs = creditDocuments.filter((d) => d.retailer === account.retailer);
  const usedPct =
    account.ceilingGrams > 0
      ? Math.round((account.usedGrams / account.ceilingGrams) * 100)
      : 0;

  return (
    <div>
      <SectionHeader
        title="اعتبار و تراز مالی"
        description={`سقف اعتبار و اسناد سررسید — ${account.retailer}`}
      />

      {account.blocked ? (
        <Panel className="mb-6 border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          به‌دلیل بدهی معوق، ثبت پیش‌فاکتور جدید امکان‌پذیر نیست.
        </Panel>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="سقف اعتبار" value={formatWeight(account.ceilingGrams)} />
        <Stat
          label="قابل استفاده"
          value={formatWeight(account.ceilingGrams - account.usedGrams)}
        />
        <Stat label="بدهی جاری" value={formatWeight(account.usedGrams)} />
        <Stat
          label="معوق"
          value={formatWeight(account.overdueGrams)}
          hint={`${usedPct}٪ مصرف سقف`}
        />
      </div>

      <div className="mt-8">
        <SectionHeader title="اسناد مالی" level={2} />
        <DataTable
          headers={["شناسه", "مبلغ", "وزن", "سررسید", "تاخیر", "وضعیت"]}
          empty="سندی برای این شعبه ثبت نشده است."
          rows={docs.map((d) => [
            <span key={d.id} data-ltr>
              {d.code}
            </span>,
            formatMoney(d.amountIrr / 10),
            formatWeight(d.weightGrams),
            d.dueDate,
            d.overdueDays > 0 ? formatNumber(d.overdueDays) : "—",
            <Badge
              key={`${d.id}-s`}
              tone={
                d.status === "overdue"
                  ? "danger"
                  : d.status === "settled"
                    ? "ok"
                    : "warn"
              }
            >
              {d.status === "overdue"
                ? "معوق"
                : d.status === "settled"
                  ? "تسویه"
                  : "باز"}
            </Badge>,
          ])}
        />
      </div>
    </div>
  );
}
