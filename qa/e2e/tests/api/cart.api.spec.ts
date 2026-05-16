import { expect, test } from "../../fixtures/test";
import { resetDatabase } from "../../utils/db-utils";

test.describe("cart API @api", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    await resetDatabase();
  });

  test.beforeEach(async ({ userApi }) => {
    await userApi.clearCart();
  });

  test("GET /api/cart returns 401 without a token", async ({ request }) => {
    const resp = await request.get("/api/cart");

    expect(resp.status()).toBe(401);
  });

  test("GET /api/cart returns an empty cart for a user with nothing in it", async ({
    request,
    userAuth,
  }) => {
    const resp = await request.get("/api/cart", {
      headers: { Authorization: `Bearer ${userAuth.token}` },
    });

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.items).toEqual([]);
    expect(Number(body.total)).toBe(0);
  });

  test("POST /api/cart/items returns 401 without a token", async ({ request }) => {
    const resp = await request.post("/api/cart/items", { data: { product_id: 1, quantity: 1 } });

    expect(resp.status()).toBe(401);
  });

  test("POST /api/cart/items adds the product and returns the updated cart with 201", async ({
    request,
    userAuth,
  }) => {
    const products = await request.get("/api/products").then((r) => r.json());
    const target = products[0];

    const resp = await request.post("/api/cart/items", {
      headers: { Authorization: `Bearer ${userAuth.token}` },
      data: { product_id: target.id, quantity: 1 },
    });

    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].product.id).toBe(target.id);
    expect(body.items[0].quantity).toBe(1);
    expect(body.items[0].line_total).toBe(target.price);
    expect(body.total).toBe(target.price);
  });

  test("POST /api/cart/items returns 404 when the product does not exist", async ({
    request,
    userAuth,
  }) => {
    const resp = await request.post("/api/cart/items", {
      headers: { Authorization: `Bearer ${userAuth.token}` },
      data: { product_id: 999999, quantity: 1 },
    });

    expect(resp.status()).toBe(404);
    const body = await resp.json();
    expect(body.detail).toBe("product not found");
  });

  test("POST /api/cart/items returns 422 when quantity is zero", async ({
    request,
    userAuth,
  }) => {
    const products = await request.get("/api/products").then((r) => r.json());

    const resp = await request.post("/api/cart/items", {
      headers: { Authorization: `Bearer ${userAuth.token}` },
      data: { product_id: products[0].id, quantity: 0 },
    });

    expect(resp.status()).toBe(422);
    const body = await resp.json();
    expect(body.detail.some((e: { loc: string[] }) => e.loc.includes("quantity"))).toBe(true);
  });

  test("DELETE /api/cart/items/{id} returns 404 for an item that does not exist", async ({
    request,
    userAuth,
  }) => {
    const resp = await request.delete("/api/cart/items/999999", {
      headers: { Authorization: `Bearer ${userAuth.token}` },
    });

    expect(resp.status()).toBe(404);
    const body = await resp.json();
    expect(body.detail).toBe("cart item not found");
  });
});
