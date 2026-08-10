from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.routes import router
from app.config import get_settings
from app.db import Base, SessionLocal, engine
import app.models  # noqa: F401 — register ORM metadata before create_all
from app.services.uploads import uploads_root
from app.domains.commerce.routes import router as commerce_router
from app.domains.finance.routes import router as finance_domain_router
from app.domains.fulfillment.routes import router as fulfillment_router
from app.domains.inventory.routes import router as inventory_router
from app.domains.meta import meta_router
from app.domains.network.routes import router as network_router
from app.domains.product.routes import router as product_router
from app.domains.service.routes import router as service_router
from app.domains.support_routes import (
    governance_router,
    intelligence_router,
    relationship_router,
)
from app.seed.demo import seed_all


def ensure_schema() -> None:
    Base.metadata.create_all(bind=engine)
    if engine.dialect.name == "postgresql":
        with engine.begin() as conn:
            conn.execute(
                text(
                    "ALTER TABLE system_settings "
                    "ADD COLUMN IF NOT EXISTS live_rate_override BIGINT"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE deliveries "
                    "ADD COLUMN IF NOT EXISTS proforma_id VARCHAR(64)"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE deliveries "
                    "ADD COLUMN IF NOT EXISTS uids JSONB DEFAULT '[]'::jsonb"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE skus "
                    "ADD COLUMN IF NOT EXISTS producer_org VARCHAR(255)"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE campaigns "
                    "ADD COLUMN IF NOT EXISTS fired_count INTEGER NOT NULL DEFAULT 0"
                )
            )
            conn.execute(
                text(
                    "ALTER TABLE campaigns "
                    "ADD COLUMN IF NOT EXISTS last_fired_label VARCHAR(64)"
                )
            )
            for stmt in (
                "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'active'",
                "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city VARCHAR(128)",
                "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address VARCHAR(512)",
                "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone VARCHAR(64)",
                "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS union_license VARCHAR(128)",
                "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS national_id VARCHAR(64)",
                "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS summary TEXT",
                "ALTER TABLE organizations ADD COLUMN IF NOT EXISTS profile JSONB NOT NULL DEFAULT '{}'::jsonb",
                "ALTER TABLE producer_settlements ADD COLUMN IF NOT EXISTS zarrin_ref VARCHAR(128)",
                "ALTER TABLE producer_settlements ADD COLUMN IF NOT EXISTS zarrin_status VARCHAR(64)",
                "ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS zarrin_ref VARCHAR(128)",
                "ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS zarrin_status VARCHAR(64)",
                "ALTER TABLE credit_documents ADD COLUMN IF NOT EXISTS settlement_channel VARCHAR(32)",
                "ALTER TABLE credit_documents ADD COLUMN IF NOT EXISTS settlement_notes TEXT NOT NULL DEFAULT ''",
                "ALTER TABLE credit_documents ADD COLUMN IF NOT EXISTS settled_label VARCHAR(64)",
                "ALTER TABLE credit_documents ADD COLUMN IF NOT EXISTS origin_channel VARCHAR(32)",
            ):
                conn.execute(text(stmt))


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_schema()
    settings = get_settings()
    if settings.demo_seed:
        db = SessionLocal()
        try:
            seed_all(db)
        finally:
            db.close()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Didar Gold API",
        version="0.3.0",
        description="Domain-oriented operational ledger API — roles get permissions on domains.",
        lifespan=lifespan,
    )
    origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router, prefix="/api/v1")
    app.include_router(network_router, prefix="/api/v1")
    app.include_router(product_router, prefix="/api/v1")
    app.include_router(inventory_router, prefix="/api/v1")
    app.include_router(commerce_router, prefix="/api/v1")
    app.include_router(fulfillment_router, prefix="/api/v1")
    app.include_router(finance_domain_router, prefix="/api/v1")
    app.include_router(service_router, prefix="/api/v1")
    app.include_router(governance_router, prefix="/api/v1")
    app.include_router(relationship_router, prefix="/api/v1")
    app.include_router(intelligence_router, prefix="/api/v1")
    app.include_router(meta_router, prefix="/api/v1")

    media_root = uploads_root()
    media_root.mkdir(parents=True, exist_ok=True)
    (media_root / "products").mkdir(parents=True, exist_ok=True)
    app.mount(
        "/media",
        StaticFiles(directory=str(media_root)),
        name="media",
    )
    return app


app = create_app()
