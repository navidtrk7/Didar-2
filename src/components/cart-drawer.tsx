"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Minus,
  Plus,
  Scale,
  ShoppingBag,
  Trash2,
  X,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatMoney, formatNumber, formatWeight } from "@/lib/utils";
import { Button } from "@/components/ui";
import { RetailerCheckoutModal } from "./retailer-checkout-modal";

interface CartDrawerProps {
  goldRate: number;
}

export function CartDrawer({ goldRate }: CartDrawerProps) {
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeItem,
    clearCart,
    calculateTotals,
  } = useCart();

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const totals = calculateTotals(goldRate);

  const handleStartCheckout = () => {
    setCheckoutModalOpen(true);
  };

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeCart}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            />

            <div className="fixed inset-y-0 left-0 flex max-w-full pl-0 sm:pl-10">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
                className="w-screen max-w-md bg-[var(--surface)] text-[var(--ink)] shadow-2xl border-r border-[var(--line)] flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4 bg-[var(--surface-glass)]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--gold)]/15 text-[var(--gold-deep)]">
                      <ShoppingBag size={18} />
                    </div>
                    <div>
                      <h2 className="font-semibold text-base">
                        سبد سفارشات خرده‌فروشی
                      </h2>
                      <p className="text-xs text-[var(--muted)]">
                        {totals.totalItems > 0
                          ? `${formatNumber(totals.totalItems)} قطعه انتخابی · ${formatWeight(totals.totalWeightGrams)}`
                          : "سبد سفارش خالی است"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeCart}
                    className="rounded-lg p-2 text-[var(--muted)] hover:bg-[var(--mist)] hover:text-[var(--ink)]"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Body / Items List */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {items.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--mist)] text-[var(--muted)]">
                        <ShoppingBag size={32} />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--ink)]">
                          سبد سفارش شما خالی است
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-1.5 leading-6 max-w-xs">
                          محصولات و قطعات طلای ۱۸ عیار دیدار را از ویترین و کاتالوگ انتخاب کرده و به سبد خود اضافه کنید.
                        </p>
                      </div>
                      <Button onClick={closeCart} variant="secondary">
                        مشاهده ویترین محصولات
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Live gold rate badge */}
                      <div className="rounded-xl border border-[var(--line)] bg-[var(--mist)] p-3 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-[var(--muted)]">
                          <Scale size={14} className="text-[var(--gold-deep)]" />
                          <span>نرخ مبنای ۱۸ عیار:</span>
                        </div>
                        <span className="font-mono font-semibold text-[var(--ink)]">
                          {formatMoney(goldRate)} / گرم
                        </span>
                      </div>

                      {/* Items */}
                      <div className="space-y-3">
                        {items.map((item) => {
                          const itemMetalValue =
                            item.product.weightGrams * goldRate * item.quantity;
                          const itemCraftValue =
                            item.product.estimatedCraftFee * item.quantity;
                          const itemTotal = itemMetalValue + itemCraftValue;

                          return (
                            <div
                              key={item.product.slug}
                              className="group relative rounded-2xl border border-[var(--line)] bg-white p-3 shadow-sm transition-all hover:border-[var(--gold)]/40"
                            >
                              <div className="flex gap-3">
                                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F3F1EC] border border-[var(--line)]">
                                  <Image
                                    src={item.product.imageUrl}
                                    alt={item.product.name}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                  />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-1">
                                    <div>
                                      <p className="text-[11px] font-semibold text-[var(--gold-deep)]">
                                        {item.product.collection}
                                      </p>
                                      <h4 className="truncate font-semibold text-sm text-[var(--ink)]">
                                        {item.product.name}
                                      </h4>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeItem(item.product.slug)}
                                      className="text-[var(--muted)] hover:text-red-600 transition-colors p-1"
                                      title="حذف"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>

                                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                                    <span>
                                      وزن واحد:{" "}
                                      <strong className="text-[var(--ink)]">
                                        {formatWeight(item.product.weightGrams)}
                                      </strong>
                                    </span>
                                    <span>·</span>
                                    <span>
                                      اجرت:{" "}
                                      <strong className="text-[var(--ink)]">
                                        {formatNumber(item.product.craftFeePct)}٪
                                      </strong>
                                    </span>
                                  </div>

                                  <div className="mt-2.5 flex items-center justify-between">
                                    <div className="flex items-center rounded-lg border border-[var(--line)] bg-[var(--mist)]">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateQuantity(
                                            item.product.slug,
                                            item.quantity - 1,
                                          )
                                        }
                                        className="p-1 hover:bg-white rounded-r-lg text-[var(--muted)] hover:text-[var(--ink)]"
                                      >
                                        <Minus size={14} />
                                      </button>
                                      <span className="w-8 text-center text-xs font-semibold font-mono">
                                        {item.quantity}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateQuantity(
                                            item.product.slug,
                                            item.quantity + 1,
                                          )
                                        }
                                        className="p-1 hover:bg-white rounded-l-lg text-[var(--muted)] hover:text-[var(--ink)]"
                                      >
                                        <Plus size={14} />
                                      </button>
                                    </div>

                                    <div className="text-left">
                                      <p className="text-xs font-bold text-[var(--ink)] tabular-nums">
                                        {formatMoney(itemTotal)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {items.length > 0 && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={clearCart}
                            className="text-xs text-[var(--muted)] hover:text-red-500 underline"
                          >
                            خالی کردن سبد خرید
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Footer / Summary */}
                {items.length > 0 && (
                  <div className="border-t border-[var(--line)] bg-[var(--surface-glass)] p-5 space-y-4">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-[var(--muted)]">
                        <span>مجموع وزن خالص طلای ۱۸ عیار:</span>
                        <span className="font-semibold text-[var(--ink)] tabular-nums">
                          {formatWeight(totals.totalWeightGrams)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[var(--muted)]">
                        <span>ارزش خالص فلز طلا:</span>
                        <span className="tabular-nums">
                          {formatMoney(totals.rawMetalValue)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[var(--muted)]">
                        <span>مجموع اجرت ساخت قطعات:</span>
                        <span className="tabular-nums">
                          {formatMoney(totals.totalCraftFee)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-[var(--line)] pt-2 text-sm font-bold text-[var(--ink)]">
                        <span>مبلغ کل برآورد شده:</span>
                        <span className="text-[var(--gold-deep)] text-base tabular-nums">
                          {formatMoney(totals.grandTotal)}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-xl bg-[var(--mist)] p-3 text-[11px] leading-5 text-[var(--muted)] flex items-start gap-2">
                      <ShieldCheck size={16} className="text-[var(--gold-deep)] shrink-0 mt-0.5" />
                      <span>
                        تسویه نهایی پس از صدور پیش‌فاکتور رسمی، با هماهنگی میز فروش و قابلیت تسویه
                        نقدی یا اعتباری انجام خواهد شد.
                      </span>
                    </div>

                    <Button
                      onClick={handleStartCheckout}
                      className="w-full py-3.5 text-sm font-bold shadow-lg"
                    >
                      نهایی‌سازی سفارش و ثبت مشخصات خرده‌فروش
                      <ArrowLeft size={16} />
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Retailer Checkout & Registration Modal */}
      <RetailerCheckoutModal
        open={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        goldRate={goldRate}
      />
    </>
  );
}
