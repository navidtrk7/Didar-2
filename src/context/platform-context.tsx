"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { LIVE_GOLD, assets as assetsSeed, deliveries as deliveriesSeed, inventory as inventorySeed, orders as ordersSeed } from "@/data/mock";
import {
  adjustmentsSeed,
  auditEventsSeed,
  craftFeeRulesSeed,
  creditAccountsSeed,
  creditDocumentsSeed,
  dualLedgerSeed,
  proformaTotal,
  proformasSeed,
  qcQueueSeed,
  rateRequestsSeed,
  skuItemsSeed,
  systemSettingsSeed,
} from "@/data/platform";
import type {
  AdjustmentDoc,
  Asset,
  AuditEvent,
  CraftFeeRule,
  CreditAccount,
  CreditDocument,
  Delivery,
  DualLedgerEntry,
  InventoryRow,
  IssuedUidAsset,
  Order,
  Proforma,
  ProformaLine,
  QcInspection,
  QcResult,
  RateRequest,
  SkuItem,
  SystemSettings,
} from "@/data/types";
import { apiEnabled, apiRequired, didarApi, type ApiPlatform } from "@/lib/api";

const STORAGE_KEY = "didar.platform.v2";

export type PlatformState = {
  skus: SkuItem[];
  qcQueue: QcInspection[];
  issuedAssets: IssuedUidAsset[];
  proformas: Proforma[];
  rateRequests: RateRequest[];
  craftRules: CraftFeeRule[];
  auditEvents: AuditEvent[];
  dualLedger: DualLedgerEntry[];
  creditAccounts: CreditAccount[];
  creditDocuments: CreditDocument[];
  adjustments: AdjustmentDoc[];
  deliveries: Delivery[];
  orders: Order[];
  inventory: InventoryRow[];
  assets: Asset[];
  liveGoldPrice: number;
  settings: SystemSettings;
};

function nowStamp() {
  const d = new Date();
  return `امروز ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function pushAudit(
  prev: PlatformState,
  partial: Omit<AuditEvent, "id" | "timestamp" | "ip" | "status"> & {
    status?: AuditEvent["status"];
    ip?: string;
  },
): PlatformState {
  return {
    ...prev,
    auditEvents: [
      {
        id: `ae-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: nowStamp(),
        ip: partial.ip ?? "10.0.12.10",
        status: partial.status ?? "ok",
        module: partial.module,
        actor: partial.actor,
        role: partial.role,
        action: partial.action,
        entity: partial.entity,
      },
      ...prev.auditEvents,
    ].slice(0, 80),
  };
}

const defaultState = (): PlatformState => ({
  skus: skuItemsSeed,
  qcQueue: qcQueueSeed,
  issuedAssets: [],
  proformas: proformasSeed,
  rateRequests: rateRequestsSeed,
  craftRules: craftFeeRulesSeed,
  auditEvents: auditEventsSeed,
  dualLedger: dualLedgerSeed,
  creditAccounts: creditAccountsSeed,
  creditDocuments: creditDocumentsSeed,
  adjustments: adjustmentsSeed,
  deliveries: deliveriesSeed,
  orders: ordersSeed,
  inventory: inventorySeed,
  assets: assetsSeed,
  liveGoldPrice: LIVE_GOLD.pricePerGram,
  settings: systemSettingsSeed,
});

/** Empty shell when API is required but unreachable — never show mock as live. */
const emptyState = (): PlatformState => ({
  skus: [],
  qcQueue: [],
  issuedAssets: [],
  proformas: [],
  rateRequests: [],
  craftRules: [],
  auditEvents: [],
  dualLedger: [],
  creditAccounts: [],
  creditDocuments: [],
  adjustments: [],
  deliveries: [],
  orders: [],
  inventory: [],
  assets: [],
  liveGoldPrice: 0,
  settings: systemSettingsSeed,
});

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : v == null ? fallback : String(v);
}

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : Number(v) || fallback;
}

function bool(v: unknown, fallback = false): boolean {
  return typeof v === "boolean" ? v : fallback;
}

function mapSettings(s: ApiPlatform["settings"]): SystemSettings {
  return {
    weightToleranceGrams: s.weight_tolerance_grams,
    priceLockMinutes: s.price_lock_minutes,
    proformaTtlMinutes: s.proforma_ttl_minutes,
    defaultKarat: s.default_karat as SystemSettings["defaultKarat"],
    rateSource: s.rate_source as SystemSettings["rateSource"],
    currency: s.currency as SystemSettings["currency"],
  };
}

