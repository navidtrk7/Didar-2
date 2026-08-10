# Didar capability map

**Purpose:** Assign every capability to an ownership lane — using mature platforms as **best-practice references for what to develop in Didar**, not as required installs.  
**Living with:** [BACKLOG.md](BACKLOG.md)  
**Last updated:** 2026-08-10

## Legend

| Label | Meaning |
|-------|---------|
| **Kernel bar (ref)** | Commerce-kernel *quality bar* (order/cart/channel/reservation) — learn from Medusa/Vendure/Oro studies; **build in Didar** |
| **Didar Custom** | Didar IP / partner model — build and own |
| **Config / Extension** | Thin extension / hook once a clear boundary exists |
| **Later (ref)** | Side capability pattern (CRM/BI/…); park until core spine needs it; then **build in Didar** (or Product reopens external adopt as exception) |
| **Out of scope** | Not a near-term Didar platform concern |
| **Today: custom** | Currently implemented in Didar custom spine |

---

## Commerce & channels

| Capability | Build toward | Today | Notes |
|------------|--------------|-------|-------|
| Product / Variant / Category / Collection | Kernel bar (ref) | Today: custom | Pattern proven Native in Medusa sandbox study |
| Sales channel | Kernel bar (ref) | Today: custom / roles | Retailer vs agent = channels, not two engines |
| Customer / Customer group | Kernel bar (ref) | Today: custom User+Org | Link to Didar Party |
| Price list / customer-specific pricing | Kernel bar (ref) | Today: custom + TGJU | Gold rate rules may stay Extension |
| Cart / Order / Order line | Kernel bar (ref) | Today: custom | **Single Order SoR in Didar** |
| Retailer self-service order | Kernel bar (ref) | Today: custom retailer UI | Same Order SoR |
| Agent-assisted sale | Config / Extension | Today: custom agent UI | Draft / assist on same core |
| Stock location / Inventory level | Kernel bar (ref) | Today: custom | |
| Reservation | Kernel bar (ref) | Today: custom | Reservation shape demoed in Medusa study |
| Generic fulfillment (pick/pack/ship) | Kernel bar (ref) | Today: custom | Not OTP custody |
| Payment session (generic) | Kernel bar (ref) | Partial | |
| Admin commerce RBAC | Kernel bar (ref) | Today: Didar roles | |

---

## Didar Network / Partner

| Capability | Build toward | Today | Notes |
|------------|--------------|-------|-------|
| Party types (factory, atelier, wholesaler, gallery, vault, agent desk…) | Didar Custom | Network v1 | Iran market model |
| Party profile (license, city, capabilities, what they do) | Didar Custom | Network v1 | Entity Profile stages |
| Store / party with **zero assignees** | Didar Custom | Network v1 | Required |
| Person ↔ many parties | Didar Custom | Memberships | |
| Custom roles + multi-role person | Didar Custom | Grants + primary role | Active-hat session live |
| Required fields per Iran role/party | Didar Custom | Entity Profile checklist | |

---

## Gold IP (never force into commerce/CRM core)

| Capability | Build toward | Today | Notes |
|------------|--------------|-------|-------|
| UID / sealed Gold Item | Didar Custom | Partial | ERPNext serial Fit = discovery only |
| Physical weight / karat immutability after seal | Didar Custom | Partial | |
| Custody chain | Didar Custom | Partial | |
| OTP handover | Didar Custom | Demo OTP `1234` | |
| Discrepancy / physical responsibility rules | Didar Custom | Thin | |
| QC / producer intake | Didar Custom | Live path | May *link* to commerce Product |
| Warranty / ownership transfer | Didar Custom | Partial | Phase 3 |
| Buyback / secondary | Didar Custom | Partial | Phase 3 |
| Producer settlement (gold-specific) | Didar Custom | Partial | |
| Gold settlement / dual ledger semantics | Didar Custom + Zarrin | Partial | Zarrin SoR short-term |

---

## Finance & ERP

| Capability | Build toward | Today | Notes |
|------------|--------------|-------|-------|
| Gold accounting SoR | Zarrin (now) | Adapter test + trust settle | Do not announce replace |
| Deeper warehouse / serial / GL Fit | Later (ref: ERPNext) | — | Study patterns; build in Didar/Zarrin boundary |
| Credit / retailer credit docs | Didar Custom | Custom + trust channels | |

---

## Relationship / Marketing / Insight

| Capability | Build toward | Today | Notes |
|------------|--------------|-------|-------|
| Light contacts + campaign hooks | Later (parked) | Parked in UI | Not order engine |
| Visit / pipeline / opportunity CRM | Later (ref: Twenty) | Parked | Build in Didar when demand is real |
| Segment / journey automation | Later (ref: Mautic) | Event hooks only | Consumes Customer/Event |
| Ops recommendations / event analytics | Later (parked) | Intelligence parked | |
| Management BI dashboards | Later (ref: Metabase/Superset) | Admin reports thin | Read-oriented |

---

## Platform cross-cutting

| Capability | Build toward | Today | Notes |
|------------|--------------|-------|-------|
| Auth (single app) | Didar Custom JWT | Live | |
| SSO across multiple apps | Later (ref: Keycloak) | — | Only if multi-app identity pain |
| Product/UID search at scale | Later (ref: Typesense/OpenSearch) | DB | |
| Domain events bus | Didar Custom | Live `domain_events` | Feed marketing/BI patterns later |

---

## Decision rules (use when arguing)

1. If a non-gold B2B wholesaler needs it → **commerce kernel bar in Didar**, not gold IP.  
2. If it only exists because the asset is sealed gold with custody → **Didar Custom**.  
3. If two systems would both write the same fact → **pick one SoR**; the other integrates read/sync.  
4. If CRM/marketing/BI is down and sell+fulfill must continue → that domain is not SoR for Order/Inventory.  
5. A vendor name in this map means **learn the pattern** — default is still build in Didar.
