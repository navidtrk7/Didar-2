import { redirect } from "next/navigation";

/** Legacy admin path → Fulfillment domain */
export default function AdminDeliveriesRedirect() {
  redirect("/app/fulfillment");
}
