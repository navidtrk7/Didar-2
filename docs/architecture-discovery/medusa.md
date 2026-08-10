# Scorecard — Medusa v2 (reference pattern)

**Role:** Best-practice reference for **commerce kernel shapes** (order / cart / channel / reservation)  
**How we use it:** Checklist for what to **build in Didar** — not an install target  
**Status:** Sandbox study done  
**Last updated:** 2026-08-10  
**Evidence:** [../commerce-core-eval/](../commerce-core-eval/README.md) · sandbox `didar-medusa-eval` (v2.18.0, no core fork)

---

## 1. What capabilities does this teach us to own?

Product/Variant, Category/Collection, Customer/Group, Sales Channel, Price lists (group pricing), Stock Location, Inventory levels, Reservation, Cart/Order/Line, Fulfillment, Admin, REST API, Events, Workflows (extendable).

## 2. What must stay Didar IP?

UID/Gold Item, Custody/OTP, Zarrin settlement, warranty/buyback ownership semantics, Iran Partner model (factory/gallery/wholesaler profiles), gold-specific agent ops beyond draft order. Company hierarchy for B2B = Didar Network (+ links), not forced into a commerce Product schema.

## 3. Data ownership lesson

| Data | Should Didar own? | Notes |
|------|-------------------|-------|
| Product/Catalog | Y | Grow Didar toward kernel quality |
| Customer/Account (commerce) | Link to Party | Party remains Didar Network |
| Order | Y (sole SoR in Didar) | One spine for retailer + agent |
| Inventory/Reservation | Y (generic) | Not custody IP |
| Partner/Party | Y | Didar Network |
| UID/Gold item | Y | Never in generic commerce core |
| Financial ledger | Zarrin / Didar finance | Do not dual-master |

## 4. Integration patterns worth copying

Module boundaries + workflow hooks + events out to marketing/BI. No dual Order write from CRM. Side systems consume events; they do not own Order.

## 5. Ops lessons (informational)

Node/TS, Postgres, Redis recommended in prod for this class of system. Upgrade path healthy **if no forks** — same discipline for Didar modules.

## 6. License notes (informational)

MIT-style packages in eval — confirm only if Product ever reopens external adoption (not the plan).

## 7. Coupling risk

High if gold fields are patched into a vendor Product schema. Keep Gold IP in Didar modules either way.

## 8. Critical-path lesson

Order + generic fulfill are critical path for sell+fulfill — they must live in Didar’s spine today. CRM/marketing must not sit in front of checkout.

## 9. How we use this reference

- [x] Primary pattern checklist for building Didar commerce  
- [ ] Secondary benchmark only  
- [ ] Deferred  
- [ ] Reject as a useful reference  

**One-line reason:** Strong modular commerce primitives = quality bar for Didar’s Order spine; production SoR stays Didar.
