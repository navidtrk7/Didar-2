"use client";

import React, { useState } from "react";
import { usePlatform } from "@/context/platform-context";
import { formatNumber, formatWeight, formatRial } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Button, Badge } from "@/components/ui";
import { useToast } from "@/components/toast";
import { ShoppingCart, Eye, Sparkles } from "lucide-react";

export default function CommerceCatalogPage() {
  const { skus, liveGoldPrice } = usePlatform();
  const goldPrice18k = liveGoldPrice;
  const { toast } = useToast();

  const handleOrder = (name: string) => {
    toast(`محصول ${name} به سبد سفارش عمده افزوده‌شد.`);
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="ویترین محصولات و کاتالوگ فروش عمده (B2B Catalog)"
        description="مشاهده کاتالوگ لوکس طلا، قیمت‌گذاری لحظه‌ای بر اساس نرخ زنده عیار ۱۸ و ثبت سفارش B2B."
      />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {skus.map((sku) => {
          const estimatedPrice = (sku.catalogWeight || 2.5) * (goldPrice18k || 4350000) + ((sku as any).wageFee || 150000);
          return (
            <Panel key={sku.id} className="p-5 flex flex-col justify-between space-y-4 hover:border-amber-500/50 transition-colors">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-amber-600 font-bold" data-ltr>{sku.skuCode || (sku as any).code}</span>
                  <Badge tone="gold">{sku.karat || 18} عیار</Badge>
                </div>
                <h3 className="font-bold text-base text-[var(--ink)]">{sku.name}</h3>
                <p className="text-xs text-[var(--muted)]">دسته‌بندی: {sku.category || "طلا و زیورآلات"}</p>
              </div>

              <div className="pt-3 border-t border-[var(--line)] space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted)]">وزن کاتالوگ:</span>
                  <span className="font-bold">{formatWeight(sku.catalogWeight)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--muted)]">قیمت تخمینی واحد:</span>
                  <span className="font-bold text-amber-600">{formatRial(estimatedPrice)}</span>
                </div>
              </div>

              <Button onClick={() => handleOrder(sku.name)} className="w-full bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center gap-1.5 text-xs">
                <ShoppingCart className="w-4 h-4" />
                <span>افزودن به پیش‌فاکتور فروش</span>
              </Button>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
