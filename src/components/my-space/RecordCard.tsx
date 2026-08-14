"use client";

import React from "react";
import Link from "next/link";
import { formatMoney, formatWeight } from "@/lib/utils";
import {
  ShoppingBag,
  RefreshCw,
  ShieldCheck,
  PackageCheck,
  CheckCircle2,
  Clock,
  ChevronLeft,
  Calendar,
  Building2,
  FileText,
} from "lucide-react";

export interface RecordData {
  id: string;
  orderNumber: string;
  type: "order" | "buyback" | "warranty" | "delivery" | "inspection";
  title: string;
  partyName: string;
  weightGrams?: number;
  amountIrr?: number;
  date: string;
  status: "completed" | "pending" | "processing" | "canceled" | "buyback_paid";
  statusLabel: string;
  detailUrl?: string;
}

interface RecordCardProps {
  record: RecordData;
  onOpenDetails?: (record: RecordData) => void;
}

export function RecordCard({ record, onOpenDetails }: RecordCardProps) {
  const getStatusBadge = () => {
    switch (record.status) {
      case "completed":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
          dot: "bg-emerald-500",
        };
      case "pending":
      case "processing":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
          dot: "bg-amber-500",
        };
      case "buyback_paid":
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
          dot: "bg-purple-500",
        };
      case "canceled":
      default:
        return {
          bg: "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
          dot: "bg-slate-400",
        };
    }
  };

  const getTypeIcon = () => {
    switch (record.type) {
      case "buyback":
        return RefreshCw;
      case "warranty":
        return ShieldCheck;
      case "delivery":
        return PackageCheck;
      case "inspection":
        return CheckCircle2;
      case "order":
      default:
        return ShoppingBag;
    }
  };

  const statusStyle = getStatusBadge();
  const Icon = getTypeIcon();

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-500/40 transition-all duration-200 flex flex-col justify-between gap-4">
      {/* Top Bar: Type + Order ID & Colored Status Pill */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[var(--ink)]">{record.title}</h4>
            <span className="font-mono text-xs text-slate-400" dir="ltr">
              #{record.orderNumber}
            </span>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusStyle.bg}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          <span>{record.statusLabel}</span>
        </span>
      </div>

      {/* Middle: Details Grid */}
      <div className="grid gap-3 sm:grid-cols-3 text-xs">
        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="truncate">{record.partyName}</span>
        </div>

        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{record.date}</span>
        </div>

        <div className="flex items-center gap-2 sm:justify-end">
          {record.weightGrams && (
            <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md font-mono">
              {formatWeight(record.weightGrams)}
            </span>
          )}
          {record.amountIrr && (
            <span className="font-black text-[var(--ink)] font-mono">
              {formatMoney(record.amountIrr)} تومان
            </span>
          )}
        </div>
      </div>

      {/* Bottom: Action bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          <span>ثبت در سیستم زنجیره دیدار</span>
        </span>

        {record.detailUrl ? (
          <Link
            href={record.detailUrl}
            className="inline-flex items-center gap-1 font-bold text-amber-600 hover:text-amber-700 transition-colors"
          >
            <span>مشاهده جزئیات</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onOpenDetails?.(record)}
            className="inline-flex items-center gap-1 font-bold text-amber-600 hover:text-amber-700 transition-colors"
          >
            <span>مشاهده جزئیات</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
