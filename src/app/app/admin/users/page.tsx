"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { roleLabels, userStatusLabels } from "@/data/labels";
import type { RoleId } from "@/data/types";
import { DataTable } from "@/components/data-table";
import { ActionModal } from "@/components/action-modal";
import { Badge, Button, Field, SectionHeader } from "@/components/ui";
import { useToast } from "@/components/toast";
import { apiEnabled, didarApi, type ApiUser } from "@/lib/api";
import { users as seedUsers } from "@/data/mock";

type PartyOpt = { id: string; name: string; kind_label?: string };
type RoleOpt = { id: string; code: string; label_fa: string };

const ROLE_OPTIONS = Object.keys(roleLabels) as RoleId[];

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [list, setList] = useState<ApiUser[]>([]);
  const [parties, setParties] = useState<PartyOpt[]>([]);
  const [roles, setRoles] = useState<RoleOpt[]>([]);
  const [query, setQuery] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [active, setActive] = useState<ApiUser | null>(null);
  const [credentialsOpen, setCredentialsOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [invitedUsername, setInvitedUsername] = useState("");
  const [demoSeed, setDemoSeed] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<RoleId>("retailer");
  const [orgId, setOrgId] = useState("org-hq");
  const [grantRoleCode, setGrantRoleCode] = useState("");

  const load = useCallback(async () => {
    if (!apiEnabled()) {
      setList(
        seedUsers.map((u) => ({
          id: u.id,
          name: u.name,
          username: u.username,
          email: u.email,
          role: u.role,
          org: u.org,
          org_id: null,
          status: u.status,
          last_active: u.lastActive,
          avatar_hue: u.avatarHue,
          roles: [u.role],
          role_grants: [],
        })),
      );
      return;
    }
    const [rows, partyRows, roleRows] = await Promise.all([
      didarApi.listUsers(),
      didarApi.listParties() as Promise<PartyOpt[]>,
      didarApi.listNetworkRoles() as Promise<RoleOpt[]>,
    ]);
    setList(rows);
    setParties(partyRows);
    setRoles(roleRows);
  }, []);

  useEffect(() => {
    void load().catch((e: unknown) =>
      toast(e instanceof Error ? e.message : "خطا در بارگذاری کاربران", "warn"),
    );
  }, [load, toast]);

  useEffect(() => {
    if (!apiEnabled()) return;
    void didarApi
      .health()
      .then((h) => setDemoSeed(Boolean(h.demo_seed)))
      .catch(() => setDemoSeed(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) => {
      const rolesText = (u.roles ?? [u.role]).join(" ");
      return [u.name, u.username, u.email, u.org, u.role, rolesText, u.status]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [list, query]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setUsername("");
    setRole("retailer");
    setOrgId(parties[0]?.id ?? "org-hq");
    setGrantRoleCode("");
  };

  const openEdit = (u: ApiUser) => {
    setActive(u);
    setName(u.name);
    setEmail(u.email);
    setUsername(u.username);
    setRole((u.role as RoleId) in roleLabels ? (u.role as RoleId) : "retailer");
    setOrgId(u.org_id || parties[0]?.id || "org-hq");
    setEditOpen(true);
  };

  const openGrant = (u: ApiUser) => {
    setActive(u);
    setGrantRoleCode(roles[0]?.code ?? "");
    setGrantOpen(true);
  };

  const invite = async () => {
    if (!name.trim() || !email.trim() || !username.trim()) {
      toast("نام، نام کاربری و ایمیل را وارد کنید.", "warn");
      return;
    }
    try {
      if (apiEnabled()) {
        const created = await didarApi.inviteUser({
          name: name.trim(),
          email: email.trim(),
          username: username.trim(),
          role,
          org_id: orgId,
        });
        await load();
        const uname = username.trim();
        setInviteOpen(false);
        resetForm();
        if (created.temporary_password) {
          setInvitedUsername(uname);
          setTempPassword(created.temporary_password);
          setCredentialsOpen(true);
          toast("کاربر دعوت شد — رمز موقت را کپی کنید.");
        } else if (demoSeed) {
          toast(
            "کاربر دعوت شد. در DEMO_SEED از رمز مشترک محیط آزمایشی استفاده کنید.",
          );
        } else {
          toast("کاربر دعوت شد (وضعیت: دعوت‌شده).");
        }
        return;
      }
      setInviteOpen(false);
      resetForm();
      toast("کاربر دعوت شد (وضعیت: دعوت‌شده).");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در دعوت", "warn");
    }
  };

  const saveEdit = async () => {
    if (!active) return;
    if (!name.trim() || !email.trim() || !username.trim()) {
      toast("نام، نام کاربری و ایمیل را وارد کنید.", "warn");
      return;
    }
    try {
      if (!apiEnabled()) {
        toast("برای ویرایش کاربر، اتصال به سرویس را فعال کنید", "warn");
        return;
      }
      await didarApi.updateUser(active.id, {
        name: name.trim(),
        email: email.trim(),
        username: username.trim(),
        role,
        org_id: orgId,
      });
      await load();
      setEditOpen(false);
      setActive(null);
      toast("کاربر ویرایش شد.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در ویرایش", "warn");
    }
  };

  const grantExtraRole = async () => {
    if (!active || !grantRoleCode) {
      toast("نقش را انتخاب کنید", "warn");
      return;
    }
    if (grantRoleCode === active.role) {
      toast("این نقش همان نقش اصلی است — نقش اضافه دیگری انتخاب کنید", "warn");
      return;
    }
    try {
      await didarApi.grantNetworkRole({
        user_id: active.id,
        role_code: grantRoleCode,
      });
      await load();
      setGrantOpen(false);
      toast("نقش اضافه اعطا شد (چندنقشی)");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در اعطای نقش", "warn");
    }
  };

  const revokeGrant = async (grantId: string) => {
    try {
      await didarApi.revokeNetworkRole(grantId);
      await load();
      toast("نقش اضافه برداشته شد");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در حذف نقش", "warn");
    }
  };

  const setStatus = async (id: string, status: string) => {
    try {
      await didarApi.setUserStatus(id, status);
      await load();
      toast("وضعیت کاربر به‌روز شد.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا", "warn");
    }
  };

  return (
    <div>
      <SectionHeader
        title="کاربران"
        description="دعوت، ویرایش، نقش اصلی، نقش‌های اضافه و وضعیت دسترسی."
        action={
          <Button
            onClick={() => {
              resetForm();
              setInviteOpen(true);
            }}
          >
            دعوت کاربر
          </Button>
        }
      />

      <div className="mb-4">
        <Field label="جستجو">
          <input
            className="field min-h-11"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="نام، ایمیل، نقش، سازمان…"
          />
        </Field>
      </div>

      {!apiEnabled() ? (
        <p className="mb-4 text-sm leading-7 text-[var(--muted)]">
          ویرایش و چندنقشی فقط با اتصال API فعال است. نقش اضافه از همین صفحه یا از
          شبکه → اشخاص → اعطای نقش.
        </p>
      ) : null}

      <DataTable
        headers={["کاربر", "سازمان", "نقش‌ها", "وضعیت", "آخرین فعالیت", ""]}
        rows={filtered.map((u) => {
          const allRoles = u.roles?.length ? u.roles : [u.role];
          return [
            <div key={`${u.id}-u`} className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: `hsl(${u.avatar_hue} 35% 35%)` }}
              >
                {u.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </div>
              <div className="min-w-0">
                <p className="font-semibold">{u.name}</p>
                <p className="text-xs text-[var(--muted)]" data-ltr>
                  {u.email}
                </p>
              </div>
            </div>,
            u.org,
            <div key={`${u.id}-r`} className="flex flex-wrap gap-1">
              {allRoles.map((code) => (
                <Badge
                  key={`${u.id}-${code}`}
                  tone={code === u.role ? "gold" : "neutral"}
                >
                  {roleLabels[code as RoleId] ?? code}
                  {code === u.role ? " · اصلی" : ""}
                </Badge>
              ))}
            </div>,
            <Badge
              key={`${u.id}-s`}
              tone={
                u.status === "active"
                  ? "ok"
                  : u.status === "invited"
                    ? "info"
                    : "danger"
              }
            >
              {userStatusLabels[u.status as keyof typeof userStatusLabels] ??
                u.status}
            </Badge>,
            u.last_active,
            apiEnabled() ? (
              <div key={`${u.id}-a`} className="flex flex-wrap gap-1">
                <Button
                  className="min-h-11 px-2 py-1 text-xs"
                  variant="secondary"
                  onClick={() => openEdit(u)}
                >
                  ویرایش
                </Button>
                <Button
                  className="min-h-11 px-2 py-1 text-xs"
                  variant="secondary"
                  onClick={() => openGrant(u)}
                >
                  نقش اضافه
                </Button>
                {u.status !== "active" ? (
                  <Button
                    className="min-h-11 px-2 py-1 text-xs"
                    variant="secondary"
                    onClick={() => void setStatus(u.id, "active")}
                  >
                    فعال
                  </Button>
                ) : null}
                {u.status !== "suspended" ? (
                  <Button
                    className="min-h-11 px-2 py-1 text-xs"
                    variant="danger"
                    onClick={() => void setStatus(u.id, "suspended")}
                  >
                    تعلیق
                  </Button>
                ) : null}
              </div>
            ) : (
              "—"
            ),
          ];
        })}
        empty="کاربری با این جستجو پیدا نشد."
      />

      <ActionModal
        open={credentialsOpen}
        title="رمز موقت (فقط یک‌بار)"
        description="این رمز دیگر نمایش داده نمی‌شود — همین‌جا کپی کنید."
        confirmLabel="کپی رمز"
        cancelLabel="بستن"
        onClose={() => {
          setCredentialsOpen(false);
          setTempPassword(null);
          setInvitedUsername("");
        }}
        onConfirm={async () => {
          if (!tempPassword) return;
          try {
            await navigator.clipboard.writeText(tempPassword);
            toast("رمز کپی شد.");
          } catch {
            toast("کپی ناموفق — رمز را دستی بردارید.", "warn");
          }
        }}
      >
        <div className="space-y-3 text-sm">
          <p>
            نام کاربری:{" "}
            <span className="font-mono" data-ltr>
              {invitedUsername}
            </span>
          </p>
          <p
            className="rounded-xl border border-[var(--line)] bg-[var(--mist)] px-3 py-3 font-mono text-base"
            data-ltr
          >
            {tempPassword}
          </p>
        </div>
      </ActionModal>

      <ActionModal
        open={inviteOpen}
        title="دعوت کاربر"
        description="کاربر با وضعیت دعوت‌شده ساخته می‌شود؛ سپس فعال کنید."
        confirmLabel="ثبت دعوت"
        onClose={() => setInviteOpen(false)}
        onConfirm={() => void invite()}
      >
        <UserFormFields
          name={name}
          setName={setName}
          username={username}
          setUsername={setUsername}
          email={email}
          setEmail={setEmail}
          role={role}
          setRole={setRole}
          orgId={orgId}
          setOrgId={setOrgId}
          parties={parties}
        />
      </ActionModal>

      <ActionModal
        open={editOpen}
        title="ویرایش کاربر"
        description="نقش اصلی و سازمان اصلی را اینجا عوض کنید. نقش‌های اضافه جداگانه اعطا می‌شوند."
        confirmLabel="ذخیره"
        onClose={() => {
          setEditOpen(false);
          setActive(null);
        }}
        onConfirm={() => void saveEdit()}
      >
        <UserFormFields
          name={name}
          setName={setName}
          username={username}
          setUsername={setUsername}
          email={email}
          setEmail={setEmail}
          role={role}
          setRole={setRole}
          orgId={orgId}
          setOrgId={setOrgId}
          parties={parties}
        />
        {active?.role_grants?.length ? (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">نقش‌های اضافه</p>
            {active.role_grants.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-[var(--line)] px-3 py-2"
              >
                <span className="text-sm">
                  {roleLabels[g.role_code as RoleId] ?? g.role_code}
                </span>
                <Button
                  variant="ghost"
                  className="min-h-11 px-3 text-xs"
                  onClick={() => void revokeGrant(g.id)}
                >
                  حذف
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </ActionModal>

      <ActionModal
        open={grantOpen}
        title="اعطای نقش اضافه"
        description={
          active
            ? `برای ${active.name} — نقش اصلی جلسه همان «${roleLabels[active.role as RoleId] ?? active.role}» می‌ماند.`
            : undefined
        }
        confirmLabel="اعطا"
        onClose={() => {
          setGrantOpen(false);
          setActive(null);
        }}
        onConfirm={() => void grantExtraRole()}
      >
        <Field label="نقش اضافه">
          <select
            className="field min-h-11"
            value={grantRoleCode}
            onChange={(e) => setGrantRoleCode(e.target.value)}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.code}>
                {r.label_fa}
              </option>
            ))}
          </select>
        </Field>
      </ActionModal>
    </div>
  );
}

function UserFormFields({
  name,
  setName,
  username,
  setUsername,
  email,
  setEmail,
  role,
  setRole,
  orgId,
  setOrgId,
  parties,
}: {
  name: string;
  setName: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  role: RoleId;
  setRole: (v: RoleId) => void;
  orgId: string;
  setOrgId: (v: string) => void;
  parties: PartyOpt[];
}) {
  return (
    <div className="space-y-3">
      <Field label="نام">
        <input
          className="field min-h-11"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Field label="نام کاربری">
        <input
          className="field min-h-11"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          data-ltr
        />
      </Field>
      <Field label="ایمیل">
        <input
          className="field min-h-11"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-ltr
        />
      </Field>
      <Field label="نقش اصلی">
        <select
          className="field min-h-11"
          value={role}
          onChange={(e) => setRole(e.target.value as RoleId)}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {roleLabels[r]}
            </option>
          ))}
        </select>
      </Field>
      <Field label="سازمان / محل اصلی">
        <select
          className="field min-h-11"
          value={orgId}
          onChange={(e) => setOrgId(e.target.value)}
        >
          {parties.length ? (
            parties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.kind_label ? ` · ${p.kind_label}` : ""}
              </option>
            ))
          ) : (
            <>
              <option value="org-hq">ستاد دیدار</option>
              <option value="org-mehr">گالری مهر طلا</option>
            </>
          )}
        </select>
      </Field>
    </div>
  );
}
