"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DomainLinkButton,
  DomainOverviewPage,
} from "@/components/domain-overview";
import { WorkJourney } from "@/components/work-journey";
import { ActionModal } from "@/components/action-modal";
import { DataTable } from "@/components/data-table";
import { Badge, Button, Field, Panel, Stat } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useSession } from "@/context/session-context";
import { roleHasPermission } from "@/data/domains";
import { apiEnabled, didarApi } from "@/lib/api";
import { formatNumber } from "@/lib/utils";

type PartyType = {
  kind: string;
  label_fa: string;
  what_they_do: string;
  capabilities: string[];
  required_profile: string[];
  suggested_fields: string[];
  assignee_required: boolean;
  can_archive: boolean;
};

type ChecklistItem = {
  key: string;
  label_fa: string;
  source: string;
  filled: boolean;
  editable: boolean;
  note?: string | null;
};

type Party = {
  id: string;
  name: string;
  kind: string;
  kind_label: string;
  status: string;
  city: string | null;
  address: string | null;
  phone: string | null;
  union_license: string | null;
  national_id: string | null;
  summary: string | null;
  profile: Record<string, unknown>;
  member_count: number;
  capabilities: string[];
  what_they_do: string;
  assignee_required: boolean;
  trust_tier?: string;
  trust_tier_label?: string;
  readiness?: string;
  readiness_label?: string;
  missing_mandatory?: string[];
  missing_activation?: string[];
  profile_checklist?: Record<string, ChecklistItem[]>;
};

const TRUST_TIERS = [
  { id: "cash_only", label: "فقط نقد / واریز" },
  { id: "phone_ok", label: "تلفن و شفاهی مجاز" },
  { id: "open_account", label: "حساب باز / اعتماد کامل" },
];

const STAGE_ORDER = [
  "mandatory",
  "activation",
  "extension",
  "later",
  "system",
] as const;

const STAGE_LABEL: Record<string, string> = {
  mandatory: "اجباری اولیه",
  activation: "فعال‌سازی",
  extension: "اختصاصی دیدار",
  later: "بلوغ (بعداً — فرم نیست)",
  system: "سیستم‌ساخته (ورود دستی نیست)",
};

function readinessTone(
  readiness?: string,
): "ok" | "warn" | "danger" | "neutral" {
  if (readiness === "ready") return "ok";
  if (readiness === "activation_incomplete") return "warn";
  if (readiness === "archived") return "neutral";
  return "danger";
}

type Member = {
  id: string;
  user_id: string;
  user_name: string;
  user_username: string;
  title: string;
  status: string;
};

type Role = {
  id: string;
  code: string;
  label_fa: string;
  description: string;
  is_system: boolean;
  status: string;
};

type Person = {
  id: string;
  name: string;
  username: string;
  primary_role: string;
  roles: string[];
  primary_org_name: string;
  status: string;
};

type Tab = "parties" | "roles" | "people";

