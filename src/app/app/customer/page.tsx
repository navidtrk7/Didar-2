import { redirect } from "next/navigation";

/** Role shell removed — service is the customer home. */
export default function CustomerHomeRedirect() {
  redirect("/app/service");
}
