"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { users } from "@/data/mock";
import type { RoleId, User } from "@/data/types";
import {
  apiEnabled,
  apiOfflineAllowed,
  apiRequired,
  didarApi,
  getToken,
  setToken,
  type ApiUser,
} from "@/lib/api";

export type LoginResult =
  | { ok: true; user: User }
  | { ok: false; error: string };

export type SessionState = {
  ready: boolean;
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** Active working role (may differ from primary when multi-grant). */
  role: RoleId | null;
  /** Primary account role on the user record. */
  primaryRole: RoleId | null;
  availableRoles: RoleId[];
  setActiveRole: (role: RoleId) => void;
  login: (username: string, password: string) => Promise<LoginResult>;
  /** تعویض سریع حساب */
  switchUser: (userId: string) => Promise<LoginResult>;
  logout: () => void;
  homePath: string;
};

const SessionContext = createContext<SessionState | null>(null);
const STORAGE_ID_KEY = "didar.session.userId";
const STORAGE_USER_KEY = "didar.session.user";
const STORAGE_ACTIVE_ROLE_KEY = "didar.session.activeRole";

const KNOWN_ROLES: RoleId[] = [
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

function normalizeRoles(user: User | null): RoleId[] {
  if (!user) return [];
  const raw = [user.role, ...(user.roles ?? [])];
  const out: RoleId[] = [];
  for (const r of raw) {
    if (KNOWN_ROLES.includes(r as RoleId) && !out.includes(r as RoleId)) {
      out.push(r as RoleId);
    }
  }
  return out.length ? out : user.role ? [user.role] : [];
}

function readStoredActiveRole(): RoleId | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_ACTIVE_ROLE_KEY);
    if (raw && KNOWN_ROLES.includes(raw as RoleId)) return raw as RoleId;
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredActiveRole(role: RoleId | null) {
  try {
    if (role) window.localStorage.setItem(STORAGE_ACTIVE_ROLE_KEY, role);
    else window.localStorage.removeItem(STORAGE_ACTIVE_ROLE_KEY);
  } catch {
    /* ignore */
  }
}

export function homePathForRole(role: RoleId) {
  return "/app";
}

function normalizeLogin(value: string) {
  return value.trim().toLowerCase();
}

function mapApiUser(u: ApiUser): User {
  const primary = u.role as RoleId;
  const fromApi = (u.roles ?? []).filter((r): r is RoleId =>
    KNOWN_ROLES.includes(r as RoleId),
  );
  const fromGrants = (u.role_grants ?? [])
    .map((g) => g.role_code as RoleId)
    .filter((r) => KNOWN_ROLES.includes(r));
  const roles = Array.from(
    new Set<RoleId>([primary, ...fromApi, ...fromGrants]),
  );
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    password: "",
    role: primary,
    roles,
    org: u.org,
    status: u.status as User["status"],
    lastActive: u.last_active,
    avatarHue: u.avatar_hue,
  };
}

function readStoredApiUser(): User | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as User;
    if (!parsed?.id || !parsed?.role) return null;
    if (parsed.status === "suspended") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredApiUser(user: User | null) {
  try {
    if (user) {
      window.localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STORAGE_USER_KEY);
    }
  } catch {
    /* ignore */
  }
}

function localLogin(username: string, password: string): LoginResult {
  const key = normalizeLogin(username);
  if (!key || !password) {
    return { ok: false, error: "نام کاربری و رمز عبور را وارد کنید." };
  }

  const found = users.find(
    (u) =>
      normalizeLogin(u.username) === key || normalizeLogin(u.email) === key,
  );

  if (!found) {
    return { ok: false, error: "نام کاربری یا رمز عبور نادرست است." };
  }
  if (found.status === "suspended") {
    return { ok: false, error: "این حساب غیرفعال است." };
  }
  if (found.status === "invited") {
    return { ok: false, error: "این حساب هنوز فعال نشده است." };
  }
  if (found.password !== password) {
    return { ok: false, error: "نام کاربری یا رمز عبور نادرست است." };
  }

  window.localStorage.setItem(STORAGE_ID_KEY, found.id);
  return { ok: true, user: found };
}

