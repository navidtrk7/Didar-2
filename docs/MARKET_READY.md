# Didar — Market-ready production plan (PM)

**Owner:** Eng acting as Product on deadline  
**Goal:** Pilot-ready product customers can operate end-to-end.  
**Live:** https://didar.cls9.com  
**Last updated:** 2026-08-10

## Pilot promise (what we sell this week)

A signed-in ops user can run gold flow without lying UI:

1. **Producer → QC → UID**
2. **Agent proforma / retailer order** on one order spine
3. **Allocate → pick/pack/handover → deliver**
4. **Custody transfer + discrepancy**
5. **Warranty (post-delivery) / buyback quote + close**
6. **Producer settlement** via Zarrin **test** adapter

## Explicitly cut (not blocking pilot)

| Cut | Why |
|-----|-----|
| OTP SMS | Demo code stays; labeled |
| Live Zarrin credentials | Adapter shapes ready; flip env later |
| Medusa / Twenty / Mautic / Keycloak | Pattern refs only — build in Didar when needed; not install targets |
| Designs / promotions / Intelligence / CRM / pricing depth | Parked, honest |
| Perfect multi-party ERP | Not pilot |

## Sprint board

| Priority | Item | Status |
|----------|------|--------|
| P0 | Order glue + credit + warranty + health/reseed | **Done** |
| P0 | Zarrin test adapter + settlement/buyback ledger | **Done** |
| P0 | Custody discrepancy | **Done** |
| P0 | **Active-role menus** (multi-grant → switch hat) | **Done** (live) |
| P1 | E2E pilot smoke script (full gold loop) | **Done** — `scripts/pilot_smoke.py` → **32/32 OK** live |
| P1 | Prod harden (`DEMO_SEED=false`, JWT rotate) when customer data starts | Checklist below — flip when real data arrives |
| P2 | Handbook sync + backup runbook | **Done** — `/app/help` pilot strip + handbook; backup below |
| P1 | Trust settle (verbal/phone/cash) + party trust_tier | **Done** — smoke **35/35** live |
| P1 | Entity Profile mindset in Network | **Done** — readiness + staged checklist + seed backfill |

## Live smoke (2026-08-10)

Command:

```bash
python3 scripts/pilot_smoke.py https://didar.cls9.com/api/v1
```

Green path proven:

- Logins (admin/qc/retailer/agent/warehouse/finance/producer)
- Multi-role agent+warehouse
- Producer → QC → UID
- Retailer order → allocate → fulfillment (`picking`)
- Fulfillment advance → demo OTP → `delivered`
- Warranty accepts after delivery; rejects undelivered
- Buyback quote → open (delivered only) → close via Zarrin test + `zarrin_ref`
- Agent price lock → proforma
- Settlement → Zarrin test adapter + `zarrin_ref`
- Custody discrepancy open/resolve
- Reseed unauth blocked

## Postgres backup (runbook)

On the host, before first real onboarding or any env flip:

```bash
# live volume (2026-08): didar-api_didar_pgdata
VOL=$(docker volume ls -q | grep didar | grep pgdata | head -1)
mkdir -p /root/didar-backups
docker run --rm \
  -v "$VOL":/var/lib/postgresql/data:ro \
  -v /root/didar-backups:/backup \
  alpine tar czf /backup/didar-pg-$(date +%Y%m%d-%H%M).tgz -C /var/lib/postgresql/data .
ls -lh /root/didar-backups | tail
```

Restore is a stop-api → extract into volume → start-api drill — practice once on a staging copy, not on live pilot DB.

## Go-live harden (before real customer data)

On server `/var/www/didar-api/.env` (do **not** flip while demo training is active):

1. `DEMO_SEED=false`
2. Rotate `JWT_SECRET` (forces re-login)
3. Keep `ZARRIN_MODE=test` until keys; then `live` + URL/key
4. `ALLOW_DESTRUCTIVE_ADMIN=false`
5. Postgres volume backup before first real onboarding
6. Re-run `scripts/pilot_smoke.py` after env change (logins will need real passwords)

## Decision log

- Build what the product needs on the custom spine; use Medusa/Twenty/etc. as **pattern refs for what to develop**, not as install targets.
- One Order spine for retailer + agent.
- Zarrin boundary = adapter with production payload shapes (test mode until keys).
- Menus follow **active role** among grants, not primary-only.