function mapAssetRow(a: Record<string, unknown>, ratePerGram: number): Asset {
  const uid = str(a.uid);
  const rate = ratePerGram > 0 ? ratePerGram : LIVE_GOLD.pricePerGram;
  return {
    id: str(a.id),
    uid,
    name: str(a.name),
    slug: str(a.sku_id, uid.toLowerCase()),
    category: str(a.category, "ring") as Asset["category"],
    collection: a.collection ? str(a.collection) : undefined,
    karat: num(a.karat, 18) as Asset["karat"],
    weightGrams: num(a.weight_grams),
    craftFee: Math.round(
      num(a.weight_grams) * rate * (num(a.craft_fee_pct, 15) / 100),
    ),
    status: str(a.status, "available") as Asset["status"],
    producer: str(a.producer, "خانه ساخت دیدار گلد"),
    location: str(a.location),
    custodian: str(a.custodian, ""),
    imageTone: "#041E42",
    imageUrl: str(a.image_url, "/products/product-01.jpg"),
    description: a.description ? str(a.description) : undefined,
    createdAt: str(a.issued_at, "—"),
  };
}

function mapApiToState(data: ApiPlatform): PlatformState {
  return {
    skus: data.skus.map((s) => ({
      id: str(s.id),
      name: str(s.name),
      category: str(s.category) as SkuItem["category"],
      skuCode: str(s.sku_code),
      karat: num(s.karat, 18) as SkuItem["karat"],
      catalogWeight: num(s.catalog_weight),
      status: str(s.status) as SkuItem["status"],
      collection: str(s.collection),
      imageUrl: str(s.image_url),
      createdAt: str(s.created_at),
    })),
    qcQueue: data.qc_queue.map((q) => ({
      id: str(q.id),
      skuId: str(q.sku_id),
      physicalCode: str(q.physical_code),
      measuredWeight:
        q.measured_weight == null ? undefined : num(q.measured_weight),
      result: (q.result as QcResult | undefined) ?? undefined,
      notes: q.notes == null ? undefined : str(q.notes),
      inspectedAt: q.inspected_at == null ? undefined : str(q.inspected_at),
      inspector: q.inspector == null ? undefined : str(q.inspector),
    })),
    issuedAssets: data.issued_assets.map((a) => ({
      id: str(a.id),
      skuId: str(a.sku_id ?? ""),
      uid: str(a.uid),
      name: str(a.name),
      category: str(a.category) as IssuedUidAsset["category"],
      karat: num(a.karat, 18) as IssuedUidAsset["karat"],
      weightGrams: num(a.weight_grams),
      craftFeePct: num(a.craft_fee_pct, 15),
      imageUrl: str(a.image_url),
      location: str(a.location),
      issuedAt: str(a.issued_at ?? ""),
      status: a.status
        ? (str(a.status) as IssuedUidAsset["status"])
        : undefined,
    })),
    proformas: data.proformas.map((p) => {
      const lines = (Array.isArray(p.lines) ? p.lines : []) as Record<
        string,
        unknown
      >[];
      return {
        id: str(p.id),
        code: str(p.code),
        retailer: str(p.retailer),
        agent: str(p.agent),
        lines: lines.map((l) => ({
          uid: str(l.uid),
          name: str(l.name),
          weightGrams: num(l.weight_grams),
          craftFeePct: num(l.craft_fee_pct),
        })),
        ratePerGram: num(p.rate_per_gram),
        lockExpiresAt: p.lock_expires_at
          ? Date.parse(str(p.lock_expires_at))
          : null,
        status: str(p.status) as Proforma["status"],
        createdAt: str(p.created_at),
        totalIrr: num(p.total_irr),
      };
    }),
    rateRequests: data.rate_requests.map((r) => ({
      id: str(r.id),
      currentRate: num(r.current_rate),
      proposedRate: num(r.proposed_rate),
      reason: str(r.reason),
      status: str(r.status) as RateRequest["status"],
      requestedBy: str(r.requested_by),
      createdAt: str(r.created_at),
      validUntil: str(r.valid_until),
    })),
    craftRules: data.craft_rules.map((c) => ({
      id: str(c.id),
      name: str(c.name),
      category: str(c.category) as CraftFeeRule["category"],
      method: str(c.method) as CraftFeeRule["method"],
      value: num(c.value),
      active: bool(c.active, true),
      collection: c.collection ? str(c.collection) : undefined,
    })),
    auditEvents: data.audit_events.map((a) => ({
      id: str(a.id),
      module: str(a.module),
      actor: str(a.actor),
      role: str(a.role),
      action: str(a.action),
      entity: str(a.entity),
      ip: str(a.ip),
      status: str(a.status) as AuditEvent["status"],
      timestamp: str(a.timestamp),
    })),
    dualLedger: data.dual_ledger.map((e) => ({
      id: str(e.id),
      docCode: str(e.doc_code),
      entity: str(e.entity),
      warehouse: str(e.warehouse),
      weightDebit: num(e.weight_debit),
      weightCredit: num(e.weight_credit),
      irrDebit: num(e.irr_debit),
      irrCredit: num(e.irr_credit),
      kind: str(e.kind) as DualLedgerEntry["kind"],
      locked: true as const,
      date: str(e.date),
    })),
    creditAccounts: data.credit_accounts.map((c) => ({
      id: c.id,
      retailer: c.retailer,
      ceilingGrams: c.ceiling_grams,
      usedGrams: c.used_grams,
      ceilingIrr: c.ceiling_irr,
      usedIrr: c.used_irr,
      overdueGrams: c.overdue_grams,
      blocked: c.blocked,
    })),
    creditDocuments: data.credit_documents.map((d) => ({
      id: d.id,
      code: d.code,
      retailer: d.retailer,
      amountIrr: d.amount_irr,
      weightGrams: d.weight_grams,
      dueDate: d.due_date,
      overdueDays: d.overdue_days,
      status: d.status as CreditDocument["status"],
      settlementChannel: d.settlement_channel ?? null,
      settlementNotes: d.settlement_notes ?? "",
      settledAt: d.settled_at ?? null,
      originChannel: d.origin_channel ?? null,
    })),
    adjustments: data.adjustments.map((a) => ({
      id: str(a.id),
      code: str(a.code),
      reason: str(a.reason),
      weightDelta: num(a.weight_delta),
      irrDelta: num(a.irr_delta),
      createdBy: str(a.created_by),
      createdAt: str(a.created_at),
    })),
    deliveries: data.deliveries.map((d) => ({
      id: str(d.id),
      code: str(d.code),
      agent: str(d.agent),
      from: str(d.from_location ?? d.from),
      to: str(d.to_location ?? d.to),
      pieces: num(d.pieces),
      weightGrams: num(d.weight_grams),
      status: str(d.status) as Delivery["status"],
      otpRequired: bool(d.otp_required, false),
      scheduledAt: str(d.scheduled_at),
    })),
    orders: data.orders.map((o) => ({
      id: str(o.id),
      code: str(o.code),
      retailer: str(o.retailer),
      items: num(o.items),
      totalWeight: num(o.total_weight),
      value: num(o.value),
      status: str(o.status) as Order["status"],
      createdAt: str(o.created_at),
      eta: str(o.eta),
    })),
    inventory: data.inventory.map((i) => ({
      id: str(i.id),
      location: str(i.location),
      type: str(i.type) as InventoryRow["type"],
      pieces: num(i.pieces),
      weightGrams: num(i.weight_grams),
      reservedGrams: num(i.reserved_grams),
      availableGrams: num(i.available_grams),
      utilization: num(i.utilization),
    })),
    assets: data.assets.map((a) =>
      mapAssetRow(a, num(data.live_gold?.price_per_gram)),
    ),
    liveGoldPrice: data.live_gold.price_per_gram,
    settings: mapSettings(data.settings),
  };
}

