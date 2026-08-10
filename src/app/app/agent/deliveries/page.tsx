import { redirect } from "next/navigation";

export default function AgentDeliveriesRedirect() {
  redirect("/app/fulfillment/delivery");
}
