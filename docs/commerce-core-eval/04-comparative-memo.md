# Comparative memo — Medusa v2 vs OroCommerce CE (Didar Fit)

**Goal (owner):** Which *patterns* create **least custom invention** and **least architectural lock-in** when we **build Didar**?  
**Not a platform selection. Not an install decision.** Default runtime = Didar custom spine.

**Evidence:** Live Medusa 2.18 sandbox + Fit-Gap; Oro scored from official CE/EE docs (desk).

---

## One-line verdict

- **Least lock-in for Didar-specific gold ops (UID, Custody/OTP, Zarrin):** **Medusa v2** — modular isolation + module links keep Didar domains outside commerce core.  
- **Least custom for classic B2B commerce UX (company account, price lists, agent order, RFQ-style selling):** **OroCommerce** — more of that is productized; CE→EE cliffs and PHP upgrade weight are the trade-off.  
- **Neither** is “Alibaba for gold” OOTB; marketplace + physical gold chain remain **Custom Module** work on both.

---

## Side-by-side (Didar criteria)

| Criterion | Medusa v2 | OroCommerce CE | Lower custom? | Lower lock-in? |
|-----------|-----------|----------------|---------------|----------------|
| Retailer / Company Account | Groups Native; Company hierarchy Custom Module | Native | Oro | Medusa (lighter coupling) |
| Roles & Permissions | Native + Config (RBAC) | Native + Config (ACL) | Tie | Medusa slightly |
| Catalog | Native | Native | Tie | Tie |
| Customer-specific Pricing | Native (price lists) | Native (price lists) | Tie | Tie |
| Ordering | Native | Native (+ RFQ culture) | Oro (if RFQ needed) | Medusa |
| Inventory | Native | Native; multi-warehouse → EE | Medusa if multi-vault on CE | Medusa |
| Reservation | Native (demoed) | Config/Extension (desk) | Medusa (proven live) | Medusa |
| Warehouse / Fulfillment | Native (generic) | Native; multi-WH → EE | Depends on vault model | Medusa if staying CE |
| Agent-assisted Order | Extension | Native/Config | Oro | Medusa |
| UID / Gold Item | Custom Module + link | Custom Module/bundle | Tie | **Medusa** |
| Custody / OTP | Custom Module + workflow | Custom Module + workflow | Tie | **Medusa** |
| Zarrin Integration | Custom Module / provider | Integration module / API | Tie | Tie / Medusa |
| Custom Workflow | Native | Native (strong) | Oro (visual) | Medusa (JS modules) |
| API / Events | Native | Native | Tie | Medusa |
| Extend w/o core fork | Strong design | Possible; heavier | Medusa | **Medusa** |
| Self-host / source | Strong | CE strong; EE cliff | — | **Medusa** |
| Ops / upgrade complexity | Lighter Node stack | Heavier Symfony/Oro | Medusa | **Medusa** |

---

## Custom development map (honest)

**Must be built either way (Didar differentiators):**

1. UID / sealed Gold Item identity  
2. Custody chain + OTP handover  
3. Zarrin rate & settlement semantics  
4. Warranty / buyback / secondary (Service domain)

**Likely less build on Oro:** company account UX, buyer roles, agent/back-office order, quote/RFQ if required.  
**Likely less build on Medusa:** staying on CE-equivalent features while running multi-location inventory/reservation without EE; isolating gold modules for upgrades.

---

## Architectural lock-in risks

| Risk | Medusa | Oro CE |
|------|--------|--------|
| Fork temptation | Low if team follows module-link pattern | Medium if teams patch OroPlatform |
| Edition cliff | Mostly Cloud vs self-host ops, not feature gating of warehouses | **CE→EE** for multi-org / multi-site / multi-currency / multi-warehouse |
| Talent / ops | Node/TS common in Didar stack already | PHP/Symfony specialist load |
| Replacing commerce later | Modules are swappable by design | Deeper suite entanglement (CRM/PIM/commerce) |

---

## How to use this memo when building Didar

1. Keep Medusa sandbox as the **executable commerce pattern reference** (already running).  
2. Prefer Medusa-shaped modular isolation when designing Didar Order / reservation / channel boundaries.  
3. Steal Oro lessons for B2B account / price-list / agent-order *UX*, implement them in Didar Network + Commerce.  
4. Reopen “external product as Order SoR” only via Product exception — see [commerce-kernel-decision-gate](../architecture-discovery/commerce-kernel-decision-gate.md).

**Owner ask preserved:** no fork, no install-by-default, no silent dual Order SoR.
