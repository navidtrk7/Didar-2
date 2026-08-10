"use client";

import { useEffect, useMemo, useState } from "react";
import { assets } from "@/data/mock";
import { usePlatform } from "@/context/platform-context";
import { useSession } from "@/context/session-context";
import { resolveGoldRate } from "@/lib/gold-rate";
import { useSystemSettings } from "@/lib/system-settings";
import type { ProformaLine } from "@/data/types";
import { formatMoney, formatWeight } from "@/lib/utils";
import { useToast } from "@/components/toast";
import {
  Badge,
  Button,
  Field,
  Panel,
  SectionHeader,
  Stat,
} from "@/components/ui";

export default function AgentProformaPage() {
  const { toast } = useToast();
  const { user } = useSession();
  const { settings } = useSystemSettings();
  const {
    issuedAssets,
    proformas,
    creditAccounts,
    addProforma,
    createPriceLock,
    apiMode,
    liveGoldPrice,
  } = usePlatform();
  const goldRate = resolveGoldRate(liveGoldPrice);
  const agentName = user?.name ?? "ایجنت";
  const [retailer, setRetailer] = useState("");
  const [lines, setLines] = useState<ProformaLine[]>([]);
  const [uidInput, setUidInput] = useState("");
  const [lockEnds, setLockEnds] = useState<number | null>(null);
  const [lockId, setLockId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!retailer && creditAccounts[0]?.retailer) {
      setRetailer(creditAccounts[0].retailer);
    }
  }, [creditAccounts, retailer]);

  const account = creditAccounts.find((c) => c.retailer === retailer);
  const pool = apiMode
    ? issuedAssets
        .filter((a) => !a.status || a.status === "available")
        .map((a) => ({
          uid: a.uid,
          name: a.name,
          weightGrams: a.weightGrams,
          craftFeePct: a.craftFeePct,
        }))
    : [
        ...issuedAssets.map((a) => ({
          uid: a.uid,
          name: a.name,
          weightGrams: a.weightGrams,
          craftFeePct: a.craftFeePct,
        })),
        ...assets
          .filter((a) => a.status === "available")
          .map((a) => ({
            uid: a.uid,
            name: a.name,
            weightGrams: a.weightGrams,
            craftFeePct: 15,
          })),
      ];

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const lockLeft = lockEnds ? Math.max(0, Math.floor((lockEnds - now) / 1000)) : null;
  const lockExpired = lockLeft === 0;

  const total = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const metal = line.weightGrams * goldRate;
        return sum + metal + metal * (line.craftFeePct / 100);
      }, 0),
    [lines, goldRate],
  );

  const startLock = async () => {
    try {
      const lock = await createPriceLock({
        retailer,
        agent: agentName,
      });
      if (!lock) {
        toast("قفل قیمت ایجاد نشد", "warn");
        return;
      }
      setLockId(lock.id);
      setLockEnds(lock.expiresAt);
      toast(`قفل قیمت برای ${settings.priceLockMinutes} دقیقه فعال شد`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در قفل قیمت", "warn");
    }
  };

  const addUid = () => {
    const key = uidInput.trim().toUpperCase();
    const unused = pool.filter((a) => !lines.some((l) => l.uid === a.uid));
    // Empty input → first available. Nonempty → exact UID match only.
    const asset = key
      ? unused.find((a) => a.uid.toUpperCase() === key)
      : unused[0];
    if (!asset) {
      toast(
        key
          ? "این UID در موجودی قابل افزودن نیست"
          : "کالای قابل افزودن یافت نشد — ابتدا UID صادر کنید",
        "warn",
      );
      return;
    }
    setLines((prev) => [...prev, asset]);
    setUidInput("");
    if (!lockEnds) void startLock();
  };

  const issue = async () => {
    if (!account) {
      toast("خریدار را انتخاب کنید", "warn");
      return;
    }
    if (account.blocked) {
      toast("اعتبار این خرده‌فروش مسدود است — صدور ممکن نیست", "warn");
      return;
    }
    if (!lines.length) {
      toast("حداقل یک UID اضافه کنید", "warn");
      return;
    }
    const lineWeight = lines.reduce((s, l) => s + l.weightGrams, 0);
    const remaining = account.ceilingGrams - account.usedGrams;
    if (lineWeight > remaining) {
      toast(
        `سقف اعتباری کافی نیست (باقی ${remaining.toFixed(1)}g · سبد ${lineWeight.toFixed(1)}g)`,
        "warn",
      );
      return;
    }
    if (lockExpired || !lockEnds) {
      toast("قفل قیمت منقضی شده — دوباره قفل کنید", "warn");
      return;
    }
    if (apiMode && !lockId) {
      toast("قفل قیمت سرور لازم است — دوباره قفل کنید", "warn");
      return;
    }
    try {
      const created = await addProforma({
        retailer,
        agent: agentName,
        lines,
        ratePerGram: goldRate,
        lockId: lockId ?? undefined,
      });
      setLines([]);
      setLockEnds(null);
      setLockId(null);
      if (created)
        toast(`پیش‌فاکتور ${created.code} صادر شد — در پنل خرده‌فروش دیده می‌شود`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در صدور پیش‌فاکتور", "warn");
    }
  };

  return (
    <div>
      <SectionHeader
        title="صدور پیش‌فاکتور"
        description="از UIDهای صادرشده انبار یا موجودی کاتالوگ؛ با قفل قیمت و کنترل اعتبار."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat
          label="اعتبار مظنه"
          value={
            lockLeft != null
              ? `${String(Math.floor(lockLeft / 60)).padStart(2, "0")}:${String(lockLeft % 60).padStart(2, "0")}`
              : "—"
          }
          hint={lockExpired ? "منقضی" : `${settings.priceLockMinutes} دقیقه`}
        />
        <Stat
          label="وضعیت اعتبار"
          value={account?.blocked ? "مسدود" : "مجاز"}
          hint={
            account
              ? `سقف ${formatWeight(account.ceilingGrams - account.usedGrams)} باقی`
              : undefined
          }
        />
        <Stat label="مبلغ پیش‌فاکتور" value={formatMoney(total)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="space-y-4 p-5">
          <Field label="انتخاب خریدار (گالری)">
            <select
              className="field"
              value={retailer}
              onChange={(e) => setRetailer(e.target.value)}
            >
              {creditAccounts.map((c) => (
                <option key={c.id} value={c.retailer}>
                  {c.retailer}
                  {c.blocked ? " (مسدود)" : ""}
                </option>
              ))}
            </select>
          </Field>
          <Field label="افزودن UID">
            <div className="flex gap-2">
              <input
                className="field"
                value={uidInput}
                onChange={(e) => setUidInput(e.target.value)}
                placeholder="خالی = اولین موجود"
                dir="ltr"
              />
              <Button type="button" variant="secondary" onClick={addUid}>
                افزودن
              </Button>
            </div>
          </Field>
          <p className="text-xs text-[var(--muted)]">
            موجود برای افزودن: {pool.length} قلم ({issuedAssets.length} با UID
            تازه)
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={startLock}>
              قفل قیمت
            </Button>
            <Button type="button" onClick={issue}>
              صدور پیش‌فاکتور
            </Button>
          </div>
        </Panel>

        <Panel className="p-5">
          <p className="font-semibold">اقلام سبد</p>
          {lines.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--muted)]">
              هنوز قلمی اضافه نشده.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {lines.map((l) => (
                <li
                  key={l.uid}
                  className="flex items-start justify-between gap-3 rounded-xl bg-[var(--mist)] px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-semibold">{l.name}</p>
                    <p className="text-xs text-[var(--muted)]" data-ltr>
                      {l.uid} · {formatWeight(l.weightGrams)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs text-rose-700"
                    onClick={() =>
                      setLines((prev) => prev.filter((x) => x.uid !== l.uid))
                    }
                  >
                    حذف
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-8">
        <SectionHeader title="پیش‌فاکتورهای صادرشده" />
        <div className="space-y-3">
          {proformas.map((p) => (
            <Panel
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div>
                <p className="font-semibold" data-ltr>
                  {p.code}
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {p.retailer} · {formatMoney(p.totalIrr)}
                </p>
              </div>
              <Badge tone="ok">صادرشده</Badge>
            </Panel>
          ))}
        </div>
      </div>
    </div>
  );
}
