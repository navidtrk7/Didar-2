import { redirect } from "next/navigation";

export default function ProducerReleasesRedirect() {
  redirect("/app/inventory/uids");
}
