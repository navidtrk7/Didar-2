import { redirect } from "next/navigation";

/** Legacy fake register — live UIDs live under Inventory. */
export default function AdminAssetsPage() {
  redirect("/app/inventory/uids");
}
