# Didar — Living backlog

**Audience:** anyone on the team.  
**Update rule:** change this file when status, SoR, or direction changes.  
**Last updated:** 2026-08-10 (discovery docs reframed as build checklists)

Related:

- [Market-ready plan](MARKET_READY.md) — production pilot definition of done
- [Capability map](capability-map.md) — what belongs where
- [User guide / flows (FA)](user-guide/handbook.md) — how to use the system (Persian)
- [Architecture discovery](architecture-discovery/) — **best-practice checklists** for what to build in Didar (not install targets)

---

## North star

**Ship a market-ready Didar pilot** on the custom domain spine.

Architecture discovery (Medusa, Twenty, etc.) is a **best-practice checklist for what to build in Didar** — domain ownership, SoR boundaries, capability gaps — not a shopping list of products to install. Default = grow Didar. Reopening “adopt an external product” is an explicit Product exception, not the plan.

Non‑negotiable for this wave:

1. End-to-end sell → fulfill → service/finance paths work without silent soft-fails.
2. **One System of Record** per domain inside Didar today; Zarrin via adapter (test shapes until live API).
3. Honest UI — no mock-as-live; parked features stay parked.
4. OTP SMS and live Zarrin credentials deferred; adapter + demo OTP remain.
5. Agent-assisted and retailer self-service stay on **one Order spine**.

---

## Where we are (one paragraph)

Didar runs a **custom domain spine** in production-shaped code. Market-ready wave hardens order→allocate→fulfill (atomic + credit gate), Zarrin **test adapter** with production payload shapes, custody discrepancy, warranty delivery gate, and destructive-admin/health guards. OTP SMS and live Zarrin keys remain deferred. Discovery docs guide *what good looks like* when we extend Didar — they are not the runtime.

---

## Systems of Record (practice guide vs today)

*“Reference pattern”* = what mature platforms teach us to own in that domain. *Today* = what Didar actually runs. Building toward the pattern ≠ installing the product.

| Domain | Reference pattern (learn from) | Today in Didar | Notes |
|--------|--------------------------------|----------------|-------|
| Order / Cart / Line | Commerce kernel (e.g. Medusa shapes) | Didar custom | One Order spine; grow Didar toward kernel quality |
| Catalog / Variant / Price list | Commerce kernel | Didar custom (+ TGJU rates) | |
| Stock location / Reservation / Generic fulfill | Commerce kernel | Didar custom | |
| Partner / Company / Store / Membership | **Didar Custom** (always) | Didar Network v1 | Keep |
| UID / Gold Item / Custody / OTP | **Didar Custom** (always) | Partial in Didar | Gold IP — never force into generic commerce |
| Gold finance / settlement | Zarrin adapter (+ ERP patterns) | Trust settle + Zarrin test | Do not dual-master money |
| CRM (visit/pipeline) | CRM suite patterns (e.g. Twenty) | Parked in UI | Not order engine; build only when needed |
| Marketing automation | Automation patterns (e.g. Mautic) | Event hooks only | Consumer of events |
| Identity / SSO | IdP patterns (e.g. Keycloak) | JWT in Didar API | Multi-app pain → then consider |
| BI | BI patterns (Metabase/etc.) | Admin reports thin | Read-only |
| Search | Search engine patterns | DB / app search | Scale pain → then consider |

---

## Now / Next / Later / Blocked

### Now (active)

| Item | Owner role | Status |
|------|------------|--------|
| Market-ready wave — see [MARKET_READY.md](MARKET_READY.md) | Eng (PM mode) | **Pilot-ready** |
| Live E2E smoke 26/26 (`scripts/pilot_smoke.py`) | Eng | **Done** |
| Order→allocate→fulfill atomic + retailer credit gate | Eng | **Done** |
| Zarrin test adapter (prod payload shapes) | Eng | **Done** |
| Settlement/buyback → adapter + dual-ledger | Eng | **Done** |
| Custody discrepancy open/resolve | Eng | **Done** |
| Warranty claim requires `delivered` | Eng | **Done** |
| Health `db_ok` + reseed guard | Eng | **Done** |
| Active-role multi-hat menus | Eng | **Done** |
| OTP real SMS | Eng + Product | **Postponed** |
| Live Zarrin API keys | Finance | **Deferred** (adapter ready) |
| Deploy market-ready build to didar.cls9.com | Eng | **Done** |
| Fulfillment E2E + buyback delivered-gate in smoke | Eng | **Done** — 32/32 live |
| Trust settle (verbal/phone/cash) + party trust_tier | Eng | **Done** — 35/35 live |
| Entity Profile mindset (Mandatory→Activation→Extension) | Eng | **Done** |

### Next — polish / pilot ops

| Item | Owner role | Notes |
|------|------------|--------|
| Session/menus from active hat + multi-role | Eng | **Done** (active-role switcher) |
| Handbook + `/app/help` pilot strip | Eng | **Done** (live) |
| Designs / promotions / CRM / pricing depth / Intelligence | Eng | **Parked in UI** — unpark only when engine is real |
| Postgres backups before real customer data | Ops | Runbook in MARKET_READY |
| Rotate JWT + `DEMO_SEED=false` on prod when going live | Ops | |
| Architecture discovery as build checklist (not install list) | Product/Eng | Docs reframed — use when extending domains |

### Later (capabilities to build in Didar — use refs when designing)

