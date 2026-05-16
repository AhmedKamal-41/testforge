import { expect, test } from "../../fixtures/test";
import { resetDatabase } from "../../utils/db-utils";

test.describe("orders API @api", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("GET /api/orders returns 401 without a token", async ({ request }) => {
    const resp = await request.get("/api/orders");

    expect(resp.status()).toBe(401);
  });

  test("GET /api/orders returns an empty list for a user with no order history", async ({
    request,
    userAuth,
  }) => {
    const resp = await request.get("/api/orders", {
      headers: { Authorization: `Bearer ${userAuth.token}` },
    });

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body).toEqual([]);
  });

  test("GET /api/orders returns each placed order with full line-item shape", async ({
    request,
    userAuth,
    userApi,
  }) => {
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[0].id);
    const placed = await userApi.checkout();

    const resp = await request.get("/api/orders", {
      headers: { Authorization: `Bearer ${userAuth.token}` },
    });

    expect(resp.status()).toBe(200);
    const orders = await resp.json();
    expect(orders).toHaveLength(1);
    const order = orders[0];
    expect(order.id).toBe(placed.id);
    expect(order.status).toBe("placed");
    expect(order.items).toHaveLength(1);
    expect(order.items[0].product_id).toBe(products[0].id);
    expect(order.items[0].product_name).toBe(products[0].name);
    expect(order.items[0].quantity).toBe(1);
  });

  test("GET /api/orders/{id} returns the user's own order", async ({
    request,
    userAuth,
    userApi,
  }) => {
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[2].id);
    const placed = await userApi.checkout();

    const resp = await request.get(`/api/orders/${placed.id}`, {
      headers: { Authorization: `Bearer ${userAuth.token}` },
    });

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.id).toBe(placed.id);
    expect(body.items[0].product_id).toBe(products[2].id);
  });

  test("GET /api/orders/{id} returns 404 when the order belongs to another user", async ({
    request,
    userAuth,
    adminApi,
    userApi,
  }) => {
    const products = await userApi.listProducts();
    await adminApi.addCartItem(products[3].id);
    const adminOrder = await adminApi.checkout();

    const resp = await request.get(`/api/orders/${adminOrder.id}`, {
      headers: { Authorization: `Bearer ${userAuth.token}` },
    });

    expect(resp.status()).toBe(404);
    const body = await resp.json();
    expect(body.detail).toBe("order not found");
  });
});
