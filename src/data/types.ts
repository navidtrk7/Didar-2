export type RoleId =
  | "admin"
  | "qc"
  | "warehouse"
  | "pricing"
  | "agent"
  | "retailer"
  | "finance"
  | "customer"
  | "producer"
  | "supplier"
  | "courier";

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

// ==========================================
// DIDAR PLATFORM — ENTITY PROFILE SPECIFICATION
// ==========================================

export type EntityCategory =
  | "retailer"
  | "store"
  | "retailer_user"
  | "producer"
  | "producer_user"
  | "supplier"
  | "service_partner"
  | "partner_user"
  | "agent"
  | "courier"
  | "end_customer"
  | "internal_user";

/** ۱. Retailer / Business Account (حساب کسب‌وکار خرده‌فروش) */
export interface RetailerAccount {
  id: string;
  // Mandatory
  storeName: string;
  managerName: string;
  mobile: string;
  city: string;
  address: string;
  businessType: "boutique" | "gallery" | "wholesaler" | "chain";
  // Activation
  verificationStatus: "pending" | "approved" | "rejected" | "needs_docs";
  cooperationStatus: "active" | "trial" | "suspended" | "blocked";
  primaryStoreId?: string;
  customerGroup: "gold_tier" | "standard" | "vip";
  licenseNumber?: string;
  // System Generated
  totalPurchaseIrr: number;
  totalPurchaseGrams: number;
  lastOrderDate?: string;
  averageOrderValueIrr: number;
  purchaseFrequency: string;
  returnRate: number;
  performanceScore: number;
  createdAt: string;
}

/** ۲. Store / Branch (شعبه مستقل زیرمجموعه خرده‌فروش) */
export interface StoreBranch {
  id: string;
  retailerId: string;
  branchCode: string;
  branchName: string;
  city: string;
  address: string;
  status: "active" | "inactive" | "renovating";
  // Activation
  mainContact: string;
  mobile: string;
  deliveryAddress: string;
  // System Generated
  orderVolumeGrams: number;
  lastOrderDate?: string;
  lastDeliveryDate?: string;
  performanceRating: number;
  demandPattern: string;
}

/** ۳. Retailer User (کاربر متصل به خرده‌فروشی) */
export interface RetailerUser {
  id: string;
  retailerId: string;
  name: string;
  mobile: string;
  email?: string;
  status: "active" | "invited" | "suspended";
  // Activation
  role: "owner" | "manager" | "buyer" | "accountant";
  permissions: string[];
  storeAccess: string[]; // Store IDs
  // System Generated
  lastLogin?: string;
  activityHistory?: string[];
  ordersCreatedCount: number;
  ordersApprovedCount: number;
}

/** ۴. Producer / Manufacturer (تولیدکننده و کارگاه طلا) */
export interface ProducerAccount {
  id: string;
  // Mandatory
  brandName: string;
  managerName: string;
  mobile: string;
  city: string;
  productionLocation: string;
  status: "active" | "pending_audit" | "paused";
  // Activation
  verificationStatus: "verified" | "unverified";
  productCategories: string[];
  // System Generated
  productionVolumeGrams: number;
  onTimeDeliveryRate: number;
  averageLeadTimeDays: number;
  qualityPerformanceScore: number;
  discrepancyRate: number;
}

/** ۵. Producer User (کاربر متصل به تولیدکننده) */
export interface ProducerUser {
  id: string;
  producerId: string;
  name: string;
  mobile: string;
  email?: string;
  status: "active" | "invited" | "suspended";
  role: "workshop_manager" | "master_artisan" | "production_planner";
  permissions: string[];
  lastLogin?: string;
  actionsCount: number;
}

/** ۶. Supplier / Business Partner (تامین‌کننده فلزات و سنگ) */
export interface SupplierAccount {
  id: string;
  businessName: string;
  supplierType: "raw_gold" | "bullion" | "alloys" | "stones" | "findings";
  managerName: string;
  mobile: string;
  status: "active" | "suspended";
  // Activation
  address: string;
  verificationStatus: "verified" | "pending";
  supplierCategory: string;
  // System Generated
  purchaseHistoryGrams: number;
  deliveryPerformance: number;
  qualityPerformance: number;
  discrepancyRate: number;
}

