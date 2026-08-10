import { redirect } from "next/navigation";

/** Role shell removed — commerce is the agent home. */
export default function AgentHomeRedirect() {
  redirect("/app/commerce");
}
