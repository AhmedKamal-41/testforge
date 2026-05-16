"""products soft delete (is_active, deleted_at)

Revision ID: 0002_product_soft_delete
Revises: 0001_initial
Create Date: 2026-05-16

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

revision: str = "0002_product_soft_delete"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
    )
    op.add_column(
        "products",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_products_is_active", "products", ["is_active"])


def downgrade() -> None:
    op.drop_index("ix_products_is_active", table_name="products")
    op.drop_column("products", "deleted_at")
    op.drop_column("products", "is_active")
