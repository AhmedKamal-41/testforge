from fastapi.testclient import TestClient

from app.models.product import Product


def test_checkout_success(
    client: TestClient,
    auth_headers: dict[str, str],
    sample_products: list[Product],
) -> None:
    add = client.post(
        "/api/cart/items",
        headers=auth_headers,
        json={"product_id": sample_products[0].id, "quantity": 2},
    )
    assert add.status_code == 201, add.text

    resp = client.post("/api/checkout", headers=auth_headers)
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "placed"
    assert body["total"] == "39.98"
    assert len(body["items"]) == 1
    assert body["items"][0]["product_name"] == "Test Tee"
    assert body["items"][0]["quantity"] == 2

    cart = client.get("/api/cart", headers=auth_headers)
    assert cart.status_code == 200
    assert cart.json()["items"] == []


def test_checkout_failure_empty_cart(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    resp = client.post("/api/checkout", headers=auth_headers)
    assert resp.status_code == 400
    assert resp.json()["detail"] == "cart is empty"


def test_checkout_rejects_quantity_above_stock_without_partial_writes(
    client: TestClient,
    auth_headers: dict[str, str],
    sample_products: list[Product],
) -> None:
    """The atomic stock UPDATE must reject the checkout (no partial order
    rows), and stock must remain unchanged."""
    tight = sample_products[0]
    starting_stock = tight.stock

    over = client.post(
        "/api/cart/items",
        headers=auth_headers,
        json={"product_id": tight.id, "quantity": starting_stock + 1},
    )
    assert over.status_code == 201, over.text

    resp = client.post("/api/checkout", headers=auth_headers)
    assert resp.status_code == 400
    assert "insufficient stock" in resp.json()["detail"].lower()

    orders = client.get("/api/orders", headers=auth_headers)
    assert orders.status_code == 200
    assert orders.json() == []

    detail = client.get(f"/api/products/{tight.id}")
    assert detail.status_code == 200
    assert detail.json()["stock"] == starting_stock
