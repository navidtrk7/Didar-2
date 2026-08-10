# Commerce patterns — quality bar (not an install decision)

**Purpose:** Capture what a mature commerce kernel *owns*, so we know **what to develop in Didar**.  
**Default path:** keep building the **custom Didar spine**.  
**Date:** 2026-08-10  
**Inputs:** [capability-map](../capability-map.md) · [Medusa eval](../commerce-core-eval/README.md) · [Medusa](medusa.md) · [Vendure](vendure.md) · [Oro](oro.md) · [BACKLOG](../BACKLOG.md)

---

## How to use this doc

Read Medusa / Vendure / Oro as **best-practice checklists**:

- one Order SoR  
- catalog / channel / reservation / generic fulfill shapes  
- clear separation from Partner + Gold IP  

Do **not** treat this as “pick a Docker image next sprint.”

---

## Primary question (product)

Are we growing Didar’s Order / Catalog / Inventory / Fulfillment toward kernel-quality ownership (default), or has Product *explicitly* reopened “replace the spine with an external product”?

| Path | Meaning |
|------|---------|
| **Default — Build in Didar** | Implement commerce capabilities *inspired by* kernel patterns; Didar remains Order SoR |
| **Exception — External kernel** | Only if Product signs a separate adopt decision (rare; not the roadmap) |

---

## Pattern evidence (why these refs)

| Criterion | Medusa (ref) | Vendure (ref) | Oro CE (ref) |
|-----------|--------------|---------------|--------------|
| Live sandbox E2E (Didar-owned) | **Yes** | No (desk) | No (desk) |
| Product→Order→Reserve→Fulfill shape | Proven | Expected | Expected |
| Extension w/o fork (if ever used) | Modules + links | Plugins + strategies | Bundles/workflows |
| Retailer + Agent as one engine | Sales channels | Channels | Native B2B |
| License simplicity (if ever used) | Favorable | GPLv3 Core | CE / EE cliff |
| Gold IP isolation lesson | Clean custom modules | Clean plugins | Custom modules |

**Best commerce pattern reference for Didar today:** Medusa shapes (evidence + modular separation).  
**Use that to build Didar** — not to schedule a cutover.

---

## What Didar should own (checklist from refs)

Build / harden these **inside Didar** unless Product reopens adoption:

1. Single Order SoR (retailer + agent same spine)  
2. Catalog / variant / collection  
3. Channel distinction without two engines  
4. Reservation + generic pick/pack/ship  
5. Price list / group pricing hooks (gold rate stays Didar/TGJU)  
6. Hard wall: UID / custody / OTP / Zarrin / Network parties stay Didar IP  

---

## Exception path only (external product)

If Product ever reopens adoption (not assumed):

1. Legal OK on chosen package licenses  
2. Written SoR: Order only in external kernel; UID/custody only in Didar  
3. Adapter: Party ↔ customer/group; GoldItem ↔ variant/line  
4. One Order API for agent + retailer  
5. Rollback: Didar spine readable until cutover complete  

Until then: **do not dual-write Orders** to any external commerce product.

---

## Product stance (current)

- [x] **Default:** build commerce quality in Didar using these patterns as the bar  
- [ ] Exception: reopen external kernel adoption (date ______ / reason ______)
