"""Baseline schema for Didar API.

Revision ID: 0001_baseline
Revises:
Create Date: 2026-08-07
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_baseline"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Tables are also created via Base.metadata.create_all on startup.
    # This revision stamps the live schema and adds columns used by ops.
    op.execute(
        "ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS live_rate_override BIGINT"
    )
    op.execute(
        "ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS proforma_id VARCHAR(64)"
    )
    op.execute(
        "ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS uids JSONB DEFAULT '[]'::jsonb"
    )


def downgrade() -> None:
    op.execute("ALTER TABLE deliveries DROP COLUMN IF EXISTS uids")
    op.execute("ALTER TABLE deliveries DROP COLUMN IF EXISTS proforma_id")
    op.execute("ALTER TABLE system_settings DROP COLUMN IF EXISTS live_rate_override")
