import { redirect } from "next/navigation";

/** Designs UI is parked (mock-only). Send QC to the live QC board. */
export default function QcDesignsRedirect() {
  redirect("/app/product/qc");
}
