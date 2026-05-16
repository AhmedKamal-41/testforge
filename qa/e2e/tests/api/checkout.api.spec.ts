import { expect, test } from "../../fixtures/test";
import { resetDatabase } from "../../utils/db-utils";

test.describe("checkout API @api", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    await resetDatabase();
  });

  test.beforeEach(async ({ userApi }) => {
    await userApi.clearCart();
  });

  test("POST /api/checkout returns 401 without a token", async ({ request }) => {
    const resp = await request.post("/api/checkout");

    expect(resp.status()).toBe(401);
  });

  test("POST /api/checkout returns 400 with 'cart is empty' for an empty cart", async ({
    request,
    userAuth,
  }) => {
    const resp = await request.post("/api/checkout", {
      headers: { Authorization: `Bearer ${userAuth.token}` },
    });

    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body.detail).toBe("cart is empty");
  });

  test("POST /api/checkout returns 201 with an order matching the cart contents", async ({
    request,
    userAuth,
    userApi,
  }) => {
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[0].id);
    await userApi.addCartItem(products[1].id);
    await userApi.addCartItem(products[1].id);
    const cartBefore = await userApi.getCart();

    const resp = await request.post("/api/checkout", {
      headers: { Authorization: `Bearer ${userAuth.token}` },
    });

    expect(resp.status()).toBe(201);
    const order = await resp.json();
    expect(typeof order.id).toBe("number");
    expect(order.status).toBe("placed");
    expect(order.total).toBe(cartBefore.total);
    expect(typeof order.created_at).toBe("string");
    expect(order.items).toHaveLength(2);

    const products1Line = order.items.find((it: { product_id: number }) => it.product_id === products[1].id);
    expect(products1Line.quantity).toBe(2);
    expect(products1Line.product_name).toBe(products[1].name);
    expect(products1Line.unit_price).toBe(products[1].price);
  });

  test("POST /api/checkout decrements stock by the purchased quantity", async ({
    request,
    userAuth,
    userApi,
  }) => {
    const products = await userApi.listProducts();
    const target = products[0];
    const stockBefore = target.stock;

    await userApi.addCartItem(target.id);
    await userApi.addCartItem(target.id);

    const resp = await request.post("/api/checkout", {
      headers: { Authorization: `Bearer ${userAuth.token}` },
    });
    expect(resp.status()).toBe(201);

    const updated = await request.get(`/api/products/${target.id}`).then((r) => r.json());
    expect(updated.stock).toBe(stockBefore - 2);
  });
});
