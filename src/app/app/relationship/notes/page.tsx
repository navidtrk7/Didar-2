"use client";

import React, { useState } from "react";
import { formatNumber } from "@/lib/utils";
import { SectionHeader, Panel, Stat, Button, Field, Badge } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ActionModal } from "@/components/action-modal";
import { useToast } from "@/components/toast";
import { NotebookPen, Plus, MessageSquare } from "lucide-react";

export default function RelationshipNotesPage() {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [partyName, setPartyName] = useState("گالری مهر طلا");
  const [noteContent, setNoteContent] = useState("");

  const [notes, setNotes] = useState([
    { id: "n-1", party: "گالری مهر طلا", agent: "نوید محمدی", note: "درخواست ۵ عدد انگشتر طرح زمرد ۱۸ عیار برای انتهای هفته دارد.", date: "امروز ۱۰:۱۵" },
    { id: "n-2", party: "بنکداری آریا", agent: "رضا کریمی", note: "تسویه حساب نقد برای فاکتور قبلی انجام شد. تمایل به ثبت سفارش ۵۰ گرمی جدید دارد.", date: "امروز ۰۹:۰۰" },
  ]);

  const handleCreate = () => {
    if (!noteContent.trim()) {
      toast("متن یادداشت را وارد کنید", "warn");
      return;
    }
    setNotes((prev) => [
      ...prev,
      { id: `n-${Date.now()}`, party: partyName, agent: "نوید محمدی", note: noteContent.trim(), date: "چند لحظه پیش" },
    ]);
    toast("یادداشت ایجنت با موفقیت ثبت شد");
    setModalOpen(false);
    setNoteContent("");
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="یادداشت‌های میدانی و بازخورد ایجنت‌ها (Agent Field Notes)"
        description="ثبت گزارش بازدید از گالری‌ها، تمایلات سفارش ذینفعان و پیگیری‌های ایجنت‌های فروش."
        action={
          <Button onClick={() => setModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            <span>ثبت یادداشت جدید</span>
          </Button>
        }
      />

      <Panel className="p-4">
        <DataTable
          headers={["طرف شبکه / گالری", "ایجنت ثبت‌کننده", "شرح یادداشت / بازخورد", "زمان ثبت"]}
          rows={notes.map((n) => [
            <div key={`${n.id}-p`} className="font-semibold">{n.party}</div>,
            n.agent,
            n.note,
            <span key={`${n.id}-d`} className="text-xs text-[var(--muted)]" dir="ltr">{n.date}</span>,
          ])}
        />
      </Panel>

      <ActionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="ثبت یادداشت میدانی ایجنت"
        description="گزارش گفتگو یا بازخورد گالری در بازدید حضوری."
        confirmLabel="ثبت یادداشت"
        onConfirm={handleCreate}
      >
        <div className="space-y-4">
          <Field label="نام گالری / طرف شبکه">
            <input className="field min-h-11" value={partyName} onChange={(e) => setPartyName(e.target.value)} />
          </Field>
          <Field label="متن یادداشت / بازخورد گالری">
            <textarea className="field min-h-24" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="جزئیات مذاکره یا سفارش مد نظر گالری..." />
          </Field>
        </div>
      </ActionModal>
    </div>
  );
}
