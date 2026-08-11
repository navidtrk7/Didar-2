"use client";

import React, { useState } from "react";
import { usePlatform } from "@/context/platform-context";
import { formatNumber } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Button, Field, Badge } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ActionModal } from "@/components/action-modal";
import { useToast } from "@/components/toast";
import { KeyRound, ShieldCheck, Truck } from "lucide-react";

export default function FulfillmentDeliveriesPage() {
  const platform = usePlatform() as any;
  const fulfillmentTasks = platform.fulfillmentTasks || [];
  const confirmOtpDelivery = platform.confirmOtpDelivery || (async () => {});
  const tasks = fulfillmentTasks || [];
  const { toast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("123456");

  const openConfirmModal = (taskId: string) => {
    setSelectedTask(taskId);
    setOtpCode("123456");
    setModalOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedTask) return;
    try {
      await confirmOtpDelivery(selectedTask, otpCode);
      toast("تحویل نهایی طلا با کد یکبارمصرف (OTP) تایید شد و مالکیت منتقل گردید.");
      setModalOpen(false);
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در تایید کد OTP", "warn");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="صف تحویل نهایی و ثبت کد امنیتی (OTP Delivery Confirmation)"
        description="تایید تحویل فیزیکی طلا به خریدار یا گالری با ثبت رمز امنیتی یکبارمصرف."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="تعداد ماموریت‌های تحویل" value={formatNumber(tasks.length)} />
        <Stat label="منتظر رمز یکبارمصرف (OTP)" value={formatNumber(tasks.filter((t: any) => t.status === "awaiting_otp").length)} hint="نیاز به وارد کردن کد خریدار" />
        <Stat label="تحویل و تکمیل شده" value={formatNumber(tasks.filter((t: any) => t.status === "completed").length)} />
      </div>

      <Panel className="p-4">
        <DataTable
          headers={["کد مرجع سفارش", "تحویل گیرنده", "شناسه طلا DDR", "وضعیت تحویل", "تایید OTP"]}
          rows={tasks.map((t: any) => [
            <span key={`${t.id}-ord`} className="font-mono text-xs text-amber-600 font-bold" data-ltr>
              {t.orderId}
            </span>,
            t.recipientName,
            <span key={`${t.id}-u`} className="font-mono text-xs" data-ltr>
              {t.uid}
            </span>,
            <Badge key={`${t.id}-st`} tone={t.status === "completed" ? "ok" : "warn"}>
              {t.status === "completed" ? "تحویل داده شد" : "منتظر ورود OTP"}
            </Badge>,
            t.status !== "completed" ? (
              <Button
                key={`${t.id}-act`}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1 flex items-center gap-1"
                onClick={() => openConfirmModal(t.id)}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>ثبت کد OTP و تحویل</span>
              </Button>
            ) : (
              <span key={`${t.id}-done`} className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" />
                تایید شد
              </span>
            ),
          ])}
        />
      </Panel>

      <ActionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="تایید تحویل فیزیکی طلا با OTP"
        description="کد ۶ رقمی پیامک‌شده به تلفن همراه تحویل‌گیرنده را وارد نمایید."
        confirmLabel="تایید و انتقال رسمی مالکیت"
        onConfirm={() => void handleConfirm()}
      >
        <div className="space-y-4">
          <Field label="کد تایید OTP (کد یکبارمصرف پیامک شده)">
            <input className="field min-h-11 font-mono text-center text-lg tracking-widest" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} dir="ltr" maxLength={6} />
          </Field>
          <p className="text-xs text-[var(--muted)]">در حالت دمو کد پیش‌فرض: 123456</p>
        </div>
      </ActionModal>
    </div>
  );
}
