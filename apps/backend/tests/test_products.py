from fastapi.testclient import TestClient

from app.models.product import Product


def test_list_products_returns_seeded(client: TestClient, sample_products: list[Product]) -> None:
    resp = client.get("/api/products")
    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body, list)
    assert len(body) == 3
    names = {p["name"] for p in body}
    assert names == {"Test Tee", "Test Mug", "Test Book"}


def test_product_detail_returns_one(client: TestClient, sample_products: list[Product]) -> None:
    target = sample_products[0]
    resp = client.get(f"/api/products/{target.id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == target.id
    assert body["name"] == target.name
    assert body["category"] == target.category


def test_product_detail_404(client: TestClient) -> None:
    resp = client.get("/api/products/9999")
    assert resp.status_code == 404
