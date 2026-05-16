from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.cart_item import CartItem
from app.models.product import Product
from app.models.user import User


def list_cart_items(db: Session, user: User) -> list[CartItem]:
    stmt = (
        select(CartItem)
        .where(CartItem.user_id == user.id)
        .options(selectinload(CartItem.product))
        .order_by(CartItem.id)
    )
    return list(db.scalars(stmt))


def cart_total(items: list[CartItem]) -> Decimal:
    return sum((Decimal(i.product.price) * i.quantity for i in items), Decimal("0"))


def add_item(db: Session, user: User, product_id: int, quantity: int) -> CartItem:
    product = db.get(Product, product_id)
    if product is None or not product.is_active:
        raise LookupError("product not found")

    existing = db.scalar(
        select(CartItem).where(CartItem.user_id == user.id, CartItem.product_id == product_id)
    )
    if existing is None:
        item = CartItem(user_id=user.id, product_id=product_id, quantity=quantity)
        db.add(item)
        db.flush()
    else:
        existing.quantity += quantity
        item = existing

    db.commit()
    db.refresh(item)
    return item


def remove_item(db: Session, user: User, item_id: int) -> None:
    item = db.scalar(select(CartItem).where(CartItem.id == item_id, CartItem.user_id == user.id))
    if item is None:
        raise LookupError("cart item not found")
    db.delete(item)
    db.commit()


def clear_cart(db: Session, user: User) -> None:
    for item in list_cart_items(db, user):
        db.delete(item)
    db.flush()
