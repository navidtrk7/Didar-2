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
import { useSession } from "@/context/session-context";
import { apiEnabled, didarApi } from "@/lib/api";

export type WorkspaceHat = {
  partyId: string;
  partyName: string;
  kind: string;
  kindLabel: string;
  title: string;
  source: "membership" | "primary_org" | "admin_browse" | "session";
};

type WorkspaceState = {
  ready: boolean;
  hats: WorkspaceHat[];
  activeHat: WorkspaceHat | null;
  setActivePartyId: (partyId: string) => void;
  refresh: () => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceState | null>(null);
const STORAGE_KEY = "didar.workspace.activePartyId";

function sessionFallback(
  user: { id: string; org?: string; name: string } | null,
): WorkspaceHat[] {
  if (!user?.org) return [];
  return [
    {
      partyId: `session-${user.id}`,
      partyName: user.org,
      kind: "store",
      kindLabel: "محل کار",
      title: "سازمان حساب",
      source: "session",
    },
  ];
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { ready: sessionReady, user, isAuthenticated } = useSession();
  const [hats, setHats] = useState<WorkspaceHat[]>([]);
  const [activePartyId, setActivePartyIdState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setHats([]);
      setActivePartyIdState(null);
      setReady(true);
      return;
    }

    let next = sessionFallback(user);

    if (apiEnabled()) {
      try {
        const rows = await didarApi.myWorkspaceContexts();
        if (rows.length) {
          next = rows.map((r) => ({
            partyId: r.party_id,
            partyName: r.party_name,
            kind: r.kind,
            kindLabel: r.kind_label,
            title: r.title,
            source: r.source as WorkspaceHat["source"],
          }));
        }
      } catch {
        /* keep session fallback */
      }
    }

    setHats(next);

    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }

    const pick =
      (stored && next.find((h) => h.partyId === stored)?.partyId) ||
      next[0]?.partyId ||
      null;
    setActivePartyIdState(pick);
    setReady(true);
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!sessionReady) return;
    void refresh();
  }, [sessionReady, refresh]);

  const setActivePartyId = useCallback(
    (partyId: string) => {
      setActivePartyIdState(partyId);
      try {
        window.localStorage.setItem(STORAGE_KEY, partyId);
      } catch {
        /* ignore */
      }
    },
    [],
  );

  const activeHat = useMemo(
    () => hats.find((h) => h.partyId === activePartyId) ?? hats[0] ?? null,
    [hats, activePartyId],
  );

  const value = useMemo(
    () => ({
      ready,
      hats,
      activeHat,
      setActivePartyId,
      refresh,
    }),
    [ready, hats, activeHat, setActivePartyId, refresh],
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return ctx;
}