function localSwitchUser(userId: string): LoginResult {
  const found = users.find((u) => u.id === userId);
  if (!found || found.status !== "active") {
    return { ok: false, error: "حساب قابل تعویض نیست." };
  }
  window.localStorage.setItem(STORAGE_ID_KEY, found.id);
  return { ok: true, user: found };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRoleState] = useState<RoleId | null>(null);
  const [ready, setReady] = useState(false);

  const applyUser = useCallback((next: User | null) => {
    setUser(next);
    if (!next) {
      setActiveRoleState(null);
      writeStoredActiveRole(null);
      return;
    }
    const available = normalizeRoles(next);
    const stored = readStoredActiveRole();
    const pick =
      (stored && available.includes(stored) && stored) ||
      next.role ||
      available[0] ||
      null;
    setActiveRoleState(pick);
    writeStoredActiveRole(pick);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (apiEnabled()) {
        const token = getToken();
        const stored = readStoredApiUser();
        if (token && stored) {
          if (!cancelled) applyUser(stored);
        }
        if (token) {
          try {
            const me = await didarApi.me();
            const mapped = mapApiUser(me);
            writeStoredApiUser(mapped);
            if (!cancelled) applyUser(mapped);
          } catch {
            // Invalid/expired JWT (e.g. after server migrate) — force clean re-login
            setToken(null);
            writeStoredApiUser(null);
            if (!cancelled) applyUser(null);
          }
        }
        if (!cancelled) setReady(true);
        return;
      }

      if (apiRequired()) {
        if (!cancelled) {
          applyUser(null);
          setReady(true);
        }
        return;
      }

      try {
        const id = window.localStorage.getItem(STORAGE_ID_KEY);
        const found = id ? users.find((u) => u.id === id) ?? null : null;
        if (!cancelled) {
          applyUser(found && found.status !== "suspended" ? found : null);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          applyUser(null);
          setReady(true);
        }
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [applyUser]);

  const login = useCallback(
    async (username: string, password: string): Promise<LoginResult> => {
      if (!apiEnabled()) {
        if (!apiOfflineAllowed()) {
          return {
            ok: false,
            error:
              "سرویس API پیکربندی نشده (NEXT_PUBLIC_API_URL). حالت آفلاین در محیط تولید غیرفعال است.",
          };
        }
        const result = localLogin(username, password);
        if (result.ok) applyUser(result.user);
        return Promise.resolve(result);
      }

      const key = normalizeLogin(username);
      if (!key || !password) {
        return { ok: false, error: "نام کاربری و رمز عبور را وارد کنید." };
      }

      try {
        const res = await didarApi.login(key, password);
        setToken(res.access_token);
        const mapped = mapApiUser(res.user);
        if (mapped.status === "suspended") {
          setToken(null);
          return { ok: false, error: "این حساب غیرفعال است." };
        }
        writeStoredApiUser(mapped);
        applyUser(mapped);
        return { ok: true, user: mapped };
      } catch (e) {
        return {
          ok: false,
          error:
            e instanceof Error
              ? e.message
              : "نام کاربری یا رمز عبور نادرست است.",
        };
      }
    },
    [applyUser],
  );

  const switchUser = useCallback(
    async (userId: string): Promise<LoginResult> => {
      if (!apiEnabled()) {
        if (!apiOfflineAllowed()) {
          return {
            ok: false,
            error: "تعویض حساب آفلاین در محیط تولید غیرفعال است.",
          };
        }
        const result = localSwitchUser(userId);
        if (result.ok) applyUser(result.user);
        return Promise.resolve(result);
      }

      const found = users.find((u) => u.id === userId);
      if (!found || found.status !== "active") {
        return { ok: false, error: "حساب قابل تعویض نیست." };
      }
      return login(found.username, "didar123");
    },
    [login, applyUser],
  );

  const logout = useCallback(() => {
    if (apiEnabled()) {
      setToken(null);
      writeStoredApiUser(null);
    } else {
      try {
        window.localStorage.removeItem(STORAGE_ID_KEY);
      } catch {
        /* ignore */
      }
    }
    applyUser(null);
  }, [applyUser]);

  const setActiveRole = useCallback(
    (role: RoleId) => {
      const available = normalizeRoles(user);
      if (!available.includes(role)) return;
      setActiveRoleState(role);
      writeStoredActiveRole(role);
    },
    [user],
  );

  const value = useMemo<SessionState>(() => {
    const availableRoles = normalizeRoles(user);
    const role =
      (activeRole && availableRoles.includes(activeRole) && activeRole) ||
      user?.role ||
      null;
    const isAdmin =
      availableRoles.includes("admin") || user?.role === "admin";
    return {
      ready,
      user,
      isAuthenticated: Boolean(user),
      isAdmin,
      role,
      primaryRole: user?.role ?? null,
      availableRoles,
      setActiveRole,
      login,
      switchUser,
      logout,
      homePath: role ? homePathForRole(role) : "/enter",
    };
  }, [ready, user, activeRole, setActiveRole, login, switchUser, logout]);

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}

export function roleFromPath(pathname: string): RoleId | null {
  const match = pathname.match(
    /^\/app\/(admin|qc|warehouse|pricing|agent|retailer|finance|customer|producer)(?:\/|$)/,
  );
  if (!match) return null;
  return match[1] as RoleId;
}
