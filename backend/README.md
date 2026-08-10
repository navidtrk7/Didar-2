# Didar Gold API

FastAPI modular monolith. Append-only `domain_events` + projection tables.
No blockchain.

## Layout

| Environment | Path |
|-------------|------|
| Local repo | `backend/` (separate from Next.js app root) |
| Production | `/var/www/didar-api` (separate from `/var/www/didar`) |

## Where we are

Interactive slice is live behind JWT:

- Auth login / me
- SKU create + send to QC + complete QC
- UID issue → vault + dual ledger receipt
- Price lock + proforma → credit + dual ledger sale
- Rate requests / craft rules / settings
- Adjustments, delivery from proforma + OTP, retailer orders
- Credit settle + finance summary
- Invite / activate / suspend users
- Public verify by UID
- Platform snapshot for the UI
- Alembic baseline under `alembic/` (OTP is fixed `1234`; no SMS / no DB backup yet)

Seed data loads on startup (`DEMO_SEED=true`) and can be force-reset via `POST /api/v1/admin/reseed` (admin). Wipe before real business.

## Event catalog (core writes)

| Event | Side effects |
|-------|----------------|
| `sku.created` / `sku.sent_to_qc` | SKU + QC queue |
| `qc.completed` | SKU status; pass seals weight |
| `uid.issued` | Sealed asset; vault++; ledger receipt |
| `price.locked` | TTL lock |
| `proforma.issued` | Credit used; assets reserved; ledger sale |
| `rate.*` / `adjustment.created` / `delivery.completed` / `order.submitted` | Matching projections |

## Run locally

Requires **Python 3.10–3.13**.

```bash
cd backend
python3.10 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Docs: http://127.0.0.1:8000/docs

## Production

```bash
cd /var/www/didar-api
docker compose up -d          # Postgres on 127.0.0.1:5436
pm2 restart didar-api         # 127.0.0.1:8014
```

Nginx: `https://didar.cls9.com/api/v1/` → `127.0.0.1:8014`
