# OroCommerce CE — Fit matrix vs Didar process (pattern study)

**Why this exists:** B2B account / pricing / agent-order **lessons for building Didar** — not an Oro install plan.  
**Confidence:** Desk research (official Oro docs + CE vs EE notes). **No Oro CE sandbox** in this phase (heavy PHP/Symfony stack; plan allowed desk evidence with explicit confidence).  
**Sources:** [CE vs EE](https://doc.oroinc.com/5.0/user/back-office/getting-started/community-vs-enterprise/), [Integration points](https://doc.oroinc.com/user/solution-architect/integration-points/), Oro B2B feature materials, public CE download path.

Labels: **Native** | **Configuration** | **Extension Required** | **Custom Module Required** | **Not Supported**

---

## Didar-process criteria

| Criterion | OroCommerce CE Fit | Evidence / caveat |
|-----------|--------------------|-------------------|
| Retailer / Company Account | **Native** | B2B customer/account model is a core Oro strength (buyer organizations, account hierarchy patterns) |
| User Roles & Permissions | **Native + Configuration** | OroPlatform ACL/roles mature for back-office + storefront buyer roles |
| Catalog | **Native** | PIM-style catalog, categories, master catalog concepts |
| Customer-specific Pricing | **Native** | Price lists / customer pricing are flagship B2B features |
| Ordering | **Native** | Checkout + often RFQ/quote culture (useful for wholesale gold) |
| Inventory | **Native / Configuration** | Inventory visibility exists in CE; **multi-warehouse inventory is listed as EE** |
| Reservation | **Configuration / Extension** | Soft allocation patterns exist in B2B platforms; exact reservation semantics need CE verification in a live demo |
| Warehouse / Fulfillment | **Native / Configuration** | Shipping/fulfillment flows; multi-warehouse depth → EE |
| Agent-assisted Order | **Native + Configuration** | Stronger OOTB than typical headless frameworks (sales/back-office order ops) |
| UID / Gold Item | **Custom Module Required** | Symfony bundle / entity + admin UI; no gold-UID concept OOTB |
| Custody / OTP Handover | **Custom Module Required** (+ Workflow) | Oro workflow engine can orchestrate; OTP custody still custom domain |
| Zarrin Integration | **Extension Required** (Integration module / API / file exchange) | Documented integration points: Integration Modules, API, SFTP/file exchange |
| Custom Workflow | **Native** | Visual/configurable workflow engine is a known Oro strength |
| API / Event Architecture | **Native** | API-first; message queue depth stronger on EE (RabbitMQ called out for EE) |
| Extend without changing Core | **Extension / Custom Module** | Possible via bundles/packages; upgrade discipline is stricter than Medusa’s isolated modules |
| Self-hosting / source control | **Native** (CE) | CE is open/self-host; **EE feature cliff** is a commercial lock-in risk |
| Maintenance / Upgrade | **Higher complexity** | PHP/Symfony/OroPlatform stack; CE→EE feature gaps (multi-org, multi-site, multi-currency, multi-warehouse, ElasticSearch) matter for Didar scale |

---

## CE vs EE cliffs relevant to Didar

From Oro’s own CE vs EE summary, **EE adds** (among others):

- Multiple organizations  
- Multiple websites  
- Multiple currencies  
- Inventory across **multiple warehouses**  
- ElasticSearch, RabbitMQ scale path  
- Deeper OroCRM embedding  

For Didar’s real ops (multi-location vaults, multi-party network, IRR + gold economics), **CE may force custom work or an EE license** for capabilities that look “Native” in marketing decks but sit behind EE.

---

## Extension model (for Didar-only needs)

| Didar need | Oro approach without forking core |
|------------|-----------------------------------|
| UID / Gold Item | Custom entity/bundle; relate to Product / Order Line Item |
| Custody / OTP | Custom entities + OroWorkflow transitions; storefront/back-office forms |
| Zarrin | Integration module or middleware via API/SFTP (documented integration points) |
| Dual ledger | Prefer keep outside Oro or sync via API — do not overload commerce catalog |

---

## Oro-only verdict (not a selection)

OroCommerce CE **minimizes custom work for classic B2B account/pricing/agent/order UX**.

It **does not** remove custom work for UID/custody/OTP/Zarrin.

Architectural lock-in risk is **higher** than Medusa if Didar later needs EE-only warehouse/org/currency features, or if deep Symfony customizations tangle upgrades.

Next optional step (out of this deliverable): spin a CE demo VM and re-score Reservation / multi-warehouse rows from live Admin.
