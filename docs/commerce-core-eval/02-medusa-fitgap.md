# Medusa v2 Fit-Gap vs Didar (pattern study)

**Scope:** What generic commerce shapes does Medusa demonstrate that **Didar should own**, while gold ops stay Didar IP?  
**Not scope:** Installing Medusa as Didar’s production Order SoR (default remains custom Didar).

**Demo basis:** Live Medusa **2.18.0** sandbox + docs ([B2B recipe](https://docs.medusajs.com/resources/recipes/b2b), [Commerce Modules](https://docs.medusajs.com/resources/commerce-modules), module-link / workflow extension guides).

Labels: **Native** | **Configuration** | **Extension Required** | **Custom Module Required** | **Not Supported**

---

## A. Generic commerce (owner demo list)

| Need | Fit | Notes |
|------|-----|-------|
| Product / Variant | Native | Product module |
| Category / Collection | Native | Demoed create |
| Customer | Native | Demoed |
| Customer Group | Native | Demoed; B2B recipe uses groups per company |
| Sales Channel | Native | Demoed |
| Price List / group pricing | Native | Demoed with `customer.groups.id` rule |
| Stock Location | Native | Demoed |
| Inventory Level | Native | Demoed |
| Reservation | Native | Manual + order-driven |
| Cart / Order / Line | Native | Store cart → order demoed |
| Fulfillment (ship/pack) | Native | Generic fulfillment demoed — **not** Didar OTP |
| Admin Panel | Native | `/app` |
| Admin roles / permissions | Native + Configuration | User + RBAC; configure policies in Admin |
| REST API | Native | Admin + Store |
| Events | Native | Event bus (local in sandbox; Redis for prod) |
| Workflows (extendable) | Native | Core workflows + hooks; custom workflows allowed |

---

## B. Didar process criteria (commerce vs gold ops)

| Didar criterion | Fit | What breaks if we refuse to fork core? |
|-----------------|-----|----------------------------------------|
| Retailer / Company Account | **Extension + Custom Module** | Customer + group is Native; full Company/Employee hierarchy needs a **Company custom module** linked to Customer (Medusa B2B recipe says the same) |
| User Roles & Permissions (ops) | Native + Configuration | Admin RBAC covers back-office. Buyer-side multi-user company roles → Custom Module / Extension |
| Catalog | Native | SKU/variant model fits “design”; physical piece identity does not |
| Customer-specific Pricing | Native | Price lists + groups; negotiated gold markup rules may need Extension (hooks) |
| Ordering | Native | Cart/Order sufficient for wholesale PO-style; agent draft order = Extension (draft-order module exists) |
| Inventory | Native | Location + levels |
| Reservation | Native | Reservation items |
| Warehouse / Fulfillment | Native | Generic shipping fulfillment |
| Agent-assisted Order | Extension Required | Draft order / Admin order creation / custom Admin UI for agents |
| UID / Gold Item | **Custom Module Required** | Link `GoldItem`/`Uid` to Product Variant and/or Order line / Inventory item via **module link** |
| Custody / OTP Handover | **Custom Module Required** | Not a Medusa concept; model CustodyTransfer + OTP; hook fulfillment/order workflows |
| Zarrin Integration | **Custom Module Required** (or replace Pricing provider) | Rate feed + settlement as integration module; optionally custom pricing provider interface |
| Custom Workflow | Native | Workflows + subscribers |
| API / Event Architecture | Native | |
| Extend without changing Core | Native (design goal) | Pattern: **custom module → defineLink → workflow hook → API route → Admin widget** |
| Self-hosting / source control | Native | MIT, self-host |
| Maintenance / Upgrade | Configuration risk low | Stay on published packages; avoid core patches |

---

## C. Extension points for Didar-specific modules (no core fork)

| Didar capability | Recommended Medusa extension point | Links to |
|------------------|------------------------------------|----------|
| UID / Gold Item | Custom Module (`GoldItem`) + `defineLink` | Product Variant, Inventory Item, Order Line |
| QC / Producer intake | Custom Module + workflow hooks on product create | Product |
| Custody chain | Custom Module + subscriber on `order.*` / fulfillment | Order, Fulfillment |
| OTP handover | Custom Workflow steps after fulfillment create | Fulfillment / Order |
| Zarrin rates | Custom Module or Payment/Pricing provider adapter | Cart totals, Price List |
| Dual ledger / settlement | Custom Module (Finance stays outside Medusa or linked) | Order |
| Warranty / buyback | Custom Module (Service domain) | Order, Customer, GoldItem |

**Pattern (official):** do **not** alter Product/Order schema in core; store Didar fields in your module and query via module links (`query.graph` / Index Module).

---

## D. Gaps that are Not Supported as “commerce core”

| Need | Fit | Why |
|------|-----|-----|
| Alibaba-style multi-vendor gold marketplace | Custom Module Required (large) | Marketplace is a product build on top of modules, not OOTB |
| Physical custody + OTP as first-class commerce | Custom Module Required | Outside commerce primitives |
| Zarrin-native settlement | Custom Module Required | External financial system |
| Iranian gold QC / karat / seal UID as Product Variant alone | Not Supported (as sole model) | Variant ≠ unique sealed piece; need UID entity |

---

## E. Sandbox verdict (pattern lesson for Didar)

Medusa v2 demonstrates a complete **generic** commerce spine (catalog, group pricing, order, reservation, fulfillment, admin, API/workflows). **Didar should grow those shapes in our custom spine** to that quality bar.

Didar’s **differentiating** chain (UID, custody/OTP, Zarrin, warranty/buyback) stays Didar IP — the study confirms they do not belong inside a generic commerce Product schema.

This is a **build checklist**, not a platform selection or install plan. See comparative memo vs OroCommerce CE.