/** ۷. Service / Delivery Partner (شرکت همکار لجستیک و خدمات) */
export interface ServicePartner {
  id: string;
  companyName: string;
  serviceType: "secure_courier" | "transit_armored" | "assaying" | "insurance";
  managerName: string;
  mobile: string;
  status: "active" | "inactive";
  // Activation
  address: string;
  verificationStatus: "verified" | "pending";
  coverageArea: string[];
  // System Generated
  totalOperations: number;
  deliveryPerformance: number;
  failedOperations: number;
  incidentHistoryCount: number;
}

/** ۸. Partner User (کاربر شرکت همکار/خدمات) */
export interface PartnerUser {
  id: string;
  partnerId: string;
  name: string;
  mobile: string;
  status: "active" | "invited" | "suspended";
  role: "dispatcher" | "operations_lead" | "agent";
  permissions: string[];
  lastLogin?: string;
  lastActivity?: string;
}

/** ۹. Sales Agent (ایجنت و ویزیتور فروش با انتساب و حوزه قلمرو) */
export interface SalesAgent {
  id: string;
  agentCode: string;
  name: string;
  mobile: string;
  status: "active" | "on_leave" | "inactive";
  // Activation
  role: "senior_agent" | "field_agent" | "territory_lead";
  permissions: string[];
  territory: string[];
  assignmentStatus: "assigned" | "unassigned" | "floating";
  assignedRetailerIds: string[];
  // System Generated
  visitsCount: number;
  ordersCount: number;
  salesVolumeIrr: number;
  conversionRate: number;
  lastVisitDate?: string;
  handoverHistoryCount: number;
}

/** ۱۰. Courier / Delivery Actor (سفیر و مامور تحویل) */
export interface DeliveryCourier {
  id: string;
  courierCode: string;
  name: string;
  mobile: string;
  employmentType: "internal" | "service_partner";
  servicePartnerId?: string;
  status: "available" | "on_mission" | "off_duty";
  // Activation
  deliveryPermissions: string[];
  operationalArea: string[];
  // System Generated
  deliveriesCount: number;
  successRate: number;
  avgDeliveryTimeMinutes: number;
  discrepanciesCount: number;
  incidentsCount: number;
}

/** ۱۱. End Customer (مشتری نهایی) */
export interface EndCustomer {
  id: string;
  systemCustomerId: string;
  mobile: string;
  name?: string;
  contactVerification: boolean;
  consent: boolean;
  // System Generated
  ownedUidCount: number;
  activeWarrantiesCount: number;
  serviceHistoryCount: number;
  buybackHistoryIrr: number;
}

/** ۱۲. Internal User (کاربر سازمانی و پرسنل دیدار) */
export interface InternalUser {
  id: string;
  name: string;
  mobile: string;
  email: string;
  department:
    | "executive"
    | "qc_catalog"
    | "treasury_vault"
    | "commerce_pricing"
    | "finance"
    | "fulfillment"
    | "crm_marketing";
  role:
    | "super_admin"
    | "qc_specialist"
    | "vault_officer"
    | "pricing_analyst"
    | "financial_controller"
    | "fulfillment_manager"
    | "crm_lead"
    | "marketing_manager";
  permissions: string[];
  approvalAuthorityIrr: number;
  overrideAuthority: boolean;
  operationalLocation: string;
  status: "active" | "suspended";
  lastLogin?: string;
  // System Generated
  actionsCount: number;
  approvalsCount: number;
  overridesCount: number;
}

// User representation for authentication and multi-role compatibility
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  password?: string;
  role: RoleId;
  roles?: RoleId[];
  org: string;
  status: "active" | "invited" | "suspended";
  lastActive: string;
  avatarHue: number;
  // Entity Linkages
  entityType?: EntityCategory;
  retailerId?: string;
  storeId?: string;
  producerId?: string;
  partnerId?: string;
  department?: InternalUser["department"];
  permissions?: string[];
  approvalAuthorityIrr?: number;
  overrideAuthority?: boolean;
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
  | "manage_credit"
  | "override_authority"
  | "approve_financial"
  | "manage_territory"
  | "dispatch_courier";
