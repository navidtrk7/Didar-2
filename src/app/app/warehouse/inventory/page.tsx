import { redirect } from "next/navigation";

/** Legacy role path → Inventory domain stock */
export default function WarehouseInventoryRedirect() {
  redirect("/app/inventory/stock");
}
