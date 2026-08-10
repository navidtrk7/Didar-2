import { redirect } from "next/navigation";

/** Legacy mock event feed — live dual ledger lives under Finance. */
export default function AdminLedgerPage() {
  redirect("/app/finance/ledger");
}
