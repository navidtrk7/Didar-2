"use client";

import React, { useState } from "react";
import { usePlatform } from "@/context/platform-context";
import { formatNumber, formatWeight } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Field, Button, Badge } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { Search, History, ShieldCheck, UserCheck } from "lucide-react";

export default function ServiceLifecyclePage() {
  const platform = usePlatform() as any;
  const sealedItems = platform.sealedItems || platform.issuedAssets || [];
  const [searchUid, setSearchUid] = useState("DDR-18K-7532-009");

  const sampleHistory = [
    { stage: "۱. ساخت و کنترل کیفیت QC", actor: "آتلیه طلا الماس ➔ مریم کاظمی (QC)", date: "۱۴۰۴/۱۱/۱۵ ۰۹:۳۰", status: "pass" },
    { stage: "۲. پلمب امنیتی و ورود به انبار", actor: "حسین پاکروان (انباردار)", date: "۱۴۰۴/۱۱/۱۵ ۱۰:۱۵", status: "vault" },
    { stage: "۳. تخصیص به سبد سیار ایجنت", actor: "نوید محمدی (ایجنت منطقه ۱)", date: "۱۴۰۴/۱۱/۱۸ ۱۴:۰۰", status: "allocated" },
    { stage: "۴. تحویل به خرده‌فروش با OTP", actor: "سارا احمدی (گالری مهر)", date: "۱۴۰۴/۱۱/۱۹ ۱۶:۴۵", status: "delivered" },
    { stage: "۵. صدور شناسنامه و فعال‌سازی گارانتی", actor: "مشتری نهایی (دیدار)", date: "۱۴۰۴/۱۱/۲۰ ۱۱:۲۰", status: "active_warranty" },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="ردیابی چرخه عمر و ردپای مالکیت طلا (UID Ownership Lifecycle)"
        description="تاریخچه شفاف دست به دست شدن، انتقال مسئولیت فیزیکی و زنجیره تامین پلمب DDR."
      />

      <Panel className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Field label="جستجوی کد بارکد پلمب DDR">
              <input
                className="field min-h-11 font-mono"
                value={searchUid}
                onChange={(e) => setSearchUid(e.target.value)}
                placeholder="DDR-18K-XXXX-XXX"
                dir="ltr"
              />
            </Field>
          </div>
          <div className="flex items-end">
            <Button className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 h-11">
              <Search className="w-4 h-4" />
              <span>استعلام زنجیره تامین</span>
            </Button>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--line)]">
          <h3 className="font-bold text-base text-[var(--ink)] mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" />
            <span>ردپای بلاک‌چینی / فیزیکی شناسه DDR: {searchUid}</span>
          </h3>

          <div className="relative border-r-2 border-amber-500/30 pr-6 space-y-6 mr-3">
            {sampleHistory.map((h, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -right-[31px] top-1 w-4 h-4 rounded-full bg-amber-500 border-4 border-[var(--bg-app)]" />
                <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--mist)] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[var(--ink)]">{h.stage}</span>
                    <span className="text-xs font-mono text-[var(--muted)]" dir="ltr">{h.date}</span>
                  </div>
                  <p className="text-xs text-[var(--muted)]">مسئول / بازیگر: {h.actor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}
