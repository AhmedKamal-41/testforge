"""Postgres-backed checkout integration tests.

Run: `pytest -m postgres`

These exercise transactional behavior that SQLite can't fairly model —
concurrent stock decrement, FK relationships, and partial-write rollback.
"""
from __future__ import annotations

import threading

import pytest
from sqlalchemy.orm import Session, sessionmaker

from app.models.cart_item import CartItem
from app.models.order import Order
from app.models.order_item import OrderItem
from app.models.product import Product
from app.models.user import User
from app.services import checkout as checkout_svc

pytestmark = pytest.mark.postgres


def _add_to_cart(session: Session, user: User, product: Product, qty: int) -> None:
    session.add(CartItem(user_id=user.id, product_id=product.id, quantity=qty))
    session.commit()


def test_checkout_creates_order_in_postgres(pg_session, pg_user, pg_product):
    _add_to_cart(pg_session, pg_user, pg_product, qty=1)

    order = checkout_svc.checkout(pg_session, pg_user)

    persisted = pg_session.get(Order, order.id)
    assert persisted is not None
    assert persisted.user_id == pg_user.id
    assert persisted.status == "placed"


def test_checkout_creates_order_items_per_cart_line(pg_session, pg_user, pg_product):
    other = Product(name="Second", description="", price="9.99", stock=5, category="x")
    pg_session.add(other)
    pg_session.commit()
    pg_session.refresh(other)

    _add_to_cart(pg_session, pg_user, pg_product, qty=2)
    _add_to_cart(pg_session, pg_user, other, qty=1)

    order = checkout_svc.checkout(pg_session, pg_user)

    items = (
        pg_session.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    )
    assert len(items) == 2
    by_product = {i.product_id: i for i in items}
    assert by_product[pg_product.id].quantity == 2
    assert by_product[other.id].quantity == 1
    assert by_product[pg_product.id].product_name == pg_product.name


def test_cart_unique_constraint_merges_same_product(pg_session, pg_user, pg_product):
    """`uq_cart_user_product` should prevent duplicate (user, product) rows.
    The cart service handles the merge by incrementing quantity instead."""
    from app.services.cart import add_item

    add_item(pg_session, pg_user, pg_product.id, quantity=1)
    add_item(pg_session, pg_user, pg_product.id, quantity=2)

    rows = (
        pg_session.query(CartItem)
        .filter(CartItem.user_id == pg_user.id, CartItem.product_id == pg_product.id)
        .all()
    )
    assert len(rows) == 1
    assert rows[0].quantity == 3


def test_checkout_persists_stock_decrement(pg_session, pg_user, pg_product):
    starting = pg_product.stock
    _add_to_cart(pg_session, pg_user, pg_product, qty=2)

    checkout_svc.checkout(pg_session, pg_user)

    pg_session.expire_all()
    fresh = pg_session.get(Product, pg_product.id)
    assert fresh.stock == starting - 2


def test_checkout_rolls_back_on_insufficient_stock(pg_session, pg_user, pg_product):
    """Asking for more than `stock` must leave no order, no order_items,
    and stock unchanged."""
    _add_to_cart(pg_session, pg_user, pg_product, qty=pg_product.stock + 5)

    with pytest.raises(checkout_svc.CheckoutError):
        checkout_svc.checkout(pg_session, pg_user)

    pg_session.expire_all()
    assert pg_session.query(Order).filter(Order.user_id == pg_user.id).count() == 0
    assert pg_session.query(OrderItem).count() == 0
    fresh = pg_session.get(Product, pg_product.id)
    assert fresh.stock == pg_product.stock


def test_concurrent_checkout_cannot_oversell(pg_schema, pg_engine):
    """Two threads each try to buy the last unit. Atomic UPDATE must let
    exactly one succeed; the other must raise CheckoutError. Stock ends at
    0, never negative."""
    Local = sessionmaker(bind=pg_schema, autocommit=False, autoflush=False, class_=Session)

    setup = Local()
    try:
        u1 = User(
            email="c1@example.com",
            full_name="C1",
            hashed_password="x",
            role="user",
        )
        u2 = User(
            email="c2@example.com",
            full_name="C2",
            hashed_password="x",
            role="user",
        )
        product = Product(
            name="Last One",
            description="Singular.",
            price="100.00",
            stock=1,
            category="apparel",
        )
        setup.add_all([u1, u2, product])
        setup.commit()
        setup.refresh(u1)
        setup.refresh(u2)
        setup.refresh(product)
        pid = product.id
        u1_id, u2_id = u1.id, u2.id

        setup.add_all(
            [
                CartItem(user_id=u1.id, product_id=pid, quantity=1),
                CartItem(user_id=u2.id, product_id=pid, quantity=1),
            ]
        )
        setup.commit()
    finally:
        setup.close()

    results: list[str] = []
    barrier = threading.Barrier(2)

    def attempt(user_id: int) -> None:
        s = Local()
        try:
            u = s.get(User, user_id)
            barrier.wait()
            try:
                checkout_svc.checkout(s, u)
                results.append("ok")
            except checkout_svc.CheckoutError:
                results.append("denied")
        finally:
            s.close()

    t1 = threading.Thread(target=attempt, args=(u1_id,))
    t2 = threading.Thread(target=attempt, args=(u2_id,))
    t1.start()
    t2.start()
    t1.join()
    t2.join()

    assert sorted(results) == ["denied", "ok"], f"unexpected: {results}"

    verify = Local()
    try:
        final = verify.get(Product, pid)
        assert final.stock == 0, f"stock went past zero: {final.stock}"
    finally:
        verify.close()
