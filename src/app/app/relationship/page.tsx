"use client";

import { useEffect, useState } from "react";
import { DomainOverviewPage } from "@/components/domain-overview";
import { DomainEmptyState } from "@/components/domain-empty";
import { WorkJourney } from "@/components/work-journey";
import { ActionModal } from "@/components/action-modal";
import { DataTable } from "@/components/data-table";
import { Badge, Button, Field, Panel, Stat } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useSession } from "@/context/session-context";
import { roleHasPermission } from "@/data/domains";
import { apiEnabled, didarApi } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string;
  party_org_id: string | null;
  party_name: string | null;
  role_label: string;
  notes: string;
  created_at: string;
};

type Campaign = {
  id: string;
  name: string;
  channel: string;
  status: string;
  trigger_event: string | null;
  fired_count: number;
  last_fired_at: string | null;
  created_at: string;
};

type Party = { id: string; name: string; kind: string };

export default function RelationshipDomainPage() {
  const { toast } = useToast();
  const { role } = useSession();
  const canManage = roleHasPermission(role, "relationship.manage");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [openContact, setOpenContact] = useState(false);
  const [openCampaign, setOpenCampaign] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [partyId, setPartyId] = useState("");
  const [roleLabel, setRoleLabel] = useState("buyer");
  const [notes, setNotes] = useState("");
  const [campName, setCampName] = useState("");
  const [channel, setChannel] = useState("sms");

  const load = async () => {
    if (!apiEnabled()) return;
    try {
      const [c, camps, p] = await Promise.all([
        didarApi.listContacts() as Promise<Contact[]>,
        didarApi.listCampaigns() as Promise<Campaign[]>,
        didarApi.listParties() as Promise<Party[]>,
      ]);
      setContacts(c);
      setCampaigns(camps);
      setParties(p);
    } catch (e) {
      setContacts([]);
      setCampaigns([]);
      toast(e instanceof Error ? e.message : "بارگذاری ارتباطات ناموفق", "warn");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const submitContact = async () => {
    if (!name.trim()) {
      toast("نام مخاطب الزامی است", "warn");
      return;
    }
    try {
      await didarApi.createContact({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        party_org_id: partyId || null,
        role_label: roleLabel,
        notes: notes.trim(),
      });
      setOpenContact(false);
      setName("");
      setPhone("");
      setEmail("");
      setPartyId("");
      setNotes("");
      toast("مخاطب ثبت شد");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  const submitCampaign = async () => {
    if (!campName.trim()) {
      toast("نام کمپین الزامی است", "warn");
      return;
    }
    try {
      await didarApi.createCampaign({
        name: campName.trim(),
        channel,
        status: "draft",
        trigger_event: "order.submitted",
      });
      setOpenCampaign(false);
      setCampName("");
      toast("کمپین پیش‌نویس ثبت شد");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  const toggleCampaign = async (c: Campaign) => {
    try {
      if (c.status === "active") {
        await didarApi.pauseCampaign(c.id);
        toast("کمپین متوقف شد");
      } else {
        await didarApi.activateCampaign(c.id);
        toast("کمپین فعال شد — با رویدادهای مرتبط در سیستم اجرا می‌شود");
      }
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  const totalFired = campaigns.reduce((n, c) => n + (c.fired_count || 0), 0);

  return (
    <div>
      <WorkJourney role={role} compact />
    <DomainOverviewPage
      domainId="relationship"
      title="ارتباطات"
      description="مخاطبین شبکه و کمپین‌های پیگیری ارتباط با طرف‌های کسب‌وکار."
      actions={
        canManage && apiEnabled() ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setOpenCampaign(true)}>
              کمپین جدید
            </Button>
            <Button onClick={() => setOpenContact(true)}>مخاطب جدید</Button>
          </div>
        ) : undefined
      }
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="مخاطبین" value={formatNumber(contacts.length)} />
        <Stat label="کمپین‌ها" value={formatNumber(campaigns.length)} />
        <Stat label="اجرا شده" value={formatNumber(totalFired)} />
      </div>

      {!apiEnabled() ? (
        <DomainEmptyState
          title="این بخش در حال تکمیل است"
          body="ارتباطات برای پیگیری مخاطبین و کمپین پس از اتصال سرویس فعال می‌شود. جریان اصلی فروش از تجارت و تحقق سفارش ادامه دارد."
          href="/app/commerce"
          actionLabel="رفتن به تجارت"
        />
      ) : null}

      <SectionBlock title="مخاطبین">
        <DataTable
          headers={["نام", "طرف شبکه", "نقش", "تماس", "یادداشت"]}
          rows={contacts.map((c) => [
            c.name,
            c.party_name ?? "—",
            <Badge key={`${c.id}-r`} tone="neutral">
              {c.role_label}
            </Badge>,
            <span key={`${c.id}-p`} data-ltr className="text-xs">
              {c.phone || c.email || "—"}
            </span>,
            c.notes || "—",
          ])}
          empty="مخاطبی نیست."
        />
      </SectionBlock>

      <SectionBlock title="کمپین‌ها">
        <DataTable
          headers={["نام", "کانال", "وضعیت", "رویداد شروع", "اجرا", "عمل"]}
          rows={campaigns.map((c) => [
            c.name,
            c.channel,
            <Badge
              key={`${c.id}-s`}
              tone={c.status === "active" ? "ok" : "neutral"}
            >
              {c.status}
            </Badge>,
            <span key={`${c.id}-t`} className="text-xs">
              {c.trigger_event === "order.submitted"
                ? "پس از ثبت سفارش"
                : c.trigger_event ?? "—"}
            </span>,
            <span key={`${c.id}-f`} className="text-xs">
              {formatNumber(c.fired_count || 0)}
              {c.last_fired_at ? ` · ${c.last_fired_at}` : ""}
            </span>,
            canManage ? (
              <Button
                key={`${c.id}-a`}
                variant="secondary"
                onClick={() => void toggleCampaign(c)}
              >
                {c.status === "active" ? "توقف" : "فعال‌سازی"}
              </Button>
            ) : (
              "—"
            ),
          ])}
          empty="کمپینی نیست."
        />
      </SectionBlock>

      <ActionModal
        open={openContact}
        onClose={() => setOpenContact(false)}
        title="مخاطب جدید"
        description="اتصال به یکی از طرف‌های شبکه (گالری، بنکدار، …)."
        confirmLabel="ثبت"
        onConfirm={() => void submitContact()}
      >
        <Field label="نام">
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="طرف شبکه">
          <select
            className="field"
            value={partyId}
            onChange={(e) => setPartyId(e.target.value)}
          >
            <option value="">— بدون اتصال —</option>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.kind})
              </option>
            ))}
          </select>
        </Field>
        <Field label="نقش">
          <select
            className="field"
            value={roleLabel}
            onChange={(e) => setRoleLabel(e.target.value)}
          >
            <option value="buyer">خریدار</option>
            <option value="manager">مدیر</option>
            <option value="contact">مخاطب</option>
          </select>
        </Field>
        <Field label="تلفن">
          <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
        </Field>
        <Field label="ایمیل">
          <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
        </Field>
        <Field label="یادداشت">
          <input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </ActionModal>

      <ActionModal
        open={openCampaign}
        onClose={() => setOpenCampaign(false)}
        title="کمپین جدید"
        description="پیش‌نویس کمپین — پس از ثبت می‌توانید آن را فعال کنید. به‌صورت پیش‌فرض پس از ثبت سفارش اجرا می‌شود."
        confirmLabel="ثبت پیش‌نویس"
        onConfirm={() => void submitCampaign()}
      >
        <Field label="نام">
          <input className="field" value={campName} onChange={(e) => setCampName(e.target.value)} />
        </Field>
        <Field label="کانال">
          <select className="field" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="sms">SMS</option>
            <option value="email">ایمیل</option>
            <option value="call">تماس</option>
          </select>
        </Field>
      </ActionModal>
    </DomainOverviewPage>
    </div>
  );
}

function SectionBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-sm font-semibold text-[var(--ink)]">{title}</h2>
      {children}
    </div>
  );
}
