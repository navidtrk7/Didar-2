export type RoleId =
  | "admin"
  | "qc"
  | "warehouse"
  | "pricing"
  | "agent"
  | "retailer"
  | "finance"
  | "customer"
  | "producer";

export type AssetStatus =
  | "pending_qc"
  | "awaiting_uid"
  | "available"
  | "reserved"
  | "in_transit"
  | "delivered"
  | "qc_hold"
  | "discrepancy"
  | "buyback"
  | "returned"
  | "secondary";

export type OrderStatus =
  | "draft"
  | "submitted"
  | "confirmed"
  | "picking"
  | "shipped"
  | "delivered"
  | "cancelled";

export type DeliveryStatus =
  | "scheduled"
  | "picking"
  | "packing"
  | "handover"
  | "en_route"
  | "awaiting_otp"
  | "completed"
  | "failed";

export type SkuStatus = "draft" | "awaiting_qc" | "needs_rework" | "approved";

export type QcResult = "pass" | "fail" | "rework";

export type CraftFeeMethod = "percent" | "fixed_per_gram";

export type RateRequestStatus = "pending" | "approved" | "rejected";

export type ProformaStatus = "draft" | "issued" | "expired" | "cancelled";

export interface Role {
  id: RoleId;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  accent: string;
}

export interface User {
  id: string;
  name: string;
  /** نام کاربری برای ورود */
  username: string;
  email: string;
  /** رمز ورود */
  password: string;
  /** Primary account role */
  role: RoleId;
  /** Primary + active grants (for multi-hat) */
  roles?: RoleId[];
  org: string;
  status: "active" | "invited" | "suspended";
  lastActive: string;
  avatarHue: number;
}

export interface Asset {
  id: string;
  uid: string;
  name: string;
  slug: string;
  category: "ring" | "necklace" | "bracelet" | "earring" | "bar" | "coin" | "plaque";
  collection?: string;
  karat: 18 | 21 | 22 | 24;
  weightGrams: number;
  craftFee: number;
  status: AssetStatus;
  producer: string;
  location: string;
  custodian: string;
  imageTone: string;
  /** مسیر تصویر محلی از didargold.com */
  imageUrl: string;
  description?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  code: string;
  retailer: string;
  items: number;
  totalWeight: number;
  value: number;
  status: OrderStatus;
  createdAt: string;
  eta: string;
}

export interface InventoryRow {
  id: string;
  location: string;
  type: "vault" | "branch" | "mobile" | "workshop";
  pieces: number;
  weightGrams: number;
  reservedGrams: number;
  availableGrams: number;
  utilization: number;
}

export interface Delivery {
  id: string;
  code: string;
  agent: string;
  from: string;
  to: string;
  pieces: number;
  weightGrams: number;
  status: DeliveryStatus;
  otpRequired: boolean;
  scheduledAt: string;
}

export interface LedgerEvent {
  id: string;
  type: "weight" | "custody" | "order" | "financial" | "qc";
  title: string;
  detail: string;
  actor: string;
  weightDelta?: number;
  amountDelta?: number;
  timestamp: string;
  irreversible: true;
}

export interface Design {
  id: string;
  name: string;
  producer: string;
  karat: number;
  avgWeight: number;
  capacityWeekly: number;
  booked: number;
  status: "live" | "review" | "paused";
}

export interface SkuItem {
  id: string;
  name: string;
  category: Asset["category"];
  skuCode: string;
  karat: 18 | 21 | 22 | 24;
  catalogWeight: number;
  status: SkuStatus;
  collection: string;
  imageUrl: string;
  createdAt: string;
}

export interface QcInspection {
  id: string;
  skuId: string;
  physicalCode: string;
  measuredWeight?: number;
  result?: QcResult;
  notes?: string;
  inspectedAt?: string;
  inspector?: string;
}

export interface CraftFeeRule {
  id: string;
  name: string;
  category: Asset["category"] | "bar";
  method: CraftFeeMethod;
  value: number;
  active: boolean;
  collection?: string;
}

export interface RateRequest {
  id: string;
  currentRate: number;
  proposedRate: number;
  reason: string;
  status: RateRequestStatus;
  requestedBy: string;
  createdAt: string;
  validUntil: string;
}

export interface CreditAccount {
  id: string;
  retailer: string;
  ceilingGrams: number;
  usedGrams: number;
  ceilingIrr: number;
  usedIrr: number;
  overdueGrams: number;
  blocked: boolean;
}

export type SettlementChannel = "verbal" | "phone" | "cash" | "transfer";

export interface CreditDocument {
  id: string;
  code: string;
  retailer: string;
  amountIrr: number;
  weightGrams: number;
  dueDate: string;
  overdueDays: number;
  status: "open" | "overdue" | "settled";
  settlementChannel?: SettlementChannel | string | null;
  settlementNotes?: string;
  settledAt?: string | null;
  originChannel?: SettlementChannel | string | null;
}

export interface ProformaLine {
  uid: string;
  name: string;
  weightGrams: number;
  craftFeePct: number;
}

export interface IssuedUidAsset {
  id: string;
  skuId: string;
  uid: string;
  name: string;
  category: Asset["category"];
  karat: 18 | 21 | 22 | 24;
  weightGrams: number;
  craftFeePct: number;
  imageUrl: string;
  location: string;
  issuedAt: string;
  /** Present when loaded from API */
  status?: AssetStatus;
}

export interface Proforma {
  id: string;
  code: string;
  retailer: string;
  agent: string;
  lines: ProformaLine[];
  ratePerGram: number;
  lockExpiresAt: number | null;
  status: ProformaStatus;
  createdAt: string;
  totalIrr: number;
}

export interface DualLedgerEntry {
  id: string;
  docCode: string;
  entity: string;
  warehouse: string;
  weightDebit: number;
  weightCredit: number;
  irrDebit: number;
  irrCredit: number;
  kind: "receipt" | "sale" | "transfer" | "adjustment";
  locked: true;
  date: string;
}

export interface AdjustmentDoc {
  id: string;
  code: string;
  reason: string;
  weightDelta: number;
  irrDelta: number;
  createdBy: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  module: string;
  actor: string;
  role: string;
  action: string;
  entity: string;
  ip: string;
  status: "ok" | "error";
  timestamp: string;
}

export interface SystemSettings {
  weightToleranceGrams: number;
  priceLockMinutes: number;
  proformaTtlMinutes: number;
  defaultKarat: 18 | 21 | 24;
  rateSource: "tgju" | "cbi" | "manual";
  currency: "IRT" | "IRR";
}

export type PermissionKey =
  | "sku_create"
  | "qc_approve"
  | "uid_issue"
  | "manual_rate"
  | "view_ledger"
  | "view_catalog"
  | "issue_proforma"
  | "manage_credit";
