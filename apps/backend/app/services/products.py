from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.product import Product


def list_products(db: Session) -> list[Product]:
    return list(
        db.scalars(select(Product).where(Product.is_active.is_(True)).order_by(Product.id))
    )


def get_product(db: Session, product_id: int) -> Product | None:
    """Public lookup: returns the product only when it is still active."""
    product = db.get(Product, product_id)
    if product is None or not product.is_active:
        return None
    return product


def get_product_admin(db: Session, product_id: int) -> Product | None:
    """Admin lookup: includes soft-deleted products."""
    return db.get(Product, product_id)


def create_product(db: Session, data: dict) -> Product:
    product = Product(**data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product_id: int, data: dict) -> Product | None:
    product = get_product_admin(db, product_id)
    if product is None:
        return None
    for k, v in data.items():
        if v is not None:
            setattr(product, k, v)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> bool:
    """Soft-delete: flip is_active off and stamp deleted_at. Historical
    order_items already store product_name + unit_price, so order history is
    unaffected."""
    product = get_product_admin(db, product_id)
    if product is None or not product.is_active:
        return False
    product.is_active = False
    product.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return True
