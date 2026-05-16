"""Integration tests against a real PostgreSQL instance.

Opt-in: `pytest -m postgres`. Requires the docker compose stack to be up
(or any reachable Postgres) — the URL is read from `POSTGRES_TEST_URL`,
defaulting to the compose-mapped local Postgres.

These tests run in their own schema-isolated transactions per test, so
they don't pollute the shared seeded database the rest of the stack uses.
"""
from __future__ import annotations

import os
import sys
import uuid
from collections.abc import Generator
from pathlib import Path

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

BACKEND_ROOT = Path(__file__).resolve().parents[2]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.database import Base  # noqa: E402
from app.models.product import Product  # noqa: E402
from app.models.user import User  # noqa: E402
from app.security import hash_password  # noqa: E402

POSTGRES_URL = os.environ.get(
    "POSTGRES_TEST_URL",
    "postgresql+psycopg://shoplite:shoplite@127.0.0.1:5433/shoplite",
)


@pytest.fixture(scope="session")
def pg_engine():
    """Module-scoped engine pointing at the dev Postgres. Skips the whole
    integration suite if Postgres is unreachable."""
    try:
        engine = create_engine(POSTGRES_URL, future=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:
        pytest.skip(f"PostgreSQL not reachable at {POSTGRES_URL}: {exc}")
    return engine


@pytest.fixture()
def pg_schema(pg_engine):
    """Create a fresh schema per test, set search_path to it, install the
    full app DDL, then drop the schema after the test. Total isolation
    from the seeded dev database."""
    schema = f"itest_{uuid.uuid4().hex[:12]}"
    with pg_engine.begin() as conn:
        conn.execute(text(f'CREATE SCHEMA "{schema}"'))

    test_engine = create_engine(
        POSTGRES_URL,
        future=True,
        connect_args={"options": f"-csearch_path={schema}"},
    )
    Base.metadata.create_all(bind=test_engine)

    yield test_engine

    test_engine.dispose()
    with pg_engine.begin() as conn:
        conn.execute(text(f'DROP SCHEMA "{schema}" CASCADE'))


@pytest.fixture()
def pg_session(pg_schema) -> Generator[Session, None, None]:
    Local = sessionmaker(bind=pg_schema, autocommit=False, autoflush=False, class_=Session)
    s = Local()
    try:
        yield s
    finally:
        s.close()


@pytest.fixture()
def pg_user(pg_session: Session) -> User:
    u = User(
        email="itest-user@example.com",
        full_name="Integration User",
        hashed_password=hash_password("password123"),
        role="user",
    )
    pg_session.add(u)
    pg_session.commit()
    pg_session.refresh(u)
    return u


@pytest.fixture()
def pg_product(pg_session: Session) -> Product:
    p = Product(
        name="Limited Edition",
        description="Only a few left.",
        price="49.99",
        stock=3,
        category="apparel",
    )
    pg_session.add(p)
    pg_session.commit()
    pg_session.refresh(p)
    return p
