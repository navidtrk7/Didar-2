import { redirect } from "next/navigation";

/** Role shell removed — commerce is the retailer home. */
export default function RetailerHomeRedirect() {
  redirect("/app/commerce");
}