export default function NetworkDomainPage({ initialFilter }: { initialFilter?: string } = {}) {
  const { toast } = useToast();
  const { role } = useSession();
  const canManage = roleHasPermission(role, "network.manage");

  const [tab, setTab] = useState<Tab>("parties");
  const [types, setTypes] = useState<PartyType[]>([]);
  const [kindFilter, setKindFilter] = useState<string>(initialFilter || "");
  const [unassignedOnly, setUnassignedOnly] = useState(false);
  const [parties, setParties] = useState<Party[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selected, setSelected] = useState<Party | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  const [openCreate, setOpenCreate] = useState(false);
  const [openAssign, setOpenAssign] = useState(false);
  const [openRole, setOpenRole] = useState(false);
  const [openGrant, setOpenGrant] = useState(false);

  const [formKind, setFormKind] = useState("gallery");
  const [formName, setFormName] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formLicense, setFormLicense] = useState("");
  const [formSummary, setFormSummary] = useState("");

  const [assignUserId, setAssignUserId] = useState("");
  const [assignTitle, setAssignTitle] = useState("عضو");
  const [roleCode, setRoleCode] = useState("");
  const [roleLabel, setRoleLabel] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [grantUserId, setGrantUserId] = useState("");
  const [grantRoleCode, setGrantRoleCode] = useState("");

  const formType = useMemo(
    () => types.find((t) => t.kind === formKind),
    [types, formKind],
  );
  const filterType = useMemo(
    () => types.find((t) => t.kind === kindFilter),
    [types, kindFilter],
  );

  const loadParties = async () => {
    if (!apiEnabled()) return;
    const rows = (await didarApi.listParties(
      kindFilter || undefined,
    )) as Party[];
    setParties(rows);
  };

  const loadAll = async () => {
    if (!apiEnabled()) return;
    try {
      const [t, r, p] = await Promise.all([
        didarApi.listPartyTypes() as Promise<PartyType[]>,
        didarApi.listNetworkRoles() as Promise<Role[]>,
        didarApi.listNetworkPeople() as Promise<Person[]>,
      ]);
      setTypes(t);
      setRoles(r);
      setPeople(p);
      await loadParties();
    } catch (e) {
      setParties([]);
      toast(e instanceof Error ? e.message : "بارگذاری شبکه ناموفق", "warn");
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadParties().catch((e: unknown) => {
      setParties([]);
      toast(e instanceof Error ? e.message : "بارگذاری طرف‌ها ناموفق", "warn");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kindFilter]);

  const openParty = async (p: Party) => {
    setSelected(p);
    try {
      const full = (await didarApi.getParty(p.id)) as Party;
      setSelected(full);
      const m = (await didarApi.listPartyMembers(p.id)) as Member[];
      setMembers(m);
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  const createParty = async () => {
    if (!formName.trim()) {
      toast("نام طرف شبکه الزامی است", "warn");
      return;
    }
    try {
      const meta = types.find((t) => t.kind === formKind);
      await didarApi.createParty({
        name: formName.trim(),
        kind: formKind,
        city: formCity.trim() || null,
        address: formAddress.trim() || null,
        phone: formPhone.trim() || null,
        union_license: formLicense.trim() || null,
        summary: formSummary.trim() || meta?.what_they_do || null,
        profile: { capabilities: meta?.capabilities ?? [] },
      });
      setOpenCreate(false);
      setFormName("");
      setFormCity("");
      setFormAddress("");
      setFormPhone("");
      setFormLicense("");
      setFormSummary("");
      toast("طرف شبکه اضافه شد — می‌تواند بدون مسئول باشد");
      await loadParties();
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  const archiveSelected = async () => {
    if (!selected) return;
    try {
      await didarApi.archiveParty(selected.id);
      toast("بایگانی شد (حذف سخت نیست)");
      setSelected(null);
      await loadParties();
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  const assignMember = async () => {
    if (!selected || !assignUserId) {
      toast("کاربر را انتخاب کنید", "warn");
      return;
    }
    try {
      await didarApi.assignPartyMember(selected.id, {
        user_id: assignUserId,
        title: assignTitle.trim() || "عضو",
      });
      setOpenAssign(false);
      toast("مسئول / عضو اضافه شد");
      await openParty(selected);
      await loadParties();
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  const unassign = async (membershipId: string) => {
    if (!selected) return;
    try {
      await didarApi.unassignPartyMember(membershipId);
      toast("عضویت برداشته شد");
      await openParty(selected);
      await loadParties();
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  const createRole = async () => {
    if (!roleCode.trim() || !roleLabel.trim()) {
      toast("کد و عنوان نقش الزامی است", "warn");
      return;
    }
    try {
      await didarApi.createNetworkRole({
        code: roleCode.trim(),
        label_fa: roleLabel.trim(),
        description: roleDesc.trim(),
      });
      setOpenRole(false);
      setRoleCode("");
      setRoleLabel("");
      setRoleDesc("");
      toast("نقش سفارشی اضافه شد");
      const r = (await didarApi.listNetworkRoles()) as Role[];
      setRoles(r);
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  const archiveRole = async (id: string) => {
    try {
      await didarApi.archiveNetworkRole(id);
      toast("نقش بایگانی شد");
      setRoles((await didarApi.listNetworkRoles()) as Role[]);
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  const grantRole = async () => {
    if (!grantUserId || !grantRoleCode) {
      toast("شخص و نقش را انتخاب کنید", "warn");
      return;
    }
    try {
      await didarApi.grantNetworkRole({
        user_id: grantUserId,
        role_code: grantRoleCode,
      });
      setOpenGrant(false);
      toast("نقش به شخص اضافه شد (چندنقشی)");
      setPeople((await didarApi.listNetworkPeople()) as Person[]);
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  const unassignedCount = parties.filter((p) => p.member_count === 0).length;
  const visibleParties = unassignedOnly
    ? parties.filter((p) => p.member_count === 0)
    : parties;

  return (
    <div>
      <WorkJourney role={role} compact />
    <DomainOverviewPage
      domainId="network"
      title="شبکه"
      description="طرف‌های بازار طلای ایران — کارخانه، کارگاه، بنکدار، گالری، خزانه، ایجنت. فروشگاه می‌تواند بدون مسئول باشد؛ اشخاص چند نقش و چند محل می‌گیرند."
      actions={
        canManage && apiEnabled() ? (
          <div className="flex flex-wrap gap-2">
            {tab === "parties" ? (
              <Button
                onClick={() => {
                  setFormKind(kindFilter || "gallery");
                  setOpenCreate(true);
                }}
              >
                افزودن طرف شبکه
              </Button>
            ) : null}
            {tab === "roles" ? (
              <Button onClick={() => setOpenRole(true)}>نقش سفارشی</Button>
            ) : null}
            {tab === "people" ? (
              <Button onClick={() => setOpenGrant(true)}>اعطای نقش</Button>
            ) : null}
          </div>
        ) : undefined
      }
    >
      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["parties", "طرف‌ها / فروشگاه‌ها"],
            ["roles", "نقش‌ها"],
            ["people", "اشخاص"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`min-h-11 rounded-xl px-4 text-sm font-medium transition ${
              tab === id
                ? "bg-[var(--ink)] text-white"
                : "bg-white/70 text-[var(--ink)] ring-1 ring-[var(--line)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {!apiEnabled() ? (
        <Panel className="mb-4 p-5 text-sm text-[var(--muted)]">
          برای کار با شبکه، اتصال به سرویس را فعال کنید.
        </Panel>
      ) : null}

      {tab === "parties" ? (
        <>
          <Panel className="mb-5 p-5">
            <p className="text-sm font-semibold text-[var(--ink)]">
              چطور با شبکه کار کنید
            </p>
            <ol className="mt-3 list-decimal space-y-2 pr-5 text-sm leading-7 text-[var(--muted)]">
              <li>اول طرف بازار را بسازید (کارخانه، گالری، بنکدار، …) — مسئول لازم نیست.</li>
              <li>پروفایل را باز کنید: ببینید چه می‌کند و چه قابلیت‌هایی دارد.</li>
              <li>بعداً شخص را وصل یا جدا کنید؛ یک نفر می‌تواند چند محل و چند نقش داشته باشد.</li>
              <li>حذف سخت نداریم — بایگانی برای طرف‌ها و نقش‌های سفارشی.</li>
            </ol>
          </Panel>

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Stat label="طرف‌های فعال" value={formatNumber(parties.length)} />
            <Stat
              label="بدون مسئول"
              value={formatNumber(unassignedCount)}
            />
            <Stat label="انواع طرف" value={formatNumber(types.length)} />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <FilterChip
              active={!kindFilter && !unassignedOnly}
              onClick={() => {
                setKindFilter("");
                setUnassignedOnly(false);
              }}
              label="همه"
            />
            <FilterChip
              active={unassignedOnly}
              onClick={() => {
                setUnassignedOnly(true);
                setKindFilter("");
              }}
              label="فقط بدون مسئول"
            />
            {types.map((t) => (
              <FilterChip
                key={t.kind}
                active={kindFilter === t.kind && !unassignedOnly}
                onClick={() => {
                  setKindFilter(t.kind);
                  setUnassignedOnly(false);
                }}
                label={t.label_fa}
              />
            ))}
          </div>

          {filterType && kindFilter ? (
            <Panel className="mb-4 p-5">
              <p className="text-sm font-semibold text-[var(--ink)]">
                {filterType.label_fa} در بازار طلا چه می‌کند؟
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                {filterType.what_they_do}
              </p>
              <p className="mt-3 text-xs text-[var(--muted)]">
                مسئول الزامی نیست — اول موجودیت، بعداً شخص.
              </p>
            </Panel>
          ) : null}

          {unassignedOnly ? (
            <Panel className="mb-4 p-5 text-sm leading-7 text-[var(--muted)]">
              این‌ها طرف‌های معتبر بدون شخص متصل‌اند (مثلاً گالری تازه‌تأسیس یا کارخانه قبل از معرفی نماینده). از پروفایل «تخصیص شخص» بزنید — مرحلهٔ فعال‌سازی.
            </Panel>
          ) : null}

          <Panel className="mb-4 p-4 text-sm leading-7 text-[var(--muted)]">
            <span className="font-semibold text-[var(--ink)]">مدل پروفایل دیدار: </span>
            اجباری → فعال‌سازی → اختصاصی دیدار. ستون‌های «بلوغ» و «سیستم‌ساخته» فرم ثبت‌نام نیستند.
            طرف ≠ کاربر؛ ایجنت با تخصیص وصل می‌شود.
          </Panel>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <DataTable
              headers={["نام", "نوع", "شهر", "مسئولین", "آمادگی"]}
              rows={visibleParties.map((p) => [
                <button
                  key={`${p.id}-n`}
                  type="button"
                  className="min-h-11 text-right font-medium text-[var(--ink)] underline-offset-4 hover:underline"
                  onClick={() => void openParty(p)}
                >
                  {p.name}
                </button>,
                <Badge key={`${p.id}-k`} tone="neutral">
                  {p.kind_label}
                </Badge>,
                p.city || "—",
                p.member_count === 0 ? (
                  <Badge key={`${p.id}-m`} tone="warn">
                    بدون مسئول
                  </Badge>
                ) : (
                  formatNumber(p.member_count)
                ),
                <Badge
                  key={`${p.id}-s`}
                  tone={readinessTone(p.readiness)}
                >
                  {p.readiness_label ||
                    (p.status === "active" ? "فعال" : p.status)}
                </Badge>,
              ])}
              empty={
                unassignedOnly
                  ? "همه طرف‌ها حداقل یک مسئول دارند."
                  : "طرفی نیست — با «افزودن طرف شبکه» شروع کنید."
              }
            />

            <Panel className="p-5">
              {!selected ? (
                <div className="text-sm leading-7 text-[var(--muted)]">
                  <p className="font-semibold text-[var(--ink)]">پروفایل طرف</p>
                  <p className="mt-2">
                    یک ردیف را انتخاب کنید تا چک‌لیست اجباری / فعال‌سازی / اختصاصی دیدار را ببینید.
                  </p>
                  <ul className="mt-4 list-disc pr-5">
                    <li>اول موجودیت بازار، بعد شخص</li>
                    <li>فعال‌سازی ≠ ثبت‌نام</li>
                    <li>KPIها سیستم‌ساخته‌اند — دستی وارد نکنید</li>
                  </ul>
                </div>
              ) : (
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-[var(--ink)]">
                        {selected.name}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {selected.kind_label}
                        {selected.city ? ` · ${selected.city}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={readinessTone(selected.readiness)}>
                        {selected.readiness_label || "—"}
                      </Badge>
                      <Badge tone={selected.member_count ? "ok" : "warn"}>
                        {selected.member_count
                          ? `${selected.member_count} عضو`
                          : "بدون مسئول"}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-4 text-xs font-semibold text-[var(--ink)]">
                    این طرف چه می‌کند؟
                  </p>
                  <p className="mt-1 text-sm leading-7 text-[var(--muted)]">
                    {selected.summary || selected.what_they_do}
                  </p>
                  {selected.capabilities?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selected.capabilities.map((c) => (
                        <span
                          key={c}
                          className="rounded-lg bg-[var(--cream)] px-3 py-2 text-xs text-[var(--ink)] ring-1 ring-[var(--line)]"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-5 space-y-4">
                    {STAGE_ORDER.map((stage) => {
                      const items = selected.profile_checklist?.[stage] || [];
                      if (!items.length) return null;
                      return (
                        <div key={stage}>
                          <p className="text-xs font-semibold text-[var(--ink)]">
                            {STAGE_LABEL[stage]}
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {items.map((item) => (
                              <li
                                key={`${stage}-${item.key}`}
                                className="flex min-h-10 items-center justify-between gap-2 rounded-lg bg-[var(--mist)]/50 px-3 text-sm ring-1 ring-[var(--line)]"
                              >
                                <span className="text-[var(--ink)]">
                                  {item.label_fa}
                                  {item.note ? (
                                    <span className="mt-0.5 block text-[11px] text-[var(--muted)]">
                                      {item.note}
                                    </span>
                                  ) : null}
                                </span>
                                {stage === "later" || stage === "system" ? (
                                  <Badge tone="neutral">راهنما</Badge>
                                ) : (
                                  <Badge tone={item.filled ? "ok" : "warn"}>
                                    {item.filled ? "پر" : "خالی"}
                                  </Badge>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  <dl className="mt-5 space-y-2 text-sm">
                    <Row label="تلفن" value={selected.phone || "—"} />
                    <Row label="آدرس" value={selected.address || "—"} />
                    <Row label="جواز اتحادیه" value={selected.union_license || "—"} />
                    <Row
                      label="شناسه"
                      value={
                        <span data-ltr className="font-mono text-xs">
                          {selected.id}
                        </span>
                      }
                    />
                  </dl>

                  {canManage ? (
                    <div className="mt-4 space-y-3">
                      {(selected.kind === "gallery" ||
                        selected.kind === "wholesaler") && (
                        <Field label="سطح اعتماد تسویه (اختصاصی دیدار)">
                          <select
                            className="field"
                            value={selected.trust_tier || "phone_ok"}
                            onChange={(e) => {
                              const tier = e.target.value;
                              void (async () => {
                                try {
                                  await didarApi.updateParty(selected.id, {
                                    trust_tier: tier,
                                  });
                                  await openParty(selected);
                                  toast("سطح اعتماد به‌روز شد");
                                } catch (err) {
                                  toast(
                                    err instanceof Error
                                      ? err.message
                                      : "خطا در به‌روزرسانی اعتماد",
                                    "warn",
                                  );
                                }
                              })();
                            }}
                          >
                            {TRUST_TIERS.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                        </Field>
                      )}
                      <Field label="منطقه فروش / ایجنت / زرین (اختصاصی)">
                        <div className="space-y-2">
                          <input
                            className="field"
                            placeholder="منطقه فروش (market_zone)"
                            defaultValue={String(
                              selected.profile?.market_zone || "",
                            )}
                            id={`mz-${selected.id}`}
                          />
                          <input
                            className="field"
                            placeholder="ایجنت مسئول (assigned_agent)"
                            defaultValue={String(
                              selected.profile?.assigned_agent || "",
                            )}
                            id={`aa-${selected.id}`}
                          />
                          <input
                            className="field"
                            placeholder="شناسه زرین / ERP (مرجع — SoR جدا)"
                            defaultValue={String(
                              selected.profile?.zarrin_ref || "",
                            )}
                            id={`zr-${selected.id}`}
                            dir="ltr"
                          />
                          <Button
                            variant="secondary"
                            className="min-h-11 w-full sm:w-auto"
                            onClick={() => {
                              void (async () => {
                                const mz = (
                                  document.getElementById(
                                    `mz-${selected.id}`,
                                  ) as HTMLInputElement | null
                                )?.value;
                                const aa = (
                                  document.getElementById(
                                    `aa-${selected.id}`,
                                  ) as HTMLInputElement | null
                                )?.value;
                                const zr = (
                                  document.getElementById(
                                    `zr-${selected.id}`,
                                  ) as HTMLInputElement | null
                                )?.value;
                                try {
                                  await didarApi.updateParty(selected.id, {
                                    profile: {
                                      market_zone: mz?.trim() || undefined,
                                      assigned_agent: aa?.trim() || undefined,
                                      zarrin_ref: zr?.trim() || undefined,
                                    },
                                  });
                                  await openParty(selected);
                                  toast("فیلدهای اختصاصی دیدار ذخیره شد");
                                } catch (err) {
                                  toast(
                                    err instanceof Error
                                      ? err.message
                                      : "خطا در ذخیره",
                                    "warn",
                                  );
                                }
                              })();
                            }}
                          >
                            ذخیره اختصاصی دیدار
                          </Button>
                        </div>
                      </Field>
                    </div>
                  ) : null}

                  <h3 className="mt-6 text-sm font-semibold">اعضا</h3>
                  <ul className="mt-3 space-y-2">
                    {members.length === 0 ? (
                      <li className="rounded-xl bg-[var(--cream)] p-4 text-sm leading-7 text-[var(--muted)] ring-1 ring-[var(--line)]">
                        هنوز کسی وصل نیست. این فروشگاه/کارخانه/بنکدار در شبکه معتبر است —
                        وقتی نماینده یا خریدار مشخص شد، «تخصیص شخص» را بزنید.
                      </li>
                    ) : (
                      members.map((m) => (
                        <li
                          key={m.id}
                          className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-white/60 px-3 ring-1 ring-[var(--line)]"
                        >
                          <span className="text-sm">
                            {m.user_name}
                            <span className="text-[var(--muted)]"> · {m.title}</span>
                          </span>
                          {canManage ? (
                            <Button
                              variant="secondary"
                              onClick={() => void unassign(m.id)}
                            >
                              برداشتن
                            </Button>
                          ) : null}
                        </li>
                      ))
                    )}
                  </ul>

                  {canManage ? (
                    <div className="mt-5 flex flex-wrap gap-2">
                      <Button onClick={() => setOpenAssign(true)}>
                        تخصیص شخص
                      </Button>
                      <Button variant="secondary" onClick={() => void archiveSelected()}>
                        بایگانی
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            </Panel>
          </div>

          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold">راهنمای انواع طرف در ایران</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {types.map((t) => (
                <Panel key={t.kind} className="p-5">
                  <p className="font-semibold text-[var(--ink)]">{t.label_fa}</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
                    {t.what_they_do}
                  </p>
                  <p className="mt-3 text-xs text-[var(--muted)]">
                    افزودن آزاد · حذف سخت نه · بایگانی بله · مسئول اختیاری
                  </p>
                </Panel>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {tab === "roles" ? (
        <>
          <Panel className="mb-4 p-5 text-sm leading-7 text-[var(--muted)]">
            نقش‌های سیستمی قابل بایگانی نیستند. نقش سفارشی اضافه کنید و بعداً به اشخاص بدهید (یک نفر چند نقش).
          </Panel>
          <DataTable
            headers={["عنوان", "کد", "نوع", "توضیح", "عمل"]}
            rows={roles.map((r) => [
              r.label_fa,
              <span key={r.id} data-ltr className="font-mono text-xs">
                {r.code}
              </span>,
              r.is_system ? (
                <Badge key={`${r.id}-s`} tone="ok">
                  سیستمی
                </Badge>
              ) : (
                <Badge key={`${r.id}-c`} tone="neutral">
                  سفارشی
                </Badge>
              ),
              r.description || "—",
              canManage && !r.is_system ? (
                <Button
                  key={`${r.id}-a`}
                  variant="secondary"
                  onClick={() => void archiveRole(r.id)}
                >
                  بایگانی
                </Button>
              ) : (
                "—"
              ),
            ])}
            empty="نقشی نیست."
          />
        </>
      ) : null}

      {tab === "people" ? (
        <>
          <Panel className="mb-4 p-5 text-sm leading-7 text-[var(--muted)]">
            شخص ≠ نقش. یک نفر می‌تواند چند نقش داشته باشد و به چند فروشگاه/بنکدار وصل شود.
          </Panel>
          <DataTable
            headers={["نام", "نقش اصلی", "همه نقش‌ها", "سازمان اصلی", "وضعیت"]}
            rows={people.map((p) => [
              p.name,
              p.primary_role,
              <span key={`${p.id}-r`} data-ltr className="font-mono text-xs">
                {p.roles.join(", ")}
              </span>,
              p.primary_org_name,
              p.status,
            ])}
            empty="شخصی نیست."
          />
          <div className="mt-4">
            <DomainLinkButton href="/app/admin/users">
              دعوت کاربر جدید (حاکمیت)
            </DomainLinkButton>
          </div>
        </>
      ) : null}

      <ActionModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        title="افزودن طرف شبکه"
        description="اول موجودیت بازار را بسازید؛ مسئول بعداً اختیاری است."
        confirmLabel="ثبت"
        onConfirm={() => void createParty()}
      >
        <Field label="نوع">
          <select
            className="field min-h-11"
            value={formKind}
            onChange={(e) => setFormKind(e.target.value)}
          >
            {types.map((t) => (
              <option key={t.kind} value={t.kind}>
                {t.label_fa}
              </option>
            ))}
          </select>
        </Field>
        {formType ? (
          <p className="mb-3 text-sm leading-6 text-[var(--muted)]">
            {formType.what_they_do}
          </p>
        ) : null}
        <Field label="نام">
          <input
            className="field min-h-11"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
          />
        </Field>
        <Field label="شهر">
          <input
            className="field min-h-11"
            value={formCity}
            onChange={(e) => setFormCity(e.target.value)}
          />
        </Field>
        <Field label="آدرس">
          <input
            className="field min-h-11"
            value={formAddress}
            onChange={(e) => setFormAddress(e.target.value)}
          />
        </Field>
        <Field label="تلفن">
          <input
            className="field min-h-11"
            dir="ltr"
            value={formPhone}
            onChange={(e) => setFormPhone(e.target.value)}
          />
        </Field>
        <Field label="جواز اتحادیه">
          <input
            className="field min-h-11"
            value={formLicense}
            onChange={(e) => setFormLicense(e.target.value)}
          />
        </Field>
        <Field label="خلاصه فعالیت (اختیاری)">
          <input
            className="field min-h-11"
            value={formSummary}
            onChange={(e) => setFormSummary(e.target.value)}
          />
        </Field>
      </ActionModal>

      <ActionModal
        open={openAssign}
        onClose={() => setOpenAssign(false)}
        title="تخصیص شخص به طرف"
        description="یک شخص می‌تواند به چند فروشگاه/بنکدار وصل شود."
        confirmLabel="تخصیص"
        onConfirm={() => void assignMember()}
      >
        <Field label="شخص">
          <select
            className="field min-h-11"
            value={assignUserId}
            onChange={(e) => setAssignUserId(e.target.value)}
          >
            <option value="">— انتخاب —</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.username})
              </option>
            ))}
          </select>
        </Field>
        <Field label="عنوان در این محل">
          <input
            className="field min-h-11"
            value={assignTitle}
            onChange={(e) => setAssignTitle(e.target.value)}
          />
        </Field>
      </ActionModal>

      <ActionModal
        open={openRole}
        onClose={() => setOpenRole(false)}
        title="نقش سفارشی"
        description="نقش‌هایی که در بازار شما معنا دارند — بدون دستکاری هسته."
        confirmLabel="ثبت نقش"
        onConfirm={() => void createRole()}
      >
        <Field label="کد انگلیسی">
          <input
            className="field min-h-11"
            dir="ltr"
            value={roleCode}
            onChange={(e) => setRoleCode(e.target.value)}
            placeholder="e.g. field_supervisor"
          />
        </Field>
        <Field label="عنوان فارسی">
          <input
            className="field min-h-11"
            value={roleLabel}
            onChange={(e) => setRoleLabel(e.target.value)}
          />
        </Field>
        <Field label="توضیح">
          <input
            className="field min-h-11"
            value={roleDesc}
            onChange={(e) => setRoleDesc(e.target.value)}
          />
        </Field>
      </ActionModal>

      <ActionModal
        open={openGrant}
        onClose={() => setOpenGrant(false)}
        title="اعطای نقش اضافه"
        description="نقش اصلی جلسه حفظ می‌شود؛ نقش‌های اضافه برای چندنقشی است."
        confirmLabel="اعطا"
        onConfirm={() => void grantRole()}
      >
        <Field label="شخص">
          <select
            className="field min-h-11"
            value={grantUserId}
            onChange={(e) => setGrantUserId(e.target.value)}
          >
            <option value="">—</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="نقش">
          <select
            className="field min-h-11"
            value={grantRoleCode}
            onChange={(e) => setGrantRoleCode(e.target.value)}
          >
            <option value="">—</option>
            {roles.map((r) => (
              <option key={r.id} value={r.code}>
                {r.label_fa}
              </option>
            ))}
          </select>
        </Field>
      </ActionModal>
    </DomainOverviewPage>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-xl px-3 text-sm transition ${
        active
          ? "bg-[var(--gold)] text-[var(--ink)]"
          : "bg-white/70 text-[var(--ink)] ring-1 ring-[var(--line)]"
      }`}
    >
      {label}
    </button>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[var(--muted)]">{label}</dt>
      <dd className="text-left text-[var(--ink)]">{value}</dd>
    </div>
  );
}
