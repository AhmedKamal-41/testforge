from decimal import Decimal

from sqlalchemy import update
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.user import User
from app.services.cart import clear_cart, list_cart_items


class CheckoutError(Exception):
    pass


def checkout(db: Session, user: User) -> Order:
    """Place an order for the user's current cart.

    Concurrency: stock is decremented with an atomic conditional UPDATE
    (`stock = stock - q WHERE id = ? AND is_active AND stock >= q`). Two
    racing checkouts cannot both pass the gate — the second one's rowcount
    is 0, we raise CheckoutError, and the surrounding transaction rolls
    back, so the order row and any earlier order_items in this attempt are
    never persisted.
    """
    items = list_cart_items(db, user)
    if not items:
        raise CheckoutError("cart is empty")

    for item in items:
        if not item.product.is_active:
            raise CheckoutError(f"{item.product.name} is no longer available")

    total = sum((Decimal(i.product.price) * i.quantity for i in items), Decimal("0"))

    try:
        order = Order(user_id=user.id, total=total, status="placed")
        db.add(order)
        db.flush()

        for item in items:
            result = db.execute(
                update(Product)
                .where(
                    Product.id == item.product.id,
                    Product.is_active.is_(True),
                    Product.stock >= item.quantity,
                )
                .values(stock=Product.stock - item.quantity)
            )
            if result.rowcount == 0:
                raise CheckoutError(f"insufficient stock for {item.product.name}")

            db.add(
                OrderItem(
                    order_id=order.id,
                    product_id=item.product.id,
                    product_name=item.product.name,
                    unit_price=item.product.price,
                    quantity=item.quantity,
                )
            )

        clear_cart(db, user)
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(order)
    return order