| Capability to build | Pattern reference | Trigger to start |
|---------------------|-------------------|------------------|
| CRM (visit / pipeline / opportunity) | Twenty scorecard | Real Relationship demand; unpark UI only with a real engine |
| Marketing journeys / segments | Mautic scorecard | Need beyond `domain_events` hooks |
| SSO across apps | Keycloak patterns | Multi-app identity pain |
| Management BI | Metabase / Superset patterns | Dashboard demand beyond thin admin reports |
| Search at scale | Typesense / OpenSearch patterns | Catalog/UID search scale pain |
| Deeper ERP / serial / GL Fit | ERPNext scorecard | After Zarrin boundary clear; study only |

### Blocked / waiting

| Item | Waiting on |
|------|------------|
| Reopen external commerce product as Order SoR | Explicit Product exception — see [quality bar / gate](architecture-discovery/commerce-kernel-decision-gate.md) (default remains Didar) |
| Zarrin replace announcement | Never until PoC; keep Zarrin SoR for gold accounting short-term |
| Fork any vendor core | Never (policy) |

---

## Phase heuristics (owner)

| Phase | Theme | How much is “standard commerce pattern” vs IP | Didar focus |
|-------|--------|-----------------------------------------------|-------------|
| 1 | Operational B2B spine | ~65–70% pattern (build in Didar) | Partners, UID path, custody glue |
| 2 | Public / B2C storefront | ~60–70% same commerce patterns | Brand/PWA |
| 3 | Warranty / ownership / buyback / CRM depth | ~30–40% pattern | Service + Relationship IP |
| 4 | Advanced ledger / Zarrin-replace / credit / AI | ~15–25% pattern | Finance + Intelligence IP |

---

## Reference pattern library (what to learn — not what to install)

| Reference | Domain lesson | Status | Evidence |
|-----------|---------------|--------|----------|
| Medusa v2 | Commerce kernel shapes (primary bar) | **Study done** (sandbox) | [commerce-core-eval](commerce-core-eval/README.md), [scorecard](architecture-discovery/medusa.md) |
| Vendure | Commerce peer benchmark | Desk done | [scorecard](architecture-discovery/vendure.md) |
| OroCommerce CE | B2B account / pricing UX | Desk Fit | [03-oro](commerce-core-eval/03-oro-fit-matrix.md), [oro](architecture-discovery/oro.md) |
| ERPNext | Serial / warehouse / GL Fit | Not started | [stub](architecture-discovery/erpnext.md) |
| Twenty | CRM patterns | Deferred | [stub](architecture-discovery/twenty.md) |
| Mautic | Marketing automation patterns | Deferred | [stub](architecture-discovery/mautic.md) |
| Keycloak | SSO patterns | Deferred | Track in Later |
| Metabase / Superset | BI patterns | Deferred | Track in Later |
| Typesense / OpenSearch | Search patterns | Deferred | Track in Later |

**Quality bar:** [architecture-discovery/commerce-kernel-decision-gate.md](architecture-discovery/commerce-kernel-decision-gate.md) — default = build commerce quality **in Didar** using these patterns.

---

## Done log (recent)

- Pilot smoke green 26/26 live; fixed UID idempotent re-issue, retailer org credit bind, proforma None craft_fee  
- Active-role multi-hat menus + permission union of grants  
- Market-ready A–C: atomic retailer order glue + credit; Zarrin test adapter; settlement/buyback ledger posts; custody discrepancy; warranty claim gate; health/reseed guards  
- Trust pass 3: `/platform` party-scoped for retailer/agent/producer/customer; buyback quote API (metal−craft); producer settlement quote from live rate; UI labeled Zarrin-separate  
- Trust pass 2: admin orders live + CSV; admin ledger → finance ledger; retailer order/credit scoped to org (no wrong-account fallback); public catalog labeled marketing; finance/fulfillment error banners; collections/network/relationship load toasts; prod-missing-API uses empty state  
- Wave 3 trust pass (non-OTP): JWT on `/platform`; empty state on API fail; retailer catalog/orders pass UIDs; allocation UI links docs; custody destination pickers; invite temp-password modal; verify/warranty honesty; gold ticker stale signal; settlements/service “manual” badges; admin assets → inventory UIDs  
- Domain spine (10 domains) + roles as permissioned views  
- Producer role + Add Product → QC path  
- Chain glue: QC→UID, proforma→allocation, order→fulfillment; CRM campaign fire on events  
- Relationship + Intelligence partial surfaces  
- Intelligence **parked** (phase 4); ops pulse via `/app/admin/reports`  

- Medusa v2.18 sandbox + Fit-Gap + Oro memo kept as **commerce pattern references** (not adopt plan)  
- Network v1: Iran party types (factory/atelier/wholesaler/gallery/vault/agent…), profiles, 0-assignee stores, multi-role grants, custom roles UI  
- Living backlog + capability map + architecture-discovery scorecards (reframed as build checklists)  
- Network UX polish: how-to panel, «فقط بدون مسئول» filter, clearer empty assignee copy  
- Vendure desk scorecard + commerce quality-bar gate (default = Didar spine)  
- Domain-first UX: journey strip, demote role shells, workspace hat switcher (`/network/me/contexts`)  

---

## Didar IP (always custom — do not force into commerce/CRM)

- Gold Item / UID  
- Partner model (Iran market parties)  
- Custody / OTP handover / discrepancy  
- Agent-specific operations (beyond draft order)  
- Gold warranty / ownership  
- Buyback logic  
- Gold settlement / financial logic (with Zarrin boundary)

---

## How to update this file

1. Move items between Now / Next / Later / Blocked.  
2. Update SoR table when Didar ownership of a domain changes.  
3. Link new evidence under Reference pattern library.  
4. Append Done log (short bullets).  
5. Bump **Last updated**.  
6. Never imply a vendor name means “install next” — it means “learn this pattern.”
