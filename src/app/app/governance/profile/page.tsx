"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/context/session-context";
import { useWorkspace } from "@/context/workspace-context";
import { didarApi, apiEnabled } from "@/lib/api";
import { useToast } from "@/components/toast";
import { SectionHeader, Panel, Button, Field, Badge, Stat } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ActionModal } from "@/components/action-modal";
import {
  User,
  Phone,
  Briefcase,
  FileCheck,
  ShieldCheck,
  Building2,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  BadgeCheck,
} from "lucide-react";

type StakeholderMembership = {
  id: string;
  org_id: string;
  org_name: string;
  kind: string;
  title: string;
  status: string;
};

type PartyOption = {
  id: string;
  name: string;
  kind_label?: string;
};

type UserOption = {
  id: string;
  name: string;
  username: string;
  role: string;
};

export default function ProfileManagementPage() {
  const { user, role } = useSession();
  const { hats, activeHat } = useWorkspace();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"identity" | "contact" | "stakeholders" | "documents" | "status">("identity");

  // Form states
  const [name, setName] = useState(user?.name || "لیلا فرهادی");
  const [nationalId, setNationalId] = useState("۰۰۱۲۳۴۵۶۷۸");
  const [fatherName, setFatherName] = useState("محمد");
  const [birthDate, setBirthDate] = useState("۱۳۶۸/۰۵/۱۲");
  const [gender, setGender] = useState("زن");

  const [phone, setPhone] = useState("۰۹۱۲۱۱۱۲۲۳۳");
  const [email, setEmail] = useState(user?.email || "leila@didargold.com");
  const [address, setAddress] = useState("تهران، بازار طلا و جواهر، راسته زرگران، پلاک ۴۵");
  const [postalCode, setPostalCode] = useState("۱۹۳۹۵-۴۱۱");

  const [unionLicense, setUnionLicense] = useState("پ‌ک-۹۸۷۶۵۴");
  const [verificationStatus, setVerificationStatus] = useState("verified");

  // Multi-Stakeholder state
  const [memberships, setMemberships] = useState<StakeholderMembership[]>([]);
  const [allParties, setAllParties] = useState<PartyOption[]>([]);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);

  // Add Membership Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(user?.id || "");
  const [memberTitle, setMemberTitle] = useState("مدیر گالری / بنکدار");

  const loadData = async () => {
    if (!apiEnabled()) {
      // Mock memberships if offline
      setMemberships([
        { id: "m-1", org_id: "org-hq", org_name: "ستاد دیدار گلد", kind: "internal", title: "مدیر ارشد", status: "active" },
        { id: "m-2", org_id: "org-mehr", org_name: "گالری مهر طلا", kind: "gallery", title: "مالک و مسئول سفارشات", status: "active" },
        { id: "m-3", org_id: "org-zomorrod", org_name: "گالری زمرد", kind: "gallery", title: "عضو هیئت مدیره", status: "active" },
      ]);
      setAllParties([
        { id: "org-hq", name: "ستاد دیدار گلد", kind_label: "ستاد" },
        { id: "org-mehr", name: "گالری مهر طلا", kind_label: "گالری" },
        { id: "org-zomorrod", name: "گالری زمرد", kind_label: "گالری" },
        { id: "org-almas", name: "آتلیه طلاسازی الماس", kind_label: "آتلیه" },
      ]);
      setAllUsers([
        { id: "u1", name: "لیلا فرهادی", username: "leila", role: "admin" },
        { id: "u2", name: "سارا احمدی", username: "sara", role: "retailer" },
        { id: "u3", name: "آرش طاهری", username: "arash", role: "producer" },
      ]);
      return;
    }

    try {
      const profileRes = (await didarApi.getMyProfile()) as Record<string, unknown>;
      if (profileRes) {
        if (profileRes.name) setName(String(profileRes.name));
        if (profileRes.national_id) setNationalId(String(profileRes.national_id));
        if (profileRes.father_name) setFatherName(String(profileRes.father_name));
        if (profileRes.birth_date) setBirthDate(String(profileRes.birth_date));
        if (profileRes.gender) setGender(String(profileRes.gender));
        if (profileRes.phone) setPhone(String(profileRes.phone));
        if (profileRes.email) setEmail(String(profileRes.email));
        if (profileRes.address) setAddress(String(profileRes.address));
        if (profileRes.postal_code) setPostalCode(String(profileRes.postal_code));
        if (profileRes.union_license) setUnionLicense(String(profileRes.union_license));
        if (profileRes.verification_status) setVerificationStatus(String(profileRes.verification_status));
        if (Array.isArray(profileRes.memberships)) {
          setMemberships(profileRes.memberships as StakeholderMembership[]);
        }
      }

      const partiesRes = (await didarApi.listParties()) as PartyOption[];
      setAllParties(partiesRes);

      const usersRes = (await didarApi.listUsers()) as UserOption[];
      setAllUsers(usersRes);
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در بارگذاری پروفایل", "warn");
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleSaveProfile = async () => {
    try {
      if (apiEnabled()) {
        await didarApi.updateMyProfile({
          name,
          national_id: nationalId,
          father_name: fatherName,
          birth_date: birthDate,
          gender,
          phone,
          email,
          address,
          postal_code: postalCode,
          union_license: unionLicense,
          verification_status: verificationStatus,
        });
      }
      toast("اطلاعات پروفایل با موفقیت ذخیره شد");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در ذخیره پروفایل", "warn");
    }
  };

  const handleAddMembership = async () => {
    if (!selectedOrgId || !selectedUserId) {
      toast("مجموعه و کاربر را انتخاب کنید", "warn");
      return;
    }
    try {
      if (apiEnabled()) {
        await didarApi.assignMembership(selectedOrgId, selectedUserId, memberTitle);
        await loadData();
      } else {
        const orgObj = allParties.find((p) => p.id === selectedOrgId);
        setMemberships((prev) => [
          ...prev,
          {
            id: `m-${Date.now()}`,
            org_id: selectedOrgId,
            org_name: orgObj?.name || "مجموعه جدید",
            kind: "gallery",
            title: memberTitle,
            status: "active",
          },
        ]);
      }
      setAddModalOpen(false);
      toast("ارتباط جدید با ذینفع/مجموعه ثبت گردید");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در ثبت عضویت", "warn");
    }
  };

  const handleRemoveMembership = async (membershipId: string) => {
    try {
      if (apiEnabled()) {
        await didarApi.unassignMembership(membershipId);
        await loadData();
      } else {
        setMemberships((prev) => prev.filter((m) => m.id !== membershipId));
      }
      toast("عضویت ذینفع حذف شد");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در حذف عضویت", "warn");
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="پروفایل کاربری و مدیریت ذینفعان (Profile Management)"
        description="اطلاعات هویتی، تماس، احراز هویت و ارتباطات چند‌جانبه کاربر با مجموعه‌های شبکه طلا."
        action={
          <Button onClick={handleSaveProfile} className="bg-amber-600 hover:bg-amber-700 text-white">
            ذخیره تغییرات پروفایل
          </Button>
        }
      />

      {/* Profile Navigation Tabs */}
      <div className="flex border-b border-[var(--line)] gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("identity")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeTab === "identity"
              ? "border-amber-500 text-amber-600 bg-amber-500/10"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          <User className="w-4 h-4" />
          <span>۱. اطلاعات هویتی</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("contact")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeTab === "contact"
              ? "border-amber-500 text-amber-600 bg-amber-500/10"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>۲. اطلاعات تماس</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("stakeholders")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeTab === "stakeholders"
              ? "border-amber-500 text-amber-600 bg-amber-500/10"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>۳. اطلاعات شغلی و ذینفعان ({memberships.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("documents")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeTab === "documents"
              ? "border-amber-500 text-amber-600 bg-amber-500/10"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>۴. مدارک و احراز هویت</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("status")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap ${
            activeTab === "status"
              ? "border-amber-500 text-amber-600 bg-amber-500/10"
              : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>۵. وضعیت حساب و کلاه‌ها</span>
        </button>
      </div>

      {/* Tab 1: Identity Info */}
      {activeTab === "identity" && (
        <Panel className="p-6 space-y-4">
          <h3 className="font-bold text-base text-[var(--ink)] border-b pb-3 border-[var(--line)]">اطلاعات شناسنامه‌ای و هویتی</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="نام و نام خانوادگی">
              <input className="field min-h-11" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="کد ملی">
              <input className="field min-h-11 font-mono" value={nationalId} onChange={(e) => setNationalId(e.target.value)} dir="ltr" />
            </Field>
            <Field label="نام پدر">
              <input className="field min-h-11" value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
            </Field>
            <Field label="تاریخ تولد">
              <input className="field min-h-11 font-mono" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} dir="ltr" />
            </Field>
            <Field label="جنسیت">
              <select className="field min-h-11" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="زن">زن</option>
                <option value="مرد">مرد</option>
              </select>
            </Field>
            <Field label="نام کاربری">
              <input className="field min-h-11 font-mono bg-slate-100 dark:bg-slate-800" value={user?.username || "leila"} disabled dir="ltr" />
            </Field>
          </div>
        </Panel>
      )}

      {/* Tab 2: Contact Info */}
      {activeTab === "contact" && (
        <Panel className="p-6 space-y-4">
          <h3 className="font-bold text-base text-[var(--ink)] border-b pb-3 border-[var(--line)]">اطلاعات ارتباطی و آدرس</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="شماره تلفن همراه">
              <input className="field min-h-11 font-mono" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
            </Field>
            <Field label="پست الکترونیکی (ایمیل)">
              <input className="field min-h-11 font-mono" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
            </Field>
            <Field label="کد پستی">
              <input className="field min-h-11 font-mono" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} dir="ltr" />
            </Field>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="نشانی کامل محل سکونت / کسب‌وکار">
                <input className="field min-h-11" value={address} onChange={(e) => setAddress(e.target.value)} />
              </Field>
            </div>
          </div>
        </Panel>
      )}

      {/* Tab 3: Occupational & Stakeholders Multi-Mapping */}
      {activeTab === "stakeholders" && (
        <div className="space-y-6">
          <Panel className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[var(--line)]">
              <div>
                <h3 className="font-bold text-base text-[var(--ink)]">مجموعه‌ها و ذینفعان مرتبط (یک کاربر ➔ چند مجموعه)</h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  این کاربر می‌تواند هم‌زمان در چند مجموعه/ذینفع (گالری، بنکداری، آتلیه طلاسازی یا ستاد) دارای نقش و عضویت باشد.
                </p>
              </div>
              <Button onClick={() => setAddModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 text-xs">
                <Plus className="w-4 h-4" />
                <span>افزودن عضویت جدید به ذینفع</span>
              </Button>
            </div>

            <DataTable
              headers={["مجموعه / ذینفع", "نوع مجموعه", "سمت / عنوان شغل", "وضعیت", "عملیات"]}
              rows={memberships.map((m) => [
                <div key={`${m.id}-name`} className="flex items-center gap-2 font-semibold">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  <span>{m.org_name}</span>
                </div>,
                <Badge key={`${m.id}-kind`} tone="neutral">
                  {m.kind === "gallery" ? "گالری" : m.kind === "internal" ? "ستاد" : "کارگاه/بنکدار"}
                </Badge>,
                m.title,
                <Badge key={`${m.id}-st`} tone="ok">
                  {m.status === "active" ? "فعال" : m.status}
                </Badge>,
                <Button
                  key={`${m.id}-act`}
                  variant="danger"
                  className="px-2 py-1 text-xs"
                  onClick={() => void handleRemoveMembership(m.id)}
                >
                  <Trash2 className="w-3.5 h-3.5 inline ml-1" />
                  حذف
                </Button>,
              ])}
              empty="هیچ عضویت ذینفعی برای این کاربر ثبت نشده است."
            />
          </Panel>

          {/* Demonstration of Multi-User per Stakeholder */}
          <Panel className="p-6 space-y-4">
            <h3 className="font-bold text-base text-[var(--ink)] border-b pb-3 border-[var(--line)]">
              اعضا و همکاران در مجموعه فعال ({activeHat?.partyName || user?.org || "گالری مهر طلا"})
            </h3>
            <p className="text-xs text-[var(--muted)]">
              یک مجموعه (مانند گالری زمرد) می‌تواند شامل چندین کاربر با سطح دسترسی و نقش‌های متفاوت باشد.
            </p>
            <DataTable
              headers={["کاربر", "نام کاربری", "نقش اصلی", "سمت در مجموعه"]}
              rows={[
                [user?.name || "لیلا فرهادی", <span key="u1-n" className="font-mono text-xs" dir="ltr">{user?.username || "leila"}</span>, "مدیر کل", "مدیر ارشد مجموعه"],
                ["سارا احمدی", <span key="u2-n" className="font-mono text-xs" dir="ltr">sara</span>, "خرده‌فروش", "مسئول فروشگاه و سفارشات"],
                ["حسین پاکروان", <span key="u3-n" className="font-mono text-xs" dir="ltr">hossein</span>, "انباردار", "مسئول موجودی و تحویل"],
              ]}
            />
          </Panel>
        </div>
      )}

      {/* Tab 4: Documents & Verification */}
      {activeTab === "documents" && (
        <Panel className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-3 border-[var(--line)]">
            <h3 className="font-bold text-base text-[var(--ink)]">مدارک و وضعیت احراز هویت</h3>
            <Badge tone={verificationStatus === "verified" ? "ok" : "warn"} className="text-xs flex items-center gap-1">
              <BadgeCheck className="w-4 h-4" />
              <span>{verificationStatus === "verified" ? "احراز هویت شده (تایید رسمی)" : "در انتظار مدارک"}</span>
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="شماره پروانه کسب / مجوز اتحادیه">
              <input className="field min-h-11 font-mono" value={unionLicense} onChange={(e) => setUnionLicense(e.target.value)} dir="ltr" />
            </Field>
            <Field label="وضعیت استعلام صنف طلا">
              <input className="field min-h-11 bg-slate-100 dark:bg-slate-800" value="تایید شده توسط اتحادیه طلا و جواهر" disabled />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 border rounded-xl border-dashed border-amber-500/40 bg-amber-500/5 space-y-2">
              <p className="font-semibold text-sm">تصویر کارت ملی</p>
              <p className="text-xs text-[var(--muted)]">آپلود شده و تایید شده توسط اپراتور ستاد.</p>
              <Badge tone="ok">موجود و تایید شده</Badge>
            </div>
            <div className="p-4 border rounded-xl border-dashed border-amber-500/40 bg-amber-500/5 space-y-2">
              <p className="font-semibold text-sm">تصویر جواز کسب / سند ملک</p>
              <p className="text-xs text-[var(--muted)]">مطابق با آدرس ثبت‌شده در اتحادیه.</p>
              <Badge tone="ok">موجود و تایید شده</Badge>
            </div>
          </div>
        </Panel>
      )}

      {/* Tab 5: Account Status & Active Hats */}
      {activeTab === "status" && (
        <Panel className="p-6 space-y-6">
          <h3 className="font-bold text-base text-[var(--ink)] border-b pb-3 border-[var(--line)]">وضعیت حساب کاربری و نشست‌ها</h3>

          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="وضعیت حساب" value={user?.status === "active" ? "فعال" : "عادی"} hint="دسترسی کامل عملیاتی" />
            <Stat label="آخرین فعالیت" value="چند لحظه پیش" hint="از طریق وب‌سایت" />
            <Stat label="کلاه‌های کاری فعال" value={`${hats.length} مجموعه`} hint="سوئیچ آسان در سایدبار" />
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">لیست کلاه‌های کاری قابل دسترسی (Workspace Contexts):</h4>
            <div className="space-y-2">
              {hats.map((h) => (
                <div key={h.partyId} className="flex items-center justify-between p-3 rounded-xl border border-[var(--line)] bg-[var(--mist)]">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold text-sm">{h.partyName}</span>
                    {h.kindLabel && <Badge tone="neutral">{h.kindLabel}</Badge>}
                  </div>
                  {activeHat?.partyId === h.partyId ? (
                    <Badge tone="ok" className="text-xs">کلاه کاری فعال فعلی</Badge>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">قابل انتخاب</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Panel>
      )}

      {/* Modal for adding new Stakeholder membership */}
      <ActionModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="تعریف ارتباط جدید کاربر با ذینفع/مجموعه"
        description="افزودن کاربر به یک گالری، بنکداری یا آتلیه به عنوان ذینفع."
        confirmLabel="ثبت ارتباط"
        onConfirm={() => void handleAddMembership()}
      >
        <div className="space-y-4">
          <Field label="کاربر">
            <select className="field min-h-11" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.username}) — نقش: {u.role}
                </option>
              ))}
            </select>
          </Field>

          <Field label="مجموعه / ذینفع مقصد">
            <select className="field min-h-11" value={selectedOrgId} onChange={(e) => setSelectedOrgId(e.target.value)}>
              <option value="">— انتخاب مجموعه —</option>
              {allParties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.kind_label ? `(${p.kind_label})` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="سمت / عنوان شغل کاربر در مجموعه">
            <input className="field min-h-11" value={memberTitle} onChange={(e) => setMemberTitle(e.target.value)} placeholder="مثال: مالک، مدیر فروش، انباردار..." />
          </Field>
        </div>
      </ActionModal>
    </div>
  );
}
