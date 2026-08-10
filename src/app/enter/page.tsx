"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, LogOut } from "lucide-react";
import { users } from "@/data/mock";
import { roleLabels } from "@/data/labels";
import type { RoleId } from "@/data/types";
import {
  homePathForRole,
  roleFromPath,
  useSession,
} from "@/context/session-context";
import {
  domainFromPath,
  roleCanAccessDomain,
} from "@/data/domains";
import { GoldTicker } from "@/components/gold-ticker";
import { Button } from "@/components/ui";
import { apiEnabled, apiOfflineAllowed, didarApi } from "@/lib/api";

const DEMO_ROLES: RoleId[] = [
  "admin",
  "qc",
  "warehouse",
  "pricing",
  "agent",
  "retailer",
  "finance",
  "customer",
  "producer",
];

const demoAccounts = DEMO_ROLES.map((roleId) =>
  users.find((u) => u.role === roleId && u.status === "active"),
).filter(Boolean) as typeof users;

function EnterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user, role, login, logout, homePath } = useSession();

  const nextPath = searchParams.get("next");
  const nextRole = nextPath ? roleFromPath(nextPath) : null;
  const nextDomain = nextPath ? domainFromPath(nextPath) : null;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [demoSeed, setDemoSeed] = useState(apiOfflineAllowed());

  useEffect(() => {
    if (!apiEnabled()) {
      setDemoSeed(apiOfflineAllowed());
      return;
    }
    let cancelled = false;
    void didarApi
      .health()
      .then((h) => {
        if (!cancelled) setDemoSeed(Boolean(h.demo_seed));
      })
      .catch(() => {
        if (!cancelled) setDemoSeed(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const result = await login(username, password);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (nextPath) {
        if (nextRole && nextRole === result.user.role) {
          router.replace(nextPath);
          return;
        }
        if (nextDomain && roleCanAccessDomain(result.user.role, nextDomain)) {
          router.replace(nextPath);
          return;
        }
      }
      router.replace(homePathForRole(result.user.role));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--mist)]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,rgba(201,162,39,0.14),transparent_40%),linear-gradient(180deg,#F7F9FB,#E7EDF1)]" />

      <div className="mx-auto max-w-md px-5 py-10 sm:px-8">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)]"
          >
            <ArrowRight size={16} />
            بازگشت
          </Link>
          <GoldTicker className="scale-90 origin-start" />
        </div>

        {isAuthenticated && user ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,20,25,0.45)] sm:p-8"
          >
            <div className="flex items-center gap-3">
              <Image
                src="/icons/icon-192.png"
                alt=""
                width={40}
                height={40}
                className="rounded-xl bg-[var(--mist)] object-contain ring-1 ring-[var(--line)]"
              />
              <div>
                <p className="text-[11px] font-semibold text-[var(--muted)]">
                  هم‌اکنون وارد شده‌اید
                </p>
                <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
                  {user.name}
                </h1>
              </div>
            </div>
            <p className="mt-3 text-sm text-[var(--muted)]">
              {role ? roleLabels[role] : ""} · {user.org}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link
                href={
                  nextPath &&
                  nextDomain &&
                  role &&
                  roleCanAccessDomain(role, nextDomain)
                    ? nextPath
                    : homePath
                }
              >
                <Button>
                  ادامه در میز کار
                  <ArrowLeft size={16} />
                </Button>
              </Link>
              <Button variant="secondary" onClick={() => logout()}>
                <LogOut size={16} />
                خروج
              </Button>
            </div>
            <p className="mt-5 text-xs leading-6 text-[var(--muted)]">
              برای ورود با حساب دیگر، ابتدا خارج شوید.
            </p>
          </motion.div>
        ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-[var(--line)] bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,20,25,0.45)] sm:p-8"
        >
          <div className="flex items-center gap-3">
            <Image
              src="/icons/icon-192.png"
              alt=""
              width={40}
              height={40}
              className="rounded-xl bg-[var(--mist)] object-contain ring-1 ring-[var(--line)]"
            />
            <div>
              <p className="text-[11px] font-semibold text-[var(--muted)]">
                دیدار گلد
              </p>
              <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
                ورود
              </h1>
            </div>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            <div>
              <label
                htmlFor="login-username"
                className="mb-1.5 block text-sm font-medium text-[var(--ink)]"
              >
                نام کاربری یا ایمیل
              </label>
              <input
                id="login-username"
                type="text"
                name="username"
                autoComplete="username"
                required
                aria-required="true"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "login-error" : undefined}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="field"
                placeholder="مثلاً leila"
                dir="ltr"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-medium text-[var(--ink)]"
              >
                رمز عبور
              </label>
              <input
                id="login-password"
                type="password"
                name="password"
                autoComplete="current-password"
                required
                aria-required="true"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "login-error" : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>

            {error ? (
              <p
                id="login-error"
                role="alert"
                className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-800"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "در حال ورود…" : "ورود به سامانه"}
              <ArrowLeft size={16} />
            </Button>
          </form>

          {demoSeed ? (
            <div className="mt-8 border-t border-[var(--line)] pt-6">
              <div className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-6 text-amber-950">
                محیط آزمایشی (DEMO_SEED) — رمز مشترک{" "}
                <span data-ltr className="font-mono font-semibold">
                  didar123
                </span>
                . بعد از ورود مسیر پایلوت در{" "}
                <Link
                  href="/app/help"
                  className="font-semibold underline underline-offset-2"
                >
                  راهنمای سامانه
                </Link>{" "}
                است. قبل از دادهٔ واقعی مشتری seed را خاموش کنید.
              </div>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--ink)]">
                  ورود سریع نقش‌ها
                </p>
              </div>
              <ul className="space-y-2">
                {demoAccounts.map((account) => (
                  <li key={account.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setUsername(account.username);
                        setPassword(account.password);
                        setError(null);
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--mist)] px-4 py-3 text-right transition-colors hover:border-[var(--gold)]/50 hover:bg-white"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--ink)]">
                          {roleLabels[account.role]}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--muted)]">
                          {account.name}
                        </p>
                      </div>
                      <span
                        className="shrink-0 rounded-lg bg-white px-2.5 py-1 font-mono text-xs font-semibold text-[var(--gold-deep)] ring-1 ring-[var(--line)]"
                        data-ltr
                      >
                        {account.username}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </motion.div>
        )}
      </div>
    </div>
  );
}

export default function EnterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">
          در حال بارگذاری…
        </div>
      }
    >
      <EnterContent />
    </Suspense>
  );
}
