"use client";

import { FulfillmentBoard } from "@/components/fulfillment-board";

export default function FulfillmentDeliveryPage() {
  return (
    <FulfillmentBoard
      title="تحویل نهایی"
      description="ایجاد حواله از پیش‌فاکتور و تأیید با کد دمو 1234 (SMS واقعی هنوز وصل نیست)."
      filterStage="awaiting_otp"
      allowOtp
      showCreate
    />
  );
}
