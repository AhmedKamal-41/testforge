import os
import sys
from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

os.environ.setdefault("TEST_DATABASE_URL", "sqlite:///./shoplite_test.db")
os.environ["DATABASE_URL"] = os.environ["TEST_DATABASE_URL"]

from app.database import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402
from app.models.product import Product  # noqa: E402
from app.models.user import User  # noqa: E402
from app.security import hash_password  # noqa: E402

connect_args = {"check_same_thread": False} if os.environ["TEST_DATABASE_URL"].startswith("sqlite") else {}
test_engine = create_engine(os.environ["TEST_DATABASE_URL"], connect_args=connect_args, future=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def _create_schema() -> Generator[None, None, None]:
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def db() -> Generator[Session, None, None]:
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.rollback()
        for table in reversed(Base.metadata.sorted_tables):
            session.execute(table.delete())
        session.commit()
        session.close()


@pytest.fixture()
def client(db: Session) -> Generator[TestClient, None, None]:
    def _override_get_db() -> Generator[Session, None, None]:
        yield db

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def regular_user(db: Session) -> User:
    user = User(
        email="user@example.com",
        full_name="Regular User",
        hashed_password=hash_password("password123"),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def admin_user(db: Session) -> User:
    user = User(
        email="admin@example.com",
        full_name="Admin User",
        hashed_password=hash_password("admin1234"),
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def auth_headers(client: TestClient, regular_user: User) -> dict[str, str]:
    resp = client.post(
        "/api/auth/login",
        json={"email": regular_user.email, "password": "password123"},
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def sample_products(db: Session) -> list[Product]:
    products = [
        Product(name="Test Tee", description="A tee", price="19.99", stock=10, category="apparel"),
        Product(name="Test Mug", description="A mug", price="12.00", stock=20, category="home"),
        Product(name="Test Book", description="A book", price="29.99", stock=15, category="books"),
    ]
    db.add_all(products)
    db.commit()
    for p in products:
        db.refresh(p)
    return products
