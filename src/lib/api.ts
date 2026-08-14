/**
 * Didar API client — JWT + platform mutations.
 */

const TOKEN_KEY = "didar.api.token";

const base = () =>
  (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

/** Production or dev requiring explicit API URL. */
export function apiRequired() {
  return process.env.NEXT_PUBLIC_REQUIRE_API === "true";
}

export function apiEnabled() {
  return Boolean(base());
}

/** Local offline demo fallback when no backend API URL is supplied. */
export function apiOfflineAllowed() {
  return !apiEnabled();
}

/** Resolve stored image paths so /media/* loads via the API host/proxy. */
export function resolveMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  if (path.startsWith("/media/")) {
    const root = base();
    return root ? `${root}${path}` : path;
  }
  return path;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function api<T>(
  path: string,
  init?: RequestInit & { json?: unknown; auth?: boolean },
): Promise<T> {
  const url = `${base()}/api/v1${path}`;
  const headers = new Headers(init?.headers);
  if (init?.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  const auth = init?.auth !== false;
  const token = getToken();
  if (auth && token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, {
    ...init,
    headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    cache: "no-store",
  }).catch(() => {
    throw new Error(
      "اتصال به سرویس برقرار نشد — بک‌اند را روشن کنید یا شبکه را بررسی کنید.",
    );
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const err = (await res.json()) as { detail?: string | { msg?: string }[] };
      if (typeof err.detail === "string") detail = err.detail;
      else if (Array.isArray(err.detail))
        detail = err.detail.map((d) => d.msg ?? JSON.stringify(d)).join("; ");
    } catch {
      /* ignore */
    }
    if (res.status === 401 && auth) {
      setToken(null);
      try {
        window.localStorage.removeItem("didar.session.user");
      } catch {
        /* ignore */
      }
    }
    throw new Error(detail || `API ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type ApiUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  org: string;
  org_id?: string | null;
  status: string;
  last_active: string;
  avatar_hue: number;
  roles?: string[];
  role_grants?: { id: string; role_code: string }[];
};

export type ApiPlatform = {
  settings: {
    weight_tolerance_grams: number;
    price_lock_minutes: number;
    proforma_ttl_minutes: number;
    default_karat: number;
    rate_source: string;
    currency: string;
  };
  live_gold: { price_per_gram: number; karat: number; source: string };
  skus: Array<Record<string, unknown>>;
  qc_queue: Array<Record<string, unknown>>;
  issued_assets: Array<Record<string, unknown>>;
  assets: Array<Record<string, unknown>>;
  inventory: Array<Record<string, unknown>>;
  proformas: Array<Record<string, unknown>>;
  credit_accounts: Array<{
    id: string;
    retailer: string;
    ceiling_grams: number;
    used_grams: number;
    ceiling_irr: number;
    used_irr: number;
    overdue_grams: number;
    blocked: boolean;
  }>;
  credit_documents: Array<{
    id: string;
    code: string;
    retailer: string;
    amount_irr: number;
    weight_grams: number;
    due_date: string;
    overdue_days: number;
    status: string;
    settlement_channel?: string | null;
    settlement_notes?: string;
    settled_at?: string | null;
    origin_channel?: string | null;
  }>;
  rate_requests: Array<Record<string, unknown>>;
  craft_rules: Array<Record<string, unknown>>;
  adjustments: Array<Record<string, unknown>>;
  deliveries: Array<Record<string, unknown>>;
  orders: Array<Record<string, unknown>>;
  dual_ledger: Array<Record<string, unknown>>;
  audit_events: Array<Record<string, unknown>>;
};

export const didarApi = {
  health: () =>
    api<{ status: string; service?: string; demo_seed?: boolean; otp_demo?: boolean }>(
      "/health",
      { auth: false },
    ),
  platform: () => api<ApiPlatform>("/platform"),
  verify: (uid: string) =>
    api<{ found: boolean; asset?: Record<string, unknown> }>(
      `/verify/${encodeURIComponent(uid)}`,
      { auth: false },
    ),
  login: (username: string, password: string) =>
    api<{ access_token: string; user: ApiUser }>("/auth/login", {
      method: "POST",
      json: { username, password },
      auth: false,
    }),
  me: () => api<ApiUser>("/auth/me"),
  getMyProfile: () => api<Record<string, unknown>>("/governance/profile/me"),
  updateMyProfile: (body: Record<string, unknown>) =>
    api("/governance/profile/me", { method: "PUT", json: body }),
  getUserProfile: (userId: string) =>
    api<Record<string, unknown>>(`/governance/profile/users/${userId}`),
  updateUserProfile: (userId: string, body: Record<string, unknown>) =>
    api(`/governance/profile/users/${userId}`, { method: "PUT", json: body }),
  assignMembership: (orgId: string, userId: string, title: string) =>
    api(`/network/parties/${orgId}/memberships`, {
      method: "POST",
      json: { user_id: userId, title },
    }),
  unassignMembership: (membershipId: string) =>
    api(`/network/memberships/${membershipId}/unassign`, { method: "POST" }),
  createSku: (body: Record<string, unknown>) =>
    api("/product/skus", { method: "POST", json: body }),
  uploadProductImage: async (file: File) => {
    const url = `${base()}/api/v1/product/images`;
    const headers = new Headers();
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      cache: "no-store",
    }).catch(() => {
      throw new Error(
        "اتصال به سرویس برقرار نشد — بک‌اند را روشن کنید یا شبکه را بررسی کنید.",
      );
    });
    if (!res.ok) {
      let detail = res.statusText;
      try {
        const err = (await res.json()) as { detail?: string };
        if (typeof err.detail === "string") detail = err.detail;
      } catch {
        /* ignore */
      }
      throw new Error(detail || `API ${res.status}`);
    }
    return (await res.json()) as { url: string };
  },
  sendSkuToQc: (skuId: string) =>
    api(`/product/skus/${skuId}/send-to-qc`, { method: "POST" }),
  completeQc: (
    id: string,
    body: {
      measured_weight: number;
      result: string;
      inspector?: string;
      notes?: string;
    },
  ) => api(`/product/qc/${id}/complete`, { method: "POST", json: body }),
  issueUid: (skuId: string) =>
    api(`/inventory/uids?sku_id=${encodeURIComponent(skuId)}`, {
      method: "POST",
    }),
  createPriceLock: (body: {
    retailer: string;
    agent?: string;
    rate_per_gram?: number;
  }) =>
    api<{
      id: string;
      expires_at: string;
      rate_per_gram: number;
      minutes: number;
    }>("/commerce/locks", { method: "POST", json: body }),
  issueProforma: (body: {
    retailer: string;
    agent: string;
    lock_id: string;
    lines: { uid: string; craft_fee_pct?: number }[];
  }) => api("/commerce/proformas", { method: "POST", json: body }),
  addRateRequest: (body: Record<string, unknown>) =>
    api("/commerce/rate-requests", { method: "POST", json: body }),
  decideRateRequest: (id: string, status: "approved" | "rejected") =>
    api(`/commerce/rate-requests/${id}/decide`, {
      method: "POST",
      json: { status },
    }),
  addCraftRule: (body: Record<string, unknown>) =>
    api("/pricing/craft-rules", { method: "POST", json: body }),
  toggleCraftRule: (id: string) =>
    api(`/pricing/craft-rules/${id}/toggle`, { method: "POST" }),
  patchSettings: (body: Record<string, unknown>) =>
    api("/settings", { method: "PATCH", json: body }),
  createAdjustment: (body: {
    reason: string;
    weight_delta: number;
    irr_delta: number;
  }) => api("/finance/adjustments", { method: "POST", json: body }),
  confirmDeliveryOtp: (id: string, otp: string = "1234") =>
    api(`/fulfillment/shipments/${id}/confirm-otp`, {
      method: "POST",
      json: { otp },
    }),
  createDelivery: (proforma_id: string, from_location?: string) =>
    api("/fulfillment/shipments", {
      method: "POST",
      json: { proforma_id, from_location: from_location ?? "خزانه تهران-الف" },
    }),
  advanceFulfillment: (id: string) =>
    api(`/fulfillment/shipments/${id}/advance`, { method: "POST" }),
  listFulfillment: (stage?: string) =>
    api(
      stage
        ? `/fulfillment/shipments?stage=${encodeURIComponent(stage)}`
        : "/fulfillment/shipments",
    ),
  settleCreditDocument: (
    id: string,
    body?: { channel?: string; notes?: string },
  ) =>
    api(`/finance/credit-documents/${id}/settle`, {
      method: "POST",
      json: body ?? { channel: "phone", notes: "" },
    }),
  openTrustCreditDeal: (body: {
    retailer: string;
    amount_irr?: number;
    weight_grams?: number;
    due_date?: string;
    origin_channel?: string;
    notes?: string;
  }) => api("/finance/credit-documents", { method: "POST", json: body }),
  trustMeta: () =>
    api<{
      settlement_channels: { id: string; label_fa: string }[];
      trust_tiers: { id: string; label_fa: string }[];
    }>("/finance/trust-meta"),
  financeSummary: () => api<Record<string, unknown>>("/finance/summary"),
  inviteUser: (body: Record<string, unknown>) =>
    api<ApiUser & { temporary_password?: string | null }>("/users/invite", {
      method: "POST",
      json: body,
    }),
  updateUser: (id: string, body: Record<string, unknown>) =>
    api<ApiUser>(`/users/${id}`, { method: "PATCH", json: body }),
  setUserStatus: (id: string, status: string) =>
    api(`/users/${id}/status`, { method: "POST", json: { status } }),
  listUsers: () => api<ApiUser[]>("/users"),
  createOrder: (body: Record<string, unknown>) =>
    api("/commerce/orders", { method: "POST", json: body }),
  listParties: (kind?: string, includeArchived?: boolean) => {
    const q = new URLSearchParams();
    if (kind) q.set("kind", kind);
    if (includeArchived) q.set("include_archived", "true");
    const qs = q.toString();
    return api(`/network/parties${qs ? `?${qs}` : ""}`);
  },
  listPartyTypes: () => api("/network/party-types"),
  entityProfileSpec: () => api("/network/entity-profile-spec"),
  getParty: (id: string) => api(`/network/parties/${id}`),
  createParty: (body: Record<string, unknown>) =>
    api("/network/parties", { method: "POST", json: body }),
  updateParty: (id: string, body: Record<string, unknown>) =>
    api(`/network/parties/${id}`, { method: "PATCH", json: body }),
  archiveParty: (id: string) =>
    api(`/network/parties/${id}/archive`, { method: "POST" }),
  restoreParty: (id: string) =>
    api(`/network/parties/${id}/restore`, { method: "POST" }),
  listPartyMembers: (id: string) => api(`/network/parties/${id}/members`),
  assignPartyMember: (id: string, body: { user_id: string; title?: string }) =>
    api(`/network/parties/${id}/members`, { method: "POST", json: body }),
  unassignPartyMember: (membershipId: string) =>
    api(`/network/memberships/${membershipId}/unassign`, { method: "POST" }),
  myWorkspaceContexts: () =>
    api<
      {
        party_id: string;
        party_name: string;
        kind: string;
        kind_label: string;
        title: string;
        source: string;
      }[]
    >("/network/me/contexts"),
  listNetworkRoles: () => api("/network/roles"),
  createNetworkRole: (body: {
    code: string;
    label_fa: string;
    description?: string;
    permissions?: string[];
  }) => api("/network/roles", { method: "POST", json: body }),
  archiveNetworkRole: (id: string) =>
    api(`/network/roles/${id}/archive`, { method: "POST" }),
  listNetworkPeople: () => api("/network/people"),
  grantNetworkRole: (body: { user_id: string; role_code: string }) =>
    api("/network/role-grants", { method: "POST", json: body }),
  revokeNetworkRole: (grantId: string) =>
    api(`/network/role-grants/${grantId}/revoke`, { method: "POST" }),
  listAllocations: (status?: string) =>
    api(
      status
        ? `/inventory/allocations?status=${encodeURIComponent(status)}`
        : "/inventory/allocations",
    ),
  allocateUid: (uid: string, body?: { proforma_id?: string; order_id?: string }) =>
    api("/inventory/allocations", {
      method: "POST",
      json: { uid, ...body },
    }),
  releaseAllocation: (id: string) =>
    api(`/inventory/allocations/${id}/release`, { method: "POST" }),
  lookupWarranty: (uid: string) =>
    api<{
      uid: string;
      name: string;
      active: boolean;
      open_claims: number;
      message: string;
    }>(`/service/warranty/${encodeURIComponent(uid)}`),
  openWarrantyClaim: (uid: string, notes?: string) =>
    api("/service/claims", {
      method: "POST",
      json: { uid, notes: notes ?? "" },
    }),
  listServiceCases: (kind?: string) =>
    api(
      kind
        ? `/service/cases?kind=${encodeURIComponent(kind)}`
        : "/service/cases",
    ),
  openServiceCase: (body: {
    uid: string;
    kind: string;
    notes?: string;
    amount_irr?: number;
  }) => api("/service/cases", { method: "POST", json: body }),
  closeServiceCase: (id: string) =>
    api(`/service/cases/${id}/close`, { method: "POST" }),
  buybackQuote: (uid: string) =>
    api<{
      uid: string;
      name: string;
      weight_grams: number;
      karat: number;
      craft_fee_pct: number;
      rate_per_gram: number;
      metal_irr: number;
      craft_irr: number;
      offer_irr: number;
      note: string;
    }>(`/service/buyback-quote/${encodeURIComponent(uid)}`),
  listCustody: () => api("/inventory/custody"),
  transferCustody: (body: {
    uid: string;
    to_custodian: string;
    to_location: string;
  }) => api("/inventory/custody", { method: "POST", json: body }),
  listDiscrepancies: (status?: string) =>
    api(
      status
        ? `/inventory/discrepancies?status=${encodeURIComponent(status)}`
        : "/inventory/discrepancies",
    ),
  openDiscrepancy: (body: {
    uid: string;
    measured_weight: number;
    reason?: string;
  }) => api("/inventory/discrepancies", { method: "POST", json: body }),
  resolveDiscrepancy: (
    id: string,
    body: {
      resolution?: string;
      notes?: string;
      accept_measured?: boolean;
    },
  ) =>
    api(`/inventory/discrepancies/${id}/resolve`, {
      method: "POST",
      json: body,
    }),
  listProducerSettlements: () =>
    api("/finance/producer-settlements"),
  createProducerSettlement: (body: {
    producer: string;
    weight_grams: number;
    amount_irr: number;
    period_label?: string;
  }) =>
    api("/finance/producer-settlements", {
      method: "POST",
      json: body,
    }),
  producerSettlementQuote: (weightGrams: number) =>
    api<{ weight_grams: number; amount_irr: number; note: string }>(
      `/finance/producer-settlement-quote?weight_grams=${encodeURIComponent(String(weightGrams))}`,
    ),
  settleProducerSettlement: (id: string) =>
    api(`/finance/producer-settlements/${id}/settle`, {
      method: "POST",
    }),
  listCollections: () => api("/product/collections"),
  createCollection: (name: string, description?: string) =>
    api("/product/collections", {
      method: "POST",
      json: { name, description: description ?? "" },
    }),
  listPromotions: () => api("/commerce/promotions"),
  createPromotion: (body: {
    name: string;
    discount_pct?: number;
    collection?: string;
    active?: boolean;
  }) => api("/commerce/promotions", { method: "POST", json: body }),
  listContacts: () => api("/relationship/contacts"),
  createContact: (body: {
    name: string;
    phone?: string;
    email?: string;
    party_org_id?: string | null;
    role_label?: string;
    notes?: string;
  }) => api("/relationship/contacts", { method: "POST", json: body }),
  listCampaigns: () => api("/relationship/campaigns"),
  createCampaign: (body: {
    name: string;
    channel?: string;
    status?: string;
    trigger_event?: string | null;
  }) => api("/relationship/campaigns", { method: "POST", json: body }),
  activateCampaign: (id: string) =>
    api(`/relationship/campaigns/${id}/activate`, { method: "POST" }),
  pauseCampaign: (id: string) =>
    api(`/relationship/campaigns/${id}/pause`, { method: "POST" }),
  relationshipStatus: () => api("/relationship/status"),
  intelligenceAnalytics: () =>
    api<{
      total_events: number;
      by_type: { event_type: string; count: number }[];
      by_aggregate: { aggregate_type: string; count: number }[];
      signals: Record<string, number>;
      recommendations: string[];
      recent: {
        id: number;
        event_type: string;
        aggregate_type: string;
        aggregate_id: string;
        actor: string;
        role: string;
        created_at: string | null;
      }[];
    }>("/intelligence/analytics"),
  reseed: () => api("/admin/reseed", { method: "POST" }),
};
