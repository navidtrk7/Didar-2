# Architecture discovery

**How to read this folder:** best-practice *references* for **what to develop inside Didar** — domain shapes, SoR boundaries, and capability checklists — learned from mature platforms.

These are **not** install targets and **not** the live stack. Didar ships on the custom domain spine. Use scorecards when deciding *what a good Order / CRM / BI / identity layer should own*, not when deciding “which Docker image to run next week.”

**Default path:** build the capability in Didar.  
**Exception path:** Product explicitly reopens adopting an external product (rare; see [commerce-kernel-decision-gate.md](commerce-kernel-decision-gate.md)).

**Status board:** [../BACKLOG.md](../BACKLOG.md)

| Reference | File | Use for |
|-----------|------|---------|
| Template | [SCORECARD-TEMPLATE.md](SCORECARD-TEMPLATE.md) | Capability questions |
| **Quality bar / exception gate** | [commerce-kernel-decision-gate.md](commerce-kernel-decision-gate.md) | Commerce checklist; adopt only if Product reopens |
| Medusa v2 | [medusa.md](medusa.md) | Order / cart / channel / reservation patterns |
| Vendure | [vendure.md](vendure.md) | Peer commerce patterns |
| OroCommerce | [oro.md](oro.md) | B2B account / pricing patterns |
| ERPNext | [erpnext.md](erpnext.md) | ERP / stock desk patterns (deferred) |
| Twenty | [twenty.md](twenty.md) | CRM visit/pipeline patterns (deferred) |
| Mautic | [mautic.md](mautic.md) | Marketing automation patterns (deferred) |

Keycloak / Metabase / Superset / Typesense: same rule — **reference for identity / BI / search capabilities**, not required products. Add a scorecard when we need a clearer checklist for that domain.
