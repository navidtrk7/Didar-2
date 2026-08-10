import { redirect } from "next/navigation";

/** Legacy role path → Inventory domain */
export default function WarehouseOverviewRedirect() {
  redirect("/app/inventory");
}
