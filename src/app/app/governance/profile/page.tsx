"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "@/context/session-context";
import { useWorkspace } from "@/context/workspace-context";
import { didarApi, apiEnabled } from "@/lib/api";
import { useToast } from "@/components/toast";
import { SectionHeader, Panel, Button, Field, Badge, Stat } from "@/components/ui";
import { DataTable } from "@/components/data-table";
import { ActionModal } from "@/components/action-modal";
import {
  User as UserIcon,
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
  ExternalLink,
  Shield,
  Key,
  Network,
  Users,
  Search,
  UserPlus,
  UploadCloud,
  FileText,
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
  kind?: string;
};

type UserOption = {
  id: string;
  name: string;
  username: string;
  role: string;
  org?: string;
};

export default function ProfileManagementPage() {
  const { user: currentUser, role } = useSession();
  const { hats, activeHat } = useWorkspace();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<"identity" | "contact" | "stakeholders" | "documents" | "status">("identity");

  // Selected User ID to view/edit (defaults to current user)
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || "u1");
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [allParties, setAllParties] = useState<PartyOption[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Form states for the selected user profile
  const [name, setName] = useState("لیلا فرهادی");
  const [username, setUsername] = useState("leila");
  const [userRole, setUserRole] = useState("admin");
  const [nationalId, setNationalId] = useState("۰۰۱۲۳۴۵۶۷۸");
  const [fatherName, setFatherName] = useState("محمد");
  const [birthDate, setBirthDate] = useState("۱۳۶۸/۰۵/۱۲");
  const [gender, setGender] = useState("زن");

  const [phone, setPhone] = useState("۰۹۱۲۱۱۱۲۲۳۳");
  const [email, setEmail] = useState("leila@didargold.com");
  const [address, setAddress] = useState("تهران، بازار طلا و جواهر، راسته زرگران، پلاک ۴۵");
  const [postalCode, setPostalCode] = useState("۱۹۳۹۵-۴۱۱");

  const [unionLicense, setUnionLicense] = useState("پ‌ک-۹۸۷۶۵۴");
  const [verificationStatus, setVerificationStatus] = useState("verified");

  // Multi-Stakeholder memberships
  const [memberships, setMemberships] = useState<StakeholderMembership[]>([]);

  // Add Membership Modal
  const [addMembershipModalOpen, setAddMembershipModalOpen] = useState(false);
  const [targetOrgId, setTargetOrgId] = useState("");
  const [memberTitle, setMemberTitle] = useState("مدیر گالری / بنکدار");

  // Create New Profile & Complete User Modal
  const [createProfileModalOpen, setCreateProfileModalOpen] = useState(false);
  const [createModalTab, setCreateModalTab] = useState<"identity" | "contact" | "role" | "docs">("identity");
  
  // New Profile Fields
  const [newFullName, setNewFullName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("retailer");
  const [newOrgId, setNewOrgId] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("مالک و مدیر گالری");
  const [newNationalId, setNewNationalId] = useState("");
  const [newFatherName, setNewFatherName] = useState("");
  const [newBirthDate, setNewBirthDate] = useState("۱۳۷۰/۰۱/۱۵");
  const [newGender, setNewGender] = useState("مرد");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newPostalCode, setNewPostalCode] = useState("");
  const [newUnionLicense, setNewUnionLicense] = useState("");
  const [newDocAttached, setNewDocAttached] = useState(true);

  // Load initial list of users and parties
  const loadUsersAndParties = async () => {
    if (!apiEnabled()) {
      const mockUsers: UserOption[] = [
        { id: "u1", name: "لیلا فرهادی", username: "leila", role: "admin", org: "ستاد دیدار گلد" },
        { id: "u2", name: "مریم کاظمی", username: "maryam", role: "qc", org: "آزمایشگاه عیارسنجی" },
        { id: "u3", name: "سارا مهربان", username: "sara", role: "retailer", org: "گالری مهر طلا" },
        { id: "u4", name: "نوید رستمی", username: "navid", role: "agent", org: "شبکه میدانی دیدار" },
        { id: "u5", name: "حسین پاکروان", username: "hossein", role: "warehouse", org: "خزانه مرکزی دیدار" },
        { id: "u6", name: "نیما شریفی", username: "nima", role: "pricing", org: "میز قیمت‌گذاری" },
        { id: "u7", name: "کامبیز نوری", username: "kambiz", role: "finance", org: "مدیریت مالی" },
        { id: "u8", name: "آیدا محمدی", username: "aida", role: "customer", org: "مشتری نهایی" },
        { id: "u9", name: "کیان پارسا", username: "kian", role: "retailer", org: "بنکداری پارسا" },
        { id: "u10", name: "رضا علوی", username: "reza", role: "admin", org: "ستاد دیدار گلد" },
        { id: "u11", name: "آرش نوایی", username: "arash", role: "producer", org: "آتلیه نوا" },
      ];
      setAllUsers(mockUsers);

      const mockParties: PartyOption[] = [
        { id: "org-hq", name: "ستاد دیدار گلد", kind_label: "ستاد مرکزی", kind: "internal" },
        { id: "org-mehr", name: "گالری مهر طلا", kind_label: "گالری طلا", kind: "gallery" },
        { id: "org-zomorod", name: "گالری زمرد", kind_label: "گالری طلا", kind: "gallery" },
        { id: "org-parsa", name: "بنکداری پارسا", kind_label: "بنکدار عمده", kind: "wholesaler" },
        { id: "org-atelier", name: "آتلیه نوا", kind_label: "آتلیه طلاسازی", kind: "atelier" },
        { id: "org-factory-yazd", name: "کارخانه یزد زرین", kind_label: "کارخانه ساخت", kind: "factory" },
        { id: "org-noor", name: "بوتیک نور", kind_label: "گالری طلا", kind: "gallery" },
      ];
      setAllParties(mockParties);
      return;
    }

    try {
      const [usersRes, partiesRes] = await Promise.all([
        didarApi.listUsers() as Promise<UserOption[]>,
        didarApi.listParties() as Promise<PartyOption[]>,
      ]);
      setAllUsers(usersRes);
      setAllParties(partiesRes);
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در دریافت لیست کاربران و ذینفعان", "warn");
    }
  };

  // Load specific user profile data
  const loadUserProfile = async (uid: string) => {
    if (!apiEnabled()) {
      const selected = allUsers.find((u) => u.id === uid) || allUsers[0];
      if (selected) {
        setName(selected.name);
        setUsername(selected.username);
        setUserRole(selected.role);
        setEmail(`${selected.username}@didargold.com`);
        setPhone(selected.username === "sara" ? "۰۹۱۲۳۳۳۴۴۵۵" : "۰۹۱۲۱۱۱۲۲۳۳");
        setNationalId(selected.username === "sara" ? "۰۰۸۷۶۵۴۳۲۱" : "۰۰۱۲۳۴۵۶۷۸");
        setFatherName(selected.username === "sara" ? "حسین" : "محمد");

        // Mock multi-store memberships
        if (selected.username === "sara") {
          setMemberships([
            { id: "m-sara-1", org_id: "org-mehr", org_name: "گالری مهر طلا", kind: "gallery", title: "مالک و مسئول سفارشات", status: "active" },
            { id: "m-sara-2", org_id: "org-zomorod", org_name: "گالری زمرد", kind: "gallery", title: "سهام‌دار و ناظر مالی", status: "active" },
            { id: "m-sara-3", org_id: "org-parsa", org_name: "بنکداری پارسا", kind: "wholesaler", title: "مشاور خرید عمده", status: "active" },
          ]);
        } else if (selected.username === "arash") {
          setMemberships([
            { id: "m-arash-1", org_id: "org-atelier", org_name: "آتلیه نوا", kind: "atelier", title: "سرپرست طراحی و ساخت", status: "active" },
            { id: "m-arash-2", org_id: "org-factory-yazd", org_name: "کارخانه یزد زرین", kind: "factory", title: "طراح مدل‌های سفارشی", status: "active" },
          ]);
        } else if (selected.username === "navid") {
          setMemberships([
            { id: "m-navid-1", org_id: "org-field", org_name: "شبکه میدانی دیدار", kind: "internal", title: "ایجنت ارشد منطقه ۱", status: "active" },
            { id: "m-navid-2", org_id: "org-parsa", org_name: "بنکداری پارسا", kind: "wholesaler", title: "ایجنت پوشش و تحویل", status: "active" },
          ]);
        } else {
          setMemberships([
            { id: "m-1", org_id: "org-hq", org_name: "ستاد دیدار گلد", kind: "internal", title: "مدیر ارشد پلتفرم", status: "active" },
            { id: "m-2", org_id: "org-mehr", org_name: "گالری مهر طلا", kind: "gallery", title: "ناظر سازمانی", status: "active" },
            { id: "m-3", org_id: "org-zomorod", org_name: "گالری زمرد", kind: "gallery", title: "عضو هیئت مدیره", status: "active" },
          ]);
        }
      }
      return;
    }

    try {
      let profileRes: Record<string, unknown>;
      if (uid === currentUser?.id) {
        profileRes = (await didarApi.getMyProfile()) as Record<string, unknown>;
      } else {
        profileRes = (await didarApi.getUserProfile(uid)) as Record<string, unknown>;
      }

      if (profileRes) {
        if (profileRes.name) setName(String(profileRes.name));
        if (profileRes.username) setUsername(String(profileRes.username));
        if (profileRes.role) setUserRole(String(profileRes.role));
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
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در دریافت پروفایل کاربر", "warn");
    }
  };

  useEffect(() => {
    void loadUsersAndParties();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      void loadUserProfile(selectedUserId);
    }
  }, [selectedUserId]);

  const handleSaveProfile = async () => {
    try {
      if (apiEnabled()) {
        const payload = {
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
        };
        if (selectedUserId === currentUser?.id) {
          await didarApi.updateMyProfile(payload);
        } else {
          await didarApi.updateUserProfile(selectedUserId, payload);
        }
      }
      toast("اطلاعات پروفایل با موفقیت در پایگاه داده ذخیره شد");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در ذخیره پروفایل", "warn");
    }
  };

  const handleCreateNewProfile = async () => {
    if (!newFullName.trim() || !newUsername.trim()) {
      toast("نام و نام کاربری الزامی است", "warn");
      return;
    }

    const newUid = `u-${Date.now()}`;
    const selectedOrg = allParties.find((p) => p.id === newOrgId) || allParties[1];

    const newUserObj: UserOption = {
      id: newUid,
      name: newFullName.trim(),
      username: newUsername.trim().toLowerCase(),
      role: newRole,
      org: selectedOrg ? selectedOrg.name : "گالری",
    };

    setAllUsers((prev) => [newUserObj, ...prev]);

    // Set new profile active immediately
    setSelectedUserId(newUid);
    setName(newFullName.trim());
    setUsername(newUsername.trim().toLowerCase());
    setUserRole(newRole);
    setNationalId(newNationalId || "۰۰۲۳۴۵۶۷۸۹");
    setFatherName(newFatherName || "علی");
    setBirthDate(newBirthDate);
    setGender(newGender);
    setPhone(newPhone || "۰۹۱۲۹۹۹۸۸۷۷");
    setEmail(newEmail || `${newUsername.trim()}@didargold.com`);
    setAddress(newAddress || "تهران، بازار طلا");
    setPostalCode(newPostalCode || "۱۹۳۹۵-۱۱۱");
    setUnionLicense(newUnionLicense || "پ‌ک-۱۱۱۴۴۴");
    setVerificationStatus("verified");

    setMemberships([
      {
        id: `m-${Date.now()}`,
        org_id: selectedOrg ? selectedOrg.id : "org-mehr",
        org_name: selectedOrg ? selectedOrg.name : "گالری جدید",
        kind: selectedOrg?.kind || "gallery",
        title: newJobTitle || "مالک / مدیر",
        status: "active",
      },
    ]);

    setCreateProfileModalOpen(false);
    toast(`پروفایل و کاربر جدید «${newFullName}» با نقش «${newRole}» با موفقیت ایجاد گردید`);

    // Reset form
    setNewFullName("");
    setNewUsername("");
    setNewEmail("");
    setNewPhone("");
    setNewNationalId("");
    setNewAddress("");
  };

  const handleAddMembership = async () => {
    if (!targetOrgId || !selectedUserId) {
      toast("مجموعه ذینفع را انتخاب کنید", "warn");
      return;
    }
    try {
      if (apiEnabled()) {
        await didarApi.assignMembership(targetOrgId, selectedUserId, memberTitle);
        await loadUserProfile(selectedUserId);
      } else {
        const orgObj = allParties.find((p) => p.id === targetOrgId);
        setMemberships((prev) => [
          ...prev,
          {
            id: `m-${Date.now()}`,
            org_id: targetOrgId,
            org_name: orgObj?.name || "مجموعه جدید",
            kind: orgObj?.kind || "gallery",
            title: memberTitle,
            status: "active",
          },
        ]);
      }
      setAddMembershipModalOpen(false);
      toast("عضویت ذینفعانه جدید برای کاربر با موفقیت اضافه شد");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در ثبت عضویت ذینفع", "warn");
    }
  };

  const handleRemoveMembership = async (membershipId: string) => {
    try {
      if (apiEnabled()) {
        await didarApi.unassignMembership(membershipId);
        await loadUserProfile(selectedUserId);
      } else {
        setMemberships((prev) => prev.filter((m) => m.id !== membershipId));
      }
      toast("عضویت ذینفع حذف گردید");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در حذف عضویت", "warn");
    }
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-4">
        <div>
          <h1 className="text-xl font-black text-[var(--ink)] flex items-center gap-2">
            <UserIcon className="w-6 h-6 text-amber-500" />
            <span>مدیریت پروفایل و ذینفعان (Profile Management)</span>
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            ثبت، نمایش و ویرایش مشخصات پرسنل داخلی و ذینفعان شبکه (گالری‌ها، بنکداران، آتلیه‌ها) همراه با مدیریت چندنقشی.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Prominent "Add New Profile" Button */}
          <Button
            onClick={() => setCreateProfileModalOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs px-4 py-2 font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/25"
          >
            <UserPlus className="w-4 h-4" />
            <span>اضافه کردن پروفایل جدید</span>
          </Button>

          {/* Quick links to Role Management and Stakeholder Management */}
          <Link
            href="/app/governance/roles"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--line)] bg-[var(--mist)] hover:bg-amber-500/10 hover:text-amber-600 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span>مدیریت نقش‌ها (RM)</span>
          </Link>
          <Link
            href="/app/governance/permissions"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--line)] bg-[var(--mist)] hover:bg-amber-500/10 hover:text-amber-600 transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span>سطوح دسترسی (PX)</span>
          </Link>
          <Link
            href="/app/network"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--line)] bg-[var(--mist)] hover:bg-amber-500/10 hover:text-amber-600 transition-colors"
          >
            <Network className="w-3.5 h-3.5 text-amber-500" />
            <span>مدیریت ذینفعان (ST)</span>
          </Link>

          <Button onClick={handleSaveProfile} className="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 text-white text-xs px-4 py-2">
            ذخیره تغییرات
          </Button>
        </div>
      </div>

      {/* User Selector Bar: Switch between internal staff & stakeholder users */}
      <Panel className="p-4 bg-[var(--mist)]/70 border border-[var(--line)] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="font-bold text-xs text-[var(--ink)]">انتخاب کاربر برای مشاهده و تدوین پروفایل:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute right-3 top-3 text-[var(--muted)]" />
              <input
                className="field min-h-9 text-xs pr-8 pl-3"
                placeholder="جستجوی نام یا نقش کاربر..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="field min-h-9 text-xs font-semibold"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              {filteredUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.username}) — نقش: {u.role} {u.org ? `[${u.org}]` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected User Badge Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--line)] text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[var(--muted)]">کاربر در حال ویرایش:</span>
            <span className="font-bold text-[var(--ink)]">{name}</span>
            <span className="font-mono text-[var(--muted)]" dir="ltr">(@{username})</span>
            <Badge tone="gold">{userRole}</Badge>
            <Badge tone="ok">{verificationStatus === "verified" ? "احراز هویت شده" : "در انتظار مدارک"}</Badge>
          </div>
          <div className="text-[var(--muted)]">
            تعداد عضویت‌های ذینفعانه: <span className="font-bold text-amber-600">{memberships.length} مجموعه</span>
          </div>
        </div>
      </Panel>

      {/* 5 Tabs corresponding to UM / PM Flow */}
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
          <UserIcon className="w-4 h-4" />
          <span>PM1: اطلاعات هویتی</span>
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
          <span>PM2: اطلاعات تماس</span>
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
          <span>PM3: اطلاعات شغلی و ذینفعان ({memberships.length})</span>
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
          <span>PM4: مدارک و احراز هویت</span>
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
          <span>PM5: وضعیت حساب و کلاه‌ها</span>
        </button>
      </div>

      {/* Tab 1 (PM1): Identity Info */}
      {activeTab === "identity" && (
        <Panel className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-[var(--line)]">
            <h3 className="font-bold text-base text-[var(--ink)]">PM1: اطلاعات شناسنامه‌ای و هویتی کاربر</h3>
            <span className="text-xs text-[var(--muted)]">قابل ویرایش توسط کاربر و مدیران سیستم</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="نام و نام خانوادگی">
              <input className="field min-h-11" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="کد ملی (۱۰ رقم)">
              <input className="field min-h-11 font-mono" value={nationalId} onChange={(e) => setNationalId(e.target.value)} dir="ltr" />
            </Field>
            <Field label="نام پدر">
              <input className="field min-h-11" value={fatherName} onChange={(e) => setFatherName(e.target.value)} />
            </Field>
            <Field label="تاریخ تولد (شمسی)">
              <input className="field min-h-11 font-mono" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} dir="ltr" />
            </Field>
            <Field label="جنسیت">
              <select className="field min-h-11" value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="زن">زن</option>
                <option value="مرد">مرد</option>
              </select>
            </Field>
            <Field label="نام کاربری (شناسه یکتا)">
              <input className="field min-h-11 font-mono bg-slate-100 dark:bg-slate-800" value={username} disabled dir="ltr" />
            </Field>
          </div>
        </Panel>
      )}

      {/* Tab 2 (PM2): Contact Info */}
      {activeTab === "contact" && (
        <Panel className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-[var(--line)]">
            <h3 className="font-bold text-base text-[var(--ink)]">PM2: اطلاعات تماس و آدرس پستی</h3>
            <span className="text-xs text-[var(--muted)]">جهت هماهنگی تحویل، OTP و ابلاغیه‌های رسمی صنف</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="شماره تلفن همراه (جهت دریافت OTP)">
              <input className="field min-h-11 font-mono" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
            </Field>
            <Field label="پست الکترونیکی (ایمیل رسمی)">
              <input className="field min-h-11 font-mono" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
            </Field>
            <Field label="کد پستی ۱۰ رقمی">
              <input className="field min-h-11 font-mono" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} dir="ltr" />
            </Field>
            <div className="sm:col-span-2 lg:col-span-3">
              <Field label="نشانی کامل محل کسب / گالری / سکونت">
                <input className="field min-h-11" value={address} onChange={(e) => setAddress(e.target.value)} />
              </Field>
            </div>
          </div>
        </Panel>
      )}

      {/* Tab 3 (PM3): Occupational & Stakeholders Multi-Mapping */}
      {activeTab === "stakeholders" && (
        <div className="space-y-6">
          {/* Card A: One User -> Multiple Stakeholder Roles */}
          <Panel className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-[var(--line)]">
              <div>
                <h3 className="font-bold text-base text-[var(--ink)] flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-500" />
                  <span>عضویت‌های ذینفعانه این کاربر (یک کاربر ➔ چند مجموعه)</span>
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  کاربر «{name}» می‌تواند هم‌زمان در چند گالری، بنکداری، آتلیه طلاسازی یا ستاد دارای سمت و مسئولیت باشد.
                </p>
              </div>
              <Button
                onClick={() => setAddMembershipModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5 text-xs self-start"
              >
                <Plus className="w-4 h-4" />
                <span>اتصال به ذینفع / مجموعه جدید</span>
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
                  {m.kind === "gallery" ? "گالری" : m.kind === "internal" ? "ستاد" : m.kind === "wholesaler" ? "بنکدار" : "آتلیه/تولیدکننده"}
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

          {/* Card B: One Stakeholder -> Multiple Users (e.g. Gallery Zomorrod having multiple staff) */}
          <Panel className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-[var(--line)]">
              <div>
                <h3 className="font-bold text-base text-[var(--ink)] flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-500" />
                  <span>اعضا و همکاران در مجموعه فعال ({activeHat?.partyName || "گالری زمرد"})</span>
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  یک مجموعه (مانند گالری زمرد) می‌تواند چندین عضو با دسترسی‌ها و نقش‌های متفاوت داشته باشد (مالک، مدیر فروش، حسابدار).
                </p>
              </div>
              <Link
                href="/app/network"
                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
              >
                <span>مشاهده کل شبکه ذینفعان</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

            <DataTable
              headers={["نام همکار", "نام کاربری", "نقش سازمانی", "سمت در مجموعه", "سطح دسترسی"]}
              rows={[
                ["لیلا فرهادی", <span key="u1-n" className="font-mono text-xs" dir="ltr">leila</span>, "مدیر کل", "سهام‌دار و ناظر عالی", <Badge key="u1-b" tone="gold">دسترسی کامل</Badge>],
                ["سارا مهربان", <span key="u3-n" className="font-mono text-xs" dir="ltr">sara</span>, "خرده‌فروش", "مدیر گالری و مسئول خرید", <Badge key="u3-b" tone="ok">ثبت سفارش و اعتبار</Badge>],
                ["حسین پاکروان", <span key="u5-n" className="font-mono text-xs" dir="ltr">hossein</span>, "انباردار", "مسئول دریافت و تحویل پلمب", <Badge key="u5-b" tone="neutral">انبار و OTP</Badge>],
              ]}
            />
          </Panel>
        </div>
      )}

      {/* Tab 4 (PM4): Documents & Verification */}
      {activeTab === "documents" && (
        <Panel className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-3 border-[var(--line)]">
            <h3 className="font-bold text-base text-[var(--ink)]">PM4: مدارک هویتی، پروانه‌ها و احراز اصالت صنف</h3>
            <Badge tone={verificationStatus === "verified" ? "ok" : "warn"} className="text-xs flex items-center gap-1">
              <BadgeCheck className="w-4 h-4" />
              <span>{verificationStatus === "verified" ? "احراز هویت شده (رسمی)" : "در انتظار مدارک"}</span>
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="شماره پروانه کسب / مجوز اتحادیه طلا">
              <input className="field min-h-11 font-mono" value={unionLicense} onChange={(e) => setUnionLicense(e.target.value)} dir="ltr" />
            </Field>
            <Field label="استعلام صنف و کد اقتصادی">
              <input className="field min-h-11 bg-slate-100 dark:bg-slate-800" value="تایید شده توسط سامانه یکپارچه اتحادیه" disabled />
            </Field>
            <Field label="وضعیت احراز هویت شاهکار">
              <input className="field min-h-11 bg-slate-100 dark:bg-slate-800" value="تطابق کد ملی با شماره همراه (تایید شده)" disabled />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="p-4 border rounded-xl border-dashed border-amber-500/40 bg-amber-500/5 space-y-2 flex flex-col justify-between">
              <div>
                <p className="font-semibold text-sm">تصویر کارت ملی هوشمند</p>
                <p className="text-xs text-[var(--muted)] mt-1">تطبیق چهره و مدارک با بانک اطلاعاتی ثبت احوال انجام شده است.</p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <Badge tone="ok">تایید شده</Badge>
                <span className="text-[10px] text-[var(--muted)] font-mono">DOC-NID-1405.PDF</span>
              </div>
            </div>

            <div className="p-4 border rounded-xl border-dashed border-amber-500/40 bg-amber-500/5 space-y-2 flex flex-col justify-between">
              <div>
                <p className="font-semibold text-sm">جواز کسب معتبر / سند مالکیت گالری</p>
                <p className="text-xs text-[var(--muted)] mt-1">تطبیق آدرس با راسته بازار و صنف طلا و جواهر ثبت گردید.</p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <Badge tone="ok">تایید شده</Badge>
                <span className="text-[10px] text-[var(--muted)] font-mono">DOC-LIC-987.PDF</span>
              </div>
            </div>
          </div>
        </Panel>
      )}

      {/* Tab 5 (PM5): Account Status & Active Hats */}
      {activeTab === "status" && (
        <Panel className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-3 border-[var(--line)]">
            <h3 className="font-bold text-base text-[var(--ink)]">PM5: وضعیت حساب کاربری، امنیت و کلاه‌های کاری</h3>
            <Badge tone="ok">حساب فعال</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="وضعیت حساب" value="فعال و تاییدشده" hint="دسترسی کامل عملیاتی به پلتفرم" />
            <Stat label="آخرین نشست فعال" value="چند لحظه پیش" hint="از طریق وب‌سایت امن" />
            <Stat label="کلاه‌های کاری قابل انتخاب" value={`${hats.length} مجموعه`} hint="سوئیچ سریع در هدر و سایدبار" />
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">کلاه‌های کاری فعال این کاربر در پلتفرم (Workspace Contexts):</h4>
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

      {/* Modal for Creating Complete New Profile */}
      <ActionModal
        open={createProfileModalOpen}
        onClose={() => setCreateProfileModalOpen(false)}
        title="اضافه کردن پروفایل جدید و ثبت در شبکه"
        description="ثبت کامل اطلاعات هویتی، اطلاعات تماس، نقش سیستمی، مجموعه شبکه و مدارک احراز هویت."
        confirmLabel="ایجاد و فعال‌سازی پروفایل"
        onConfirm={handleCreateNewProfile}
      >
        <div className="space-y-4">
          {/* Modal Steps / Tabs */}
          <div className="flex border-b border-[var(--line)] gap-2 pb-2">
            <button
              type="button"
              onClick={() => setCreateModalTab("identity")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                createModalTab === "identity" ? "bg-amber-500 text-white" : "bg-[var(--mist)] text-[var(--muted)]"
              }`}
            >
              ۱. هویت و نام
            </button>
            <button
              type="button"
              onClick={() => setCreateModalTab("contact")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                createModalTab === "contact" ? "bg-amber-500 text-white" : "bg-[var(--mist)] text-[var(--muted)]"
              }`}
            >
              ۲. تماس و نشانی
            </button>
            <button
              type="button"
              onClick={() => setCreateModalTab("role")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                createModalTab === "role" ? "bg-amber-500 text-white" : "bg-[var(--mist)] text-[var(--muted)]"
              }`}
            >
              ۳. نقش و مجموعه
            </button>
            <button
              type="button"
              onClick={() => setCreateModalTab("docs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                createModalTab === "docs" ? "bg-amber-500 text-white" : "bg-[var(--mist)] text-[var(--muted)]"
              }`}
            >
              ۴. مدارک و مجوز
            </button>
          </div>

          {/* Step 1: Identity */}
          {createModalTab === "identity" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="نام و نام خانوادگی">
                <input
                  className="field min-h-10"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="مثال: کیانوش طاهری"
                />
              </Field>
              <Field label="نام کاربری انگلیسی (یکتا)">
                <input
                  className="field min-h-10 font-mono"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="kianoush"
                  dir="ltr"
                />
              </Field>
              <Field label="کد ملی ۱۰ رقمی">
                <input
                  className="field min-h-10 font-mono"
                  value={newNationalId}
                  onChange={(e) => setNewNationalId(e.target.value)}
                  placeholder="۰۰۳۴۵۶۷۸۹۰"
                  dir="ltr"
                />
              </Field>
              <Field label="نام پدر">
                <input
                  className="field min-h-10"
                  value={newFatherName}
                  onChange={(e) => setNewFatherName(e.target.value)}
                  placeholder="حسین"
                />
              </Field>
              <Field label="تاریخ تولد">
                <input
                  className="field min-h-10 font-mono"
                  value={newBirthDate}
                  onChange={(e) => setNewBirthDate(e.target.value)}
                  dir="ltr"
                />
              </Field>
              <Field label="جنسیت">
                <select
                  className="field min-h-10"
                  value={newGender}
                  onChange={(e) => setNewGender(e.target.value)}
                >
                  <option value="مرد">مرد</option>
                  <option value="زن">زن</option>
                </select>
              </Field>
            </div>
          )}

          {/* Step 2: Contact */}
          {createModalTab === "contact" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="شماره تلفن همراه (OTP)">
                <input
                  className="field min-h-10 font-mono"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="۰۹۱۲۱۱۱۴۴۵۵"
                  dir="ltr"
                />
              </Field>
              <Field label="پست الکترونیکی (ایمیل)">
                <input
                  className="field min-h-10 font-mono"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="kianoush@didargold.com"
                  dir="ltr"
                />
              </Field>
              <Field label="کد پستی">
                <input
                  className="field min-h-10 font-mono"
                  value={newPostalCode}
                  onChange={(e) => setNewPostalCode(e.target.value)}
                  placeholder="۱۹۳۹۵-۲۲۲"
                  dir="ltr"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="نشانی کامل محل کسب / گالری">
                  <input
                    className="field min-h-10"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="تهران، راسته بازار طلا و جواهر، پلاک ۱۲"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Step 3: Role & Stakeholder Network */}
          {createModalTab === "role" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="نقش سیستمی کاربر">
                <select
                  className="field min-h-10 font-semibold"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="retailer">خرده‌فروش / گالری (Retailer)</option>
                  <option value="agent">ایجنت میدانی (Agent)</option>
                  <option value="producer">تولیدکننده / کارگاه طلا (Producer)</option>
                  <option value="warehouse">انباردار و خزانه (Warehouse)</option>
                  <option value="finance">مدیر مالی (Finance)</option>
                  <option value="qc">بازرس کنترل کیفیت (QC)</option>
                  <option value="pricing">کارشناس قیمت‌گذاری (Pricing)</option>
                  <option value="admin">مدیر ارشد ستاد (Admin)</option>
                  <option value="customer">مشتری نهایی (Customer)</option>
                </select>
              </Field>

              <Field label="مجموعه / ذینفع در شبکه">
                <select
                  className="field min-h-10 font-semibold"
                  value={newOrgId}
                  onChange={(e) => setNewOrgId(e.target.value)}
                >
                  <option value="">— انتخاب مجموعه —</option>
                  {allParties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.kind_label ? `(${p.kind_label})` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="sm:col-span-2">
                <Field label="سمت و عنوان مسئولیت در مجموعه">
                  <input
                    className="field min-h-10"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    placeholder="مثال: مالک گالری، سرپرست کارگاه، مسئول سفارشات"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Step 4: Documents & Compliance */}
          {createModalTab === "docs" && (
            <div className="space-y-3">
              <Field label="شماره پروانه کسب / مجوز صنف طلا">
                <input
                  className="field min-h-10 font-mono"
                  value={newUnionLicense}
                  onChange={(e) => setNewUnionLicense(e.target.value)}
                  placeholder="پ‌ک-۹۸۷۱۲۳"
                  dir="ltr"
                />
              </Field>

              <div className="p-3 border rounded-xl border-dashed border-amber-500/40 bg-amber-500/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-bold text-xs">اسناد احراز هویت و کارت ملی هوشمند</p>
                    <p className="text-[10px] text-[var(--muted)]">پیوست خودکار استعلام شاهکار</p>
                  </div>
                </div>
                <Badge tone="ok">آماده صدور</Badge>
              </div>
            </div>
          )}
        </div>
      </ActionModal>

      {/* Modal for adding new Stakeholder membership */}
      <ActionModal
        open={addMembershipModalOpen}
        onClose={() => setAddMembershipModalOpen(false)}
        title="تعریف ارتباط ذینفعانه جدید برای کاربر"
        description={`افزودن کاربر «${name}» به عنوان عضو یا مدیر یک گالری، بنکداری، آتلیه یا کارخانه.`}
        confirmLabel="ثبت عضویت ذینفع"
        onConfirm={() => void handleAddMembership()}
      >
        <div className="space-y-4">
          <Field label="کاربر هدف">
            <input className="field min-h-11 bg-slate-100 dark:bg-slate-800" value={`${name} (${username})`} disabled />
          </Field>

          <Field label="مجموعه / ذینفع مقصد">
            <select className="field min-h-11" value={targetOrgId} onChange={(e) => setTargetOrgId(e.target.value)}>
              <option value="">— انتخاب مجموعه ذینفع —</option>
              {allParties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.kind_label ? `(${p.kind_label})` : ""}
                </option>
              ))}
            </select>
          </Field>

          <Field label="سمت / عنوان مسئولیت در مجموعه">
            <input
              className="field min-h-11"
              value={memberTitle}
              onChange={(e) => setMemberTitle(e.target.value)}
              placeholder="مثال: مالک، مدیر فروشگاه، سرپرست کارگاه..."
            />
          </Field>
        </div>
      </ActionModal>
    </div>
  );
}
