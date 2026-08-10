# Medusa v2 sandbox — setup & native demo

**Why this exists:** executable **pattern reference** for commerce shapes Didar should own. Not a production install path.

**Constraint honored:** stock Medusa v2 install, **no fork**, **no edits under `node_modules/@medusajs/*`**.

## Environment

| Item | Value |
|------|--------|
| Project | `/Users/meysam/Desktop/Code/didar-medusa-eval` |
| Package | Medusa **2.18.0** DTC starter monorepo (`apps/backend`) |
| DB | PostgreSQL 14 — `didar_medusa_eval` |
| Redis | Not installed; Medusa used in-memory fake Redis (dev only) |
| Admin | `http://127.0.0.1:9000/app` |
| Login | `admin@didar-eval.local` / `DidarEval123!` |

### Start / re-run

```bash
# DB already created once:
#   createdb didar_medusa_eval   # or psql CREATE DATABASE

cd /Users/meysam/Desktop/Code/didar-medusa-eval/apps/backend
npx medusa develop --host 127.0.0.1 --port 9000

# Evidence script (from Didar repo):
python3 /Users/meysam/Desktop/Code/didar/docs/commerce-core-eval/scripts/medusa_e2e_demo.py
```

No Next.js storefront was installed (not required for Admin + API demo).

## Owner checklist — demo results

Evidence: [`artifacts/medusa-demo-report.json`](artifacts/medusa-demo-report.json) (live HTTP against this sandbox).

| # | Capability | Result | Evidence |
|---|------------|--------|----------|
| 1 | Product / Product Variant | **Native** | Seeded products + variants listed via `/admin/products` |
| 2 | Category / Collection | **Native** | Created `Didar Gold Bars *` category + wholesale collection |
| 3 | Customer / Customer Group | **Native** | Created retailer customer + `Retailers-Tier-A-*` group; linked |
| 4 | Sales Channel | **Native** | Seeded channel; publishable key linked to channel |
| 5 | Price List / group pricing | **Native** | Active price list with `rules.customer.groups.id` |
| 6 | Stock Location / Inventory Level | **Native** | Seeded location + inventory levels (stocked qty present) |
| 7 | Reservation | **Native** | Manual reservation created; order flow also left reservation items |
| 8 | Cart / Order / Order Line | **Native** | Store cart → payment session (`pp_system_default`) → order |
| 9 | Fulfillment | **Native** | `/admin/orders/{id}/fulfillments` succeeded |
| 10 | Admin Panel | **Native** | `/app` returns 200 HTML |
| 11 | Role / Permission | **Native + Configuration** | Super-admin user via User module; RBAC module/workflows exist in v2 (assign roles via Admin) |
| 12 | API / Event / Workflow | **Native** | Admin+Store REST; local Event Bus; workflow engine (no custom workflows added in this phase) |

## B2B E2E path executed

```text
Product (seeded)
  → Catalog (category + collection created)
  → Retailer Customer + Customer Group
  → Price List (group-scoped)
  → Cart + Line Item + Shipping + Payment
  → Order
  → Inventory Reservation (auto + manual)
  → Fulfillment
```

Example successful order id from last run: see `order_flow.complete_cart.order_id` in the JSON artifact.

## What was deliberately not built

UID, OTP custody handover, Zarrin, warranty/buyback, Didar domain modules, any change to Medusa core source.