/* ——— localStorage demo store (when API is off) ——— */

let memory: PlatformState | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function read(): PlatformState {
  if (memory) return memory;
  if (typeof window === "undefined") return defaultState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      memory = defaultState();
      return memory;
    }
    const parsed = JSON.parse(raw) as Partial<PlatformState>;
    memory = {
      ...defaultState(),
      ...parsed,
      skus: parsed.skus?.length ? parsed.skus : skuItemsSeed,
      qcQueue: parsed.qcQueue?.length ? parsed.qcQueue : qcQueueSeed,
      auditEvents: parsed.auditEvents?.length
        ? parsed.auditEvents
        : auditEventsSeed,
      dualLedger: parsed.dualLedger?.length
        ? parsed.dualLedger
        : dualLedgerSeed,
      creditAccounts: parsed.creditAccounts?.length
        ? parsed.creditAccounts
        : creditAccountsSeed,
      creditDocuments: parsed.creditDocuments?.length
        ? parsed.creditDocuments
        : creditDocumentsSeed,
      adjustments: parsed.adjustments?.length
        ? parsed.adjustments
        : adjustmentsSeed,
      deliveries: parsed.deliveries?.length
        ? parsed.deliveries
        : deliveriesSeed,
      orders: parsed.orders?.length ? parsed.orders : ordersSeed,
      inventory: parsed.inventory?.length ? parsed.inventory : inventorySeed,
      assets: parsed.assets?.length ? parsed.assets : assetsSeed,
      liveGoldPrice: parsed.liveGoldPrice ?? LIVE_GOLD.pricePerGram,
      settings: parsed.settings
        ? { ...systemSettingsSeed, ...parsed.settings }
        : systemSettingsSeed,
    };
    return memory;
  } catch {
    memory = defaultState();
    return memory;
  }
}

