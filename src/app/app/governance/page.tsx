"use client";

import {
  DomainLinkButton,
  DomainOverviewPage,
} from "@/components/domain-overview";

export default function GovernanceDomainPage() {
  return (
    <DomainOverviewPage
      domainId="governance"
      title="تنظیمات مدیریتی"
      description="مدیریت کاربران، پروفایل کاربری، نقش‌ها، ارتباطات چندذینفعی، سطوح دسترسی و Audit Log."
    >
      <div className="flex flex-wrap gap-3">
        <DomainLinkButton href="/app/governance/users">مدیریت کاربران</DomainLinkButton>
        <DomainLinkButton href="/app/governance/profile">پروفایل (Profile Management)</DomainLinkButton>
        <DomainLinkButton href="/app/governance/roles">مدیریت نقش‌ها</DomainLinkButton>
        <DomainLinkButton href="/app/governance/permissions">سطوح دسترسی</DomainLinkButton>
        <DomainLinkButton href="/app/governance/audit">گزارش فعالیت</DomainLinkButton>
      </div>
    </DomainOverviewPage>
  );
}
