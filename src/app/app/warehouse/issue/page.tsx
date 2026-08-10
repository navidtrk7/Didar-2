import { redirect } from "next/navigation";

/** Legacy role path → Inventory domain UID issue */
export default function WarehouseIssueRedirect() {
  redirect("/app/inventory/uids");
}
