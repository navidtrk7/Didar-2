# Commerce Core evaluation (Didar) — pattern study

**Purpose:** Study mature commerce platforms to learn **what capabilities and boundaries Didar should own**.  
**Not purpose:** choose / install / cut over to Medusa or Oro as Didar’s runtime.

Independent of the Didar application codebase. No Medusa/Oro core forks. No UID / OTP / Zarrin / custody implementation in the sandbox.

**Living status board:** [../BACKLOG.md](../BACKLOG.md) · **Capability map:** [../capability-map.md](../capability-map.md) · **Scorecards:** [../architecture-discovery/](../architecture-discovery/)

**Default after this study:** keep growing the **custom Didar Order spine** toward the quality bar these platforms demonstrate.

## Deliverables

| File | Purpose |
|------|---------|
| [01-medusa-sandbox.md](01-medusa-sandbox.md) | How the Medusa v2 demo was stood up + native checklist results |
| [02-medusa-fitgap.md](02-medusa-fitgap.md) | Fit-Gap vs Didar needs — what shapes to build in Didar |
| [03-oro-fit-matrix.md](03-oro-fit-matrix.md) | OroCommerce CE scored on the same Didar-process criteria |
| [04-comparative-memo.md](04-comparative-memo.md) | Least custom + least lock-in *patterns* (not a platform pick) |
| [artifacts/medusa-demo-report.json](artifacts/medusa-demo-report.json) | Machine evidence from live Admin/Store API E2E |
| [scripts/medusa_e2e_demo.py](scripts/medusa_e2e_demo.py) | Reproducible demo script |

## Sandbox location

Medusa app (sibling of Didar, **not** production):

`/Users/meysam/Desktop/Code/didar-medusa-eval`

- Backend + Admin: `http://127.0.0.1:9000` / `http://127.0.0.1:9000/app`
- Admin user: `admin@didar-eval.local` / `DidarEval123!`
- Postgres DB: `didar_medusa_eval`
- Medusa version: **2.18.0** (stock `@medusajs/*`, no core edits)

## Legend (Fit-Gap labels)

- **Native** — works out of the box *in that platform* (lesson for Didar’s bar)
- **Configuration** — admin/config only, no code
- **Extension Required** — workflow hook, subscriber, API route, admin widget, or module link on top of core
- **Custom Module Required** — new domain model/service owned by Didar, linked to commerce entities
- **Not Supported** — not a realistic fit without replacing the platform concern

## Out of scope (owner)

UID, OTP handover, Zarrin, warranty, buyback, custody, shipping Didar product features inside the sandbox, and **selecting an external runtime**.
