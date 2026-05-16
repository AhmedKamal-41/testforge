"""ShopLite database seed.

DEMO-ONLY: every credential here is a fake local/demo account used only for
development and automated tests. These are deliberately committed so a reviewer
can clone the repo and run the suite without provisioning real credentials.
No real secrets ever live in this file.
"""
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import CartItem, Order, OrderItem, Product, User  # noqa: F401  (register mappers)
from app.security import hash_password

SEED_USERS = [
    {
        "email": "admin@shoplite.io",
        "full_name": "Admin User",
        "password": "admin123",
        "role": "admin",
    },
    {
        "email": "user@shoplite.io",
        "full_name": "Sample Shopper",
        "password": "user1234",
        "role": "user",
    },
    {
        "email": "alice@shoplite.io",
        "full_name": "Alice Walker",
        "password": "alice123",
        "role": "user",
    },
]


SEED_PRODUCTS = [
    # apparel
    {"name": "Classic Tee", "category": "apparel", "price": "19.99", "stock": 50, "description": "Soft cotton tee."},
    {"name": "Hooded Sweatshirt", "category": "apparel", "price": "44.50", "stock": 30, "description": "Warm hoodie for cool days."},
    {"name": "Denim Jeans", "category": "apparel", "price": "59.00", "stock": 25, "description": "Slim fit denim."},
    {"name": "Canvas Sneakers", "category": "apparel", "price": "65.00", "stock": 40, "description": "Everyday sneakers."},
    # books
    {"name": "The Pragmatic Tester", "category": "books", "price": "29.99", "stock": 100, "description": "A book about testing."},
    {"name": "FastAPI in Action", "category": "books", "price": "39.99", "stock": 60, "description": "Build modern APIs."},
    {"name": "Designing Data Tests", "category": "books", "price": "34.50", "stock": 45, "description": "Robust data-layer tests."},
    {"name": "Playwright Patterns", "category": "books", "price": "27.00", "stock": 70, "description": "End-to-end patterns."},
    # electronics
    {"name": "Wireless Mouse", "category": "electronics", "price": "24.99", "stock": 80, "description": "Comfortable wireless mouse."},
    {"name": "Mechanical Keyboard", "category": "electronics", "price": "109.00", "stock": 35, "description": "Tactile mechanical keyboard."},
    {"name": "USB-C Hub", "category": "electronics", "price": "39.50", "stock": 55, "description": "7-in-1 USB-C hub."},
    {"name": "Noise-Cancelling Headphones", "category": "electronics", "price": "199.99", "stock": 20, "description": "Over-ear ANC headphones."},
    {"name": "27\" Monitor", "category": "electronics", "price": "279.00", "stock": 12, "description": "1440p IPS monitor."},
    # home
    {"name": "Ceramic Mug", "category": "home", "price": "12.00", "stock": 200, "description": "Microwave-safe mug."},
    {"name": "Scented Candle", "category": "home", "price": "18.99", "stock": 90, "description": "Vanilla bean candle."},
    {"name": "Throw Blanket", "category": "home", "price": "49.00", "stock": 40, "description": "Cozy fleece blanket."},
    {"name": "Desk Lamp", "category": "home", "price": "34.99", "stock": 35, "description": "Adjustable LED desk lamp."},
    # pantry
    {"name": "Single-Origin Coffee", "category": "pantry", "price": "16.50", "stock": 150, "description": "12 oz whole bean."},
    {"name": "Artisan Chocolate Bar", "category": "pantry", "price": "6.99", "stock": 250, "description": "70% dark cocoa."},
    {"name": "Olive Oil 500ml", "category": "pantry", "price": "13.99", "stock": 80, "description": "Extra virgin olive oil."},
]


def seed(db: Session) -> None:
    for u in SEED_USERS:
        existing = db.scalar(select(User).where(User.email == u["email"]))
        if existing is None:
            db.add(
                User(
                    email=u["email"],
                    full_name=u["full_name"],
                    hashed_password=hash_password(u["password"]),
                    role=u["role"],
                )
            )

    for p in SEED_PRODUCTS:
        existing = db.scalar(select(Product).where(Product.name == p["name"]))
        if existing is None:
            db.add(
                Product(
                    name=p["name"],
                    description=p.get("description", ""),
                    price=Decimal(p["price"]),
                    stock=p["stock"],
                    category=p["category"],
                    image_url=p.get("image_url", ""),
                )
            )

    db.commit()


def reset(db: Session) -> None:
    # Wipe in dependency order so foreign keys don't complain.
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()


def main() -> None:
    import argparse

    parser = argparse.ArgumentParser(description="Seed (and optionally reset) ShopLite data.")
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Drop and recreate all tables before seeding (destructive).",
    )
    args = parser.parse_args()

    if args.reset:
        print("Dropping and recreating all tables…")
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        if args.reset:
            reset(db)
        seed(db)
    print(f"Seeded {len(SEED_USERS)} users and {len(SEED_PRODUCTS)} products.")


if __name__ == "__main__":
    main()