function write(next: PlatformState) {
  memory = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

type PlatformApi = PlatformState & {
  ready: boolean;
  apiMode: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addSku: (
    sku: Omit<SkuItem, "id" | "createdAt" | "status"> & {
      status?: SkuItem["status"];
    },
  ) => string | void;
  sendSkuToQc: (skuId: string) => Promise<void>;
  createOrder: (input: {
    retailer: string;
    items: number;
    totalWeight: number;
    value: number;
    uids?: string[];
  }) => Promise<void>;
  completeQc: (input: {
    inspectionId: string;
    measuredWeight: number;
    result: QcResult;
    inspector: string;
  }) => Promise<void>;
  issueUid: (skuId: string) => Promise<string | null>;
  createPriceLock: (input: {
    retailer: string;
    agent: string;
  }) => Promise<{ id: string; expiresAt: number; ratePerGram: number } | null>;
  addProforma: (input: {
    retailer: string;
    agent: string;
    lines: ProformaLine[];
    ratePerGram?: number;
    lockId?: string;
  }) => Promise<Proforma | null>;
  decideRateRequest: (
    id: string,
    status: "approved" | "rejected",
  ) => Promise<void>;
  addRateRequest: (
    input: Omit<RateRequest, "id" | "createdAt" | "status">,
  ) => void;
  toggleCraftRule: (id: string) => Promise<void>;
  addCraftRule: (rule: Omit<CraftFeeRule, "id">) => void;
  createAdjustment: (input: {
    reason: string;
    weightDelta: number;
    irrDelta: number;
  }) => Promise<void>;
  resetPlatform: () => void;
};

const PlatformContext = createContext<PlatformApi | null>(null);

function LocalPlatformProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, read, defaultState);

  const patch = useCallback((fn: (prev: PlatformState) => PlatformState) => {
    write(fn(read()));
  }, []);

  const addSku = useCallback(
    (
      sku: Omit<SkuItem, "id" | "createdAt" | "status"> & {
        status?: SkuItem["status"];
      },
    ) => {
      const id = `sku-${Date.now()}`;
      patch((prev) => {
        const next = {
          ...prev,
          skus: [
            {
              ...sku,
              id,
              status: sku.status ?? "draft",
              createdAt: "امروز",
            },
            ...prev.skus,
          ],
        };
        return pushAudit(next, {
          module: "کاتالوگ",
          actor: "مریم کاظمی",
          role: "عملیات کاتالوگ و QC",
          action: "ایجاد SKU",
          entity: sku.skuCode,
        });
      });
      return id;
    },
    [patch],
  );

  const sendSkuToQc = useCallback(
    async (skuId: string) => {
      patch((prev) => {
        const sku = prev.skus.find((s) => s.id === skuId);
        if (!sku || sku.status !== "draft") return prev;
        const physicalCode = `PHY-${String(8000 + prev.qcQueue.length).padStart(4, "0")}-X`;
        const next = {
          ...prev,
          skus: prev.skus.map((s) =>
            s.id === skuId ? { ...s, status: "awaiting_qc" as const } : s,
          ),
          qcQueue: [
            { id: `qc-${Date.now()}`, skuId, physicalCode },
            ...prev.qcQueue,
          ],
        };
        return pushAudit(next, {
          module: "کنترل کیفیت",
          actor: "مریم کاظمی",
          role: "عملیات کاتالوگ و QC",
          action: "ارسال به صف QC",
          entity: physicalCode,
        });
      });
    },
    [patch],
  );

  const completeQc = useCallback(
    async (input: {
      inspectionId: string;
      measuredWeight: number;
      result: QcResult;
      inspector: string;
    }) => {
      patch((prev) => {
        const inspection = prev.qcQueue.find((q) => q.id === input.inspectionId);
        if (!inspection) return prev;
        const nextStatus =
          input.result === "pass"
            ? ("approved" as const)
            : input.result === "rework"
              ? ("needs_rework" as const)
              : ("draft" as const);
        let next: PlatformState = {
          ...prev,
          qcQueue: prev.qcQueue.map((q) =>
            q.id === input.inspectionId
              ? {
                  ...q,
                  measuredWeight: input.measuredWeight,
                  result: input.result,
                  inspectedAt: "امروز",
                  inspector: input.inspector,
                }
              : q,
          ),
          skus: prev.skus.map((s) =>
            s.id === inspection.skuId
              ? {
                  ...s,
                  status: nextStatus,
                  catalogWeight:
                    input.result === "pass"
                      ? input.measuredWeight
                      : s.catalogWeight,
                }
              : s,
          ),
        };
        next = pushAudit(next, {
          module: "کنترل کیفیت",
          actor: input.inspector,
          role: "عملیات کاتالوگ و QC",
          action:
            input.result === "pass"
              ? "تایید کیفی"
              : input.result === "rework"
                ? "نیازمند اصلاح"
                : "رد کیفی",
          entity: inspection.physicalCode,
        });
        return next;
      });
    },
    [patch],
  );

  const issueUid = useCallback(
    async (skuId: string) => {
      let uid: string | null = null;
      patch((prev) => {
        const sku = prev.skus.find((s) => s.id === skuId);
        if (!sku || sku.status !== "approved") return prev;
        if (prev.issuedAssets.some((a) => a.skuId === skuId)) return prev;
        uid = `DDR-${sku.karat}K-${sku.skuCode.replace(/[^A-Z0-9]/gi, "").slice(-4).toUpperCase() || "ITEM"}-${String(prev.issuedAssets.length + 1).padStart(3, "0")}`;
        const asset: IssuedUidAsset = {
          id: `iss-${Date.now()}`,
          skuId: sku.id,
          uid,
          name: sku.name,
          category: sku.category,
          karat: sku.karat,
          weightGrams: sku.catalogWeight,
          craftFeePct: 15,
          imageUrl: sku.imageUrl,
          location: "خزانه تهران-الف",
          issuedAt: "امروز",
        };
        const ledgerRow: DualLedgerEntry = {
          id: `dl-${Date.now()}`,
          docCode: `UID-${uid.slice(-6)}`,
          entity: sku.name,
          warehouse: "خزانه مرکزی",
          weightDebit: sku.catalogWeight,
          weightCredit: 0,
          irrDebit: Math.round(sku.catalogWeight * LIVE_GOLD.pricePerGram * 10),
          irrCredit: 0,
          kind: "receipt",
          locked: true,
          date: "۱۴۰۵/۰۵/۱۵",
        };
        let next: PlatformState = {
          ...prev,
          issuedAssets: [asset, ...prev.issuedAssets],
          dualLedger: [ledgerRow, ...prev.dualLedger],
        };
        next = pushAudit(next, {
          module: "انبار",
          actor: "حسین پاکروان",
          role: "مسئول UID و انبار",
          action: "صدور UID",
          entity: uid,
        });
        return next;
      });
      return uid;
    },
    [patch],
  );

  const createPriceLock = useCallback(
    async (_input: { retailer: string; agent: string }) => {
      let minutes = 3;
      try {
        const raw = window.localStorage.getItem("didar.system.settings");
        if (raw) {
          const parsed = JSON.parse(raw) as { priceLockMinutes?: number };
          if (
            typeof parsed.priceLockMinutes === "number" &&
            parsed.priceLockMinutes > 0
          ) {
            minutes = parsed.priceLockMinutes;
          }
        }
      } catch {
        /* keep default */
      }
      const expiresAt = Date.now() + minutes * 60 * 1000;
      return {
        id: `local-lock-${Date.now()}`,
        expiresAt,
        ratePerGram: LIVE_GOLD.pricePerGram,
      };
    },
    [],
  );

  const addProforma = useCallback(
    async (input: {
      retailer: string;
      agent: string;
      lines: ProformaLine[];
      ratePerGram?: number;
      lockId?: string;
    }) => {
      if (!input.lines.length) return null;
      const rate = input.ratePerGram ?? LIVE_GOLD.pricePerGram;
      const totalIrr = proformaTotal(input.lines, rate);
      const totalWeight = input.lines.reduce((s, l) => s + l.weightGrams, 0);
      let created: Proforma | null = null;
      patch((prev) => {
        created = {
          id: `pf-${Date.now()}`,
          code: `PF-1405-${String(prev.proformas.length + 20).padStart(3, "0")}`,
          retailer: input.retailer,
          agent: input.agent,
          lines: input.lines,
          ratePerGram: rate,
          lockExpiresAt: null,
          status: "issued",
          createdAt: "الان",
          totalIrr,
        };
        const ledgerRow: DualLedgerEntry = {
          id: `dl-${Date.now()}`,
          docCode: created.code,
          entity: `پیش‌فاکتور ${input.retailer}`,
          warehouse: "گالری سیار",
          weightDebit: 0,
          weightCredit: totalWeight,
          irrDebit: 0,
          irrCredit: Math.round(totalIrr * 10),
          kind: "sale",
          locked: true,
          date: "۱۴۰۵/۰۵/۱۵",
        };
        let next: PlatformState = {
          ...prev,
          proformas: [created, ...prev.proformas],
          dualLedger: [ledgerRow, ...prev.dualLedger],
        };
        next = pushAudit(next, {
          module: "فروش",
          actor: input.agent,
          role: "ایجنت فروش",
          action: "صدور پیش‌فاکتور",
          entity: created.code,
        });
        return next;
      });
      return created;
    },
    [patch],
  );

  const decideRateRequest = useCallback(
    async (id: string, status: "approved" | "rejected") => {
      patch((prev) => {
        const req = prev.rateRequests.find((r) => r.id === id);
        let next: PlatformState = {
          ...prev,
          rateRequests: prev.rateRequests.map((r) =>
            r.id === id ? { ...r, status } : r,
          ),
        };
        if (req) {
          next = pushAudit(next, {
            module: "قیمت‌گذاری",
            actor: "لیلا فرهادی",
            role: "مدیر کل سیستم",
            action: status === "approved" ? "تأیید نرخ دستی" : "رد نرخ دستی",
            entity: String(req.proposedRate),
          });
        }
        return next;
      });
    },
    [patch],
  );

  const createOrder = useCallback(
    async (input: {
      retailer: string;
      items: number;
      totalWeight: number;
      value: number;
      uids?: string[];
    }) => {
      patch((prev) => {
        const order: Order = {
          id: `ord-${Date.now()}`,
          code: `DG-1405-${String(prev.orders.length + 40).padStart(3, "0")}`,
          retailer: input.retailer,
          items: input.items,
          totalWeight: input.totalWeight,
          value: input.value,
          status: "submitted",
          createdAt: "الان",
          eta: "۲ روز کاری",
        };
        return pushAudit(
          { ...prev, orders: [order, ...prev.orders] },
          {
            module: "فروش",
            actor: input.retailer,
            role: "خرده‌فروش",
            action: input.uids?.length
              ? `ثبت سفارش (${input.uids.join(", ")})`
              : "ثبت سفارش",
            entity: order.code,
          },
        );
      });
    },
    [patch],
  );

  const addRateRequest = useCallback(
    (input: Omit<RateRequest, "id" | "createdAt" | "status">) => {
      patch((prev) => {
        const row: RateRequest = {
          ...input,
          id: `rr-${Date.now()}`,
          status: "pending",
          createdAt: "الان",
        };
        return pushAudit(
          { ...prev, rateRequests: [row, ...prev.rateRequests] },
          {
            module: "قیمت‌گذاری",
            actor: input.requestedBy,
            role: "کارشناس قیمت‌گذاری",
            action: "درخواست تغییر دستی نرخ",
            entity: String(input.proposedRate),
          },
        );
      });
    },
    [patch],
  );

  const toggleCraftRule = useCallback(
    async (id: string) => {
      patch((prev) => ({
        ...prev,
        craftRules: prev.craftRules.map((r) =>
          r.id === id ? { ...r, active: !r.active } : r,
        ),
      }));
    },
    [patch],
  );

  const addCraftRule = useCallback(
    (rule: Omit<CraftFeeRule, "id">) => {
      patch((prev) => ({
        ...prev,
        craftRules: [{ ...rule, id: `cfr-${Date.now()}` }, ...prev.craftRules],
      }));
    },
    [patch],
  );

  const createAdjustment = useCallback(
    async (input: {
      reason: string;
      weightDelta: number;
      irrDelta: number;
    }) => {
      patch((prev) => {
        const doc: AdjustmentDoc = {
          id: `adj-${Date.now()}`,
          code: `ADJ-${String(prev.adjustments.length + 20).padStart(3, "0")}`,
          reason: input.reason,
          weightDelta: input.weightDelta,
          irrDelta: input.irrDelta,
          createdBy: "کامبیز نوری",
          createdAt: "امروز",
        };
        return pushAudit(
          { ...prev, adjustments: [doc, ...prev.adjustments] },
          {
            module: "مالی",
            actor: "کامبیز نوری",
            role: "مدیر مالی",
            action: "ثبت سند تعدیل",
            entity: doc.code,
          },
        );
      });
    },
    [patch],
  );

  const resetPlatform = useCallback(() => {
    write(defaultState());
  }, []);

  const value = useMemo<PlatformApi>(
    () => ({
      ...state,
      ready: true,
      apiMode: false,
      error: null,
      refresh: async () => undefined,
      addSku,
      sendSkuToQc,
      createOrder,
      completeQc,
      issueUid,
      createPriceLock,
      addProforma,
      decideRateRequest,
      addRateRequest,
      toggleCraftRule,
      addCraftRule,
      createAdjustment,
      resetPlatform,
    }),
    [
      state,
      addSku,
      sendSkuToQc,
      createOrder,
      completeQc,
      issueUid,
      createPriceLock,
      addProforma,
      decideRateRequest,
      addRateRequest,
      toggleCraftRule,
      addCraftRule,
      createAdjustment,
      resetPlatform,
    ],
  );

  return (
    <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
  );
}

function ApiPlatformProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlatformState>(emptyState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const data = await didarApi.platform();
    setState(mapApiToState(data));
    setError(null);
    setReady(true);
  }, []);

  useEffect(() => {
    refresh().catch((e: unknown) => {
      setState(emptyState());
      setError(e instanceof Error ? e.message : "API unreachable");
      setReady(true);
    });
  }, [refresh]);

  const withRefresh = useCallback(
    async (fn: () => Promise<unknown>) => {
      try {
        await fn();
        await refresh();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "API error");
        throw e;
      }
    },
    [refresh],
  );

  const addSku = useCallback(
    (
      sku: Omit<SkuItem, "id" | "createdAt" | "status"> & {
        status?: SkuItem["status"];
      },
    ) => {
      void withRefresh(() =>
        didarApi.createSku({
          name: sku.name,
          category: sku.category,
          sku_code: sku.skuCode,
          karat: sku.karat,
          catalog_weight: sku.catalogWeight,
          collection: sku.collection,
          image_url: sku.imageUrl,
          status: sku.status ?? "draft",
        }),
      );
    },
    [withRefresh],
  );

  const sendSkuToQc = useCallback(
    async (skuId: string) => {
      await withRefresh(() => didarApi.sendSkuToQc(skuId));
    },
    [withRefresh],
  );

  const createOrder = useCallback(
    async (input: {
      retailer: string;
      items: number;
      totalWeight: number;
      value: number;
      uids?: string[];
    }) => {
      await withRefresh(() =>
        didarApi.createOrder({
          retailer: input.retailer,
          items: input.items,
          total_weight: input.totalWeight,
          value: input.value,
          uids: input.uids ?? [],
        }),
      );
    },
    [withRefresh],
  );

  const completeQc = useCallback(
    async (input: {
      inspectionId: string;
      measuredWeight: number;
      result: QcResult;
      inspector: string;
    }) => {
      await withRefresh(() =>
        didarApi.completeQc(input.inspectionId, {
          measured_weight: input.measuredWeight,
          result: input.result,
          inspector: input.inspector,
        }),
      );
    },
    [withRefresh],
  );

  const issueUid = useCallback(
    async (skuId: string) => {
      const asset = (await didarApi.issueUid(skuId)) as { uid: string };
      await refresh();
      return asset.uid;
    },
    [refresh],
  );

  const createPriceLock = useCallback(
    async (input: { retailer: string; agent: string }) => {
      const lock = await didarApi.createPriceLock({
        retailer: input.retailer,
        agent: input.agent,
      });
      return {
        id: lock.id,
        expiresAt: Date.parse(lock.expires_at),
        ratePerGram: lock.rate_per_gram,
      };
    },
    [],
  );

  const addProforma = useCallback(
    async (input: {
      retailer: string;
      agent: string;
      lines: ProformaLine[];
      ratePerGram?: number;
      lockId?: string;
    }) => {
      if (!input.lockId) throw new Error("lockId required in API mode");
      const created = (await didarApi.issueProforma({
        retailer: input.retailer,
        agent: input.agent,
        lock_id: input.lockId,
        lines: input.lines.map((l) => ({
          uid: l.uid,
          craft_fee_pct: l.craftFeePct,
        })),
      })) as {
        id: string;
        code: string;
        retailer: string;
        agent: string;
        lines: ProformaLine[];
        rate_per_gram: number;
        status: Proforma["status"];
        created_at: string;
        total_irr: number;
        lock_expires_at?: string | null;
      };
      await refresh();
      return {
        id: created.id,
        code: created.code,
        retailer: created.retailer,
        agent: created.agent,
        lines: input.lines,
        ratePerGram: created.rate_per_gram,
        lockExpiresAt: created.lock_expires_at
          ? Date.parse(created.lock_expires_at)
          : null,
        status: created.status,
        createdAt: created.created_at,
        totalIrr: created.total_irr,
      };
    },
    [refresh],
  );

  const decideRateRequest = useCallback(
    async (id: string, status: "approved" | "rejected") => {
      await withRefresh(() => didarApi.decideRateRequest(id, status));
    },
    [withRefresh],
  );

  const addRateRequest = useCallback(
    (input: Omit<RateRequest, "id" | "createdAt" | "status">) => {
      void withRefresh(() =>
        didarApi.addRateRequest({
          current_rate: input.currentRate,
          proposed_rate: input.proposedRate,
          reason: input.reason,
          requested_by: input.requestedBy,
          valid_until: input.validUntil,
        }),
      );
    },
    [withRefresh],
  );

  const toggleCraftRule = useCallback(
    async (id: string) => {
      await withRefresh(() => didarApi.toggleCraftRule(id));
    },
    [withRefresh],
  );

  const addCraftRule = useCallback(
    (rule: Omit<CraftFeeRule, "id">) => {
      void withRefresh(() =>
        didarApi.addCraftRule({
          name: rule.name,
          category: rule.category,
          method: rule.method,
          value: rule.value,
          active: rule.active,
          collection: rule.collection,
        }),
      );
    },
    [withRefresh],
  );

  const createAdjustment = useCallback(
    async (input: {
      reason: string;
      weightDelta: number;
      irrDelta: number;
    }) => {
      await withRefresh(() =>
        didarApi.createAdjustment({
          reason: input.reason,
          weight_delta: input.weightDelta,
          irr_delta: input.irrDelta,
        }),
      );
    },
    [withRefresh],
  );

  const resetPlatform = useCallback(() => {
    void withRefresh(() => didarApi.reseed());
  }, [withRefresh]);

  const value = useMemo<PlatformApi>(
    () => ({
      ...state,
      ready,
      apiMode: true,
      error,
      refresh,
      addSku,
      sendSkuToQc,
      createOrder,
      completeQc,
      issueUid,
      createPriceLock,
      addProforma,
      decideRateRequest,
      addRateRequest,
      toggleCraftRule,
      addCraftRule,
      createAdjustment,
      resetPlatform,
    }),
    [
      state,
      ready,
      error,
      refresh,
      addSku,
      sendSkuToQc,
      createOrder,
      completeQc,
      issueUid,
      createPriceLock,
      addProforma,
      decideRateRequest,
      addRateRequest,
      toggleCraftRule,
      addCraftRule,
      createAdjustment,
      resetPlatform,
    ],
  );

  return (
    <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
  );
}

function ApiMissingProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    () =>
      ({
        ...emptyState(),
        ready: true,
        apiMode: true,
        error:
          "NEXT_PUBLIC_API_URL تنظیم نشده — حالت آفلاین در محیط تولید غیرفعال است.",
        refresh: async () => undefined,
        addSku: () => undefined,
        sendSkuToQc: async () => undefined,
        createOrder: async () => undefined,
        completeQc: async () => undefined,
        issueUid: async () => null,
        createPriceLock: async () => null,
        addProforma: async () => null,
        decideRateRequest: async () => undefined,
        addRateRequest: () => undefined,
        toggleCraftRule: async () => undefined,
        addCraftRule: () => undefined,
        createAdjustment: async () => undefined,
        resetPlatform: () => undefined,
      }) satisfies PlatformApi,
    [],
  );
  return (
    <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
  );
}

export function PlatformProvider({ children }: { children: ReactNode }) {
  if (apiEnabled()) {
    return <ApiPlatformProvider>{children}</ApiPlatformProvider>;
  }
  if (apiRequired()) {
    return <ApiMissingProvider>{children}</ApiMissingProvider>;
  }
  return <LocalPlatformProvider>{children}</LocalPlatformProvider>;
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatform must be used within PlatformProvider");
  return ctx;
}
