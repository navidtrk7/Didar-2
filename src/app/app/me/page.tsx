"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "@/context/session-context";
import { usePlatform } from "@/context/platform-context";
import { RoleSidebar } from "@/components/my-space/RoleSidebar";
import { QuickActionHero } from "@/components/my-space/QuickActionHero";
import { RecordCard, type RecordData } from "@/components/my-space/RecordCard";
import { ActionModal } from "@/components/action-modal";
import { formatMoney, formatWeight } from "@/lib/utils";
import {
  Search,
  Filter,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  SlidersHorizontal,
} from "lucide-react";

export default function MySpacePage() {
  const { user, role } = useSession();
  const { orders = [], sealedItems = [], discrepancies = [] } = usePlatform();

  // Active sidebar tab
  const [activeTab, setActiveTab] = useState("orders");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("30_days");

  // Modal for detail view
  const [selectedRecord, setSelectedRecord] = useState<RecordData | null>(null);

  // Generate realistic, domain-connected records from Platform Context
  const allRecords: RecordData[] = useMemo(() => {
    const records: RecordData[] = [];

    // Map orders
    orders.forEach((o, i) => {
      let st: RecordData["status"] = "completed";
      let stLabel = "تحویل شده";
      if (o.status === "picking" || o.status === "draft") {
        st = "pending";
        stLabel = "در انتظار تأیید";
      } else if (o.status === "in_transit" || o.status === "awaiting_otp") {
        st = "processing";
        stLabel = "در راه تحویل (OTP)";
      }

      records.push({
        id: o.id || `ord-${i}`,
        orderNumber: o.code || `ORD-1405-0${i + 12}`,
        type: "order",
        title: `سفارش طلا (${o.items || "کالکشن طلا"})`,
        partyName: o.retailer || "گالری مهر طلا - تهران",
        weightGrams: o.total_weight || 7.2,
        amountIrr: o.value || 48_500_000,
        date: o.created_label || "۱۴۰۵/۰۵/۱۴",
        status: st,
        statusLabel: stLabel,
        detailUrl: "/app/commerce/orders",
      });
    });

    // Add buyback request sample
    records.push({
      id: "bb-1",
      orderNumber: "BB-1405-003",
      type: "buyback",
      title: "درخواست بازخرید آنلاین دستبند ویرا",
      partyName: "گالری زمرد - اصفهان",
      weightGrams: 11.5,
      amountIrr: 98_000_000,
      date: "۱۴۰۵/۰۵/۱۳",
      status: "buyback_paid",
      statusLabel: "بازخرید و تسویه شده",
      detailUrl: "/app/service/buyback",
    });

    // Add warranty activation sample
    records.push({
      id: "wc-1",
      orderNumber: "DDR-18K-ATR01",
      type: "warranty",
      title: "فعال‌سازی گارانتی و شناسنامه گردنبند آترین",
      partyName: "خریدار: مریم احمدی (گالری مهر)",
      weightGrams: 7.2,
      amountIrr: 62_000_000,
      date: "۱۴۰۵/۰۵/۱۲",
      status: "completed",
      statusLabel: "گارانتی فعال",
      detailUrl: "/app/service/warranty",
    });

    // Add pending delivery sample
    records.push({
      id: "del-1",
      orderNumber: "DLV-1405-088",
      type: "delivery",
      title: "ماموریت تحویل محموله امن طلا (پلمب DDR)",
      partyName: "ایجنت: نوید رستمی ➔ بنکداری پارسا",
      weightGrams: 24.8,
      amountIrr: 185_000_000,
      date: "۱۴۰۵/۰۵/۱۴",
      status: "processing",
      statusLabel: "در انتظار رمز OTP",
      detailUrl: "/app/fulfillment/deliveries",
    });

    return records;
  }, [orders]);

  // Filter records
  const filteredRecords = allRecords.filter((r) => {
    if (selectedType !== "all" && r.type !== selectedType) return false;
    if (selectedStatus !== "all" && r.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = r.orderNumber.toLowerCase().includes(q);
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchParty = r.partyName.toLowerCase().includes(q);
      if (!matchNum && !matchTitle && !matchParty) return false;
    }
    return true;
  });

  return (
    <div className="space-y-7 pb-10">
      {/* 1. Hero Widget Section */}
      <QuickActionHero />

      {/* 2. Main Two-Column Layout (Right Sticky Sidebar + Left Records Content) */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Right Sidebar (Alibaba-style) */}
        <RoleSidebar activeTab={activeTab} onSelectTab={setActiveTab} />

        {/* Left / Middle: Main Content Area */}
        <main className="flex-1 w-full space-y-5">
          {/* Filter Bar (Alibaba Search & Filters row) */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی شماره سفارش، شناسه UID یا نام طرف حساب..."
                  className="w-full min-h-[38px] pr-10 pl-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-amber-500/30 placeholder:text-slate-400"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Type Filter */}
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="all">همه انواع رکورد</option>
                  <option value="order">سفارش‌های طلا</option>
                  <option value="buyback">درخواست‌های بازخرید</option>
                  <option value="warranty">گارانتی و شناسنامه</option>
                  <option value="delivery">ماموریت‌های تحویل</option>
                </select>

                {/* Status Filter */}
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="completed">نهایی و تحویل‌شده</option>
                  <option value="pending">در انتظار تایید</option>
                  <option value="processing">در حال پردازش / OTP</option>
                  <option value="buyback_paid">بازخرید شده</option>
                </select>

                {/* Time Range */}
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="min-h-[38px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="30_days">۳۰ روز اخیر</option>
                  <option value="90_days">۳ ماه اخیر</option>
                  <option value="this_year">امسال (۱۴۰۵)</option>
                </select>
              </div>
            </div>

            {/* Results Count Bar */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              <span>
                تعداد رکوردهای یافت‌شده: <strong className="text-amber-600 font-mono">{filteredRecords.length}</strong> مورد
              </span>
              <span className="text-[11px] text-slate-400">به‌روزرسانی لحظه‌ای از پایگاه داده</span>
            </div>
          </div>

          {/* Record Cards List */}
          <div className="space-y-3.5">
            {filteredRecords.length === 0 ? (
              <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                <p className="font-bold text-sm text-[var(--ink)]">هیچ رکوردی با فیلترهای انتخابی یافت نشد.</p>
                <p className="text-xs text-slate-400">می‌توانید فیلترها را تغییر دهید یا جستجوی جدیدی انجام دهید.</p>
              </div>
            ) : (
              filteredRecords.map((record) => (
                <RecordCard
                  key={record.id}
                  record={record}
                  onOpenDetails={(r) => setSelectedRecord(r)}
                />
              ))
            )}
          </div>
        </main>
      </div>

      {/* Details Modal */}
      {selectedRecord && (
        <ActionModal
          open={Boolean(selectedRecord)}
          onClose={() => setSelectedRecord(null)}
          title={`جزئیات سند #${selectedRecord.orderNumber}`}
          description={selectedRecord.title}
          confirmLabel="تایید و بستن"
          onConfirm={() => setSelectedRecord(null)}
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">نوع رکورد:</span>
                <span className="font-bold">{selectedRecord.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">طرف حساب / مشتری:</span>
                <span className="font-bold">{selectedRecord.partyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">تاریخ ثبت:</span>
                <span className="font-mono">{selectedRecord.date}</span>
              </div>
              {selectedRecord.weightGrams && (
                <div className="flex justify-between">
                  <span className="text-slate-500">وزن طلای ۱۸ عیار:</span>
                  <span className="font-mono font-bold text-amber-600">{formatWeight(selectedRecord.weightGrams)}</span>
                </div>
              )}
              {selectedRecord.amountIrr && (
                <div className="flex justify-between">
                  <span className="text-slate-500">مبلغ ریالی:</span>
                  <span className="font-mono font-black">{formatMoney(selectedRecord.amountIrr)} تومان</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">وضعیت سند:</span>
                <span className="font-bold text-emerald-600">{selectedRecord.statusLabel}</span>
              </div>
            </div>
          </div>
        </ActionModal>
      )}
    </div>
  );
}
