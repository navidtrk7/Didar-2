# Scorecard — Vendure (reference pattern)

**Role:** Secondary **commerce** best-practice benchmark (vs Medusa shapes)  
**How we use it:** Pattern checklist for Didar — not an install target  
**Status:** Desk research  
**Last updated:** 2026-08-10  
**Evidence:** [vendure.io/core](https://vendure.io/core) · [Pricing pipeline](https://docs.vendure.io/current/core/core-concepts/pricing) · [2026 roadmap](https://vendure.io/blog/vendure-technical-roadmap-2026)  
**Sandbox:** Not run (desk only)

---

## 1. What capabilities does this teach us to own?

Catalog (products/variants), customers, orders, channels, pricing pipeline (channel/currency + strategy hooks), promotions/tax, admin + Shop APIs, async job worker, plugin-style extensions.

Channels map cleanly to Didar’s “retailer self-service vs agent-assisted” as **two channels, one order engine**.

## 2. What must stay Didar IP?

UID/Gold Item, Custody/OTP, Zarrin settlement, Iran Partner Network, warranty/ownership/buyback.  
Rich B2B company/account suites often sit in paid Platform tiers — do not assume OOTB B2B equals Didar Network.

## 3. Data ownership lesson

| Data | Should Didar own? | Notes |
|------|-------------------|-------|
| Product/Catalog | Y | |
| Customer/Account | Link to Party | |
| Order | Y (sole SoR in Didar) | |
| Inventory/Reservation | Y | Prove reservation quality in Didar |
| Partner/Party | Y | Didar Network |
| UID/Gold item | Y | Prefer external-to-commerce module |
| Financial ledger | Zarrin / Didar | |

## 4. Integration patterns worth copying

Channel strategy for pricing; event bus for lifecycle; worker jobs for async work.

## 5–6. Ops / license (informational)

NestJS + GraphQL class of system; Core often GPLv3 — relevant only if Product reopens external adoption (not the plan).

## 7. Coupling risk

High if gold fields become de-facto schema on a vendor entity. Keep Gold IP in Didar.

## 8. Critical-path lesson

Same as any commerce kernel: Order SoR must stay one place (Didar today). CRM must not own Order.

## 9. How we use this reference

- [ ] Primary pattern checklist  
- [x] Secondary benchmark only  
- [ ] Deferred  
- [ ] Reject as a useful reference  

**One-line reason:** Strong channels + pricing strategies; Medusa remains the better-evidenced commerce pattern for Didar’s bar.
