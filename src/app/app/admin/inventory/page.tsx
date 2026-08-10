import { redirect } from "next/navigation";

/** Admin role shell → shared Inventory domain stock view */
export default function AdminInventoryRedirect() {
  redirect("/app/inventory/stock");
}
