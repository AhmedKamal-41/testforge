import { expect, test } from "../../fixtures/test";
import { makeProduct } from "../../factories/test-data";
import { resetDatabase } from "../../utils/db-utils";

test.describe("admin products API @api", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("POST /api/admin/products returns 401 without a token", async ({ request }) => {
    const resp = await request.post("/api/admin/products", { data: makeProduct() });

    expect(resp.status()).toBe(401);
  });

  test("POST /api/admin/products returns 403 for a regular user", async ({
    request,
    userAuth,
  }) => {
    const resp = await request.post("/api/admin/products", {
      headers: { Authorization: `Bearer ${userAuth.token}` },
      data: makeProduct(),
    });

    expect(resp.status()).toBe(403);
    const body = await resp.json();
    expect(body.detail).toBe("admin only");
  });

  test("POST /api/admin/products returns 201 and the created product for an admin", async ({
    request,
    adminAuth,
  }) => {
    const payload = makeProduct({ name: `API Created ${Date.now()}` });

    const resp = await request.post("/api/admin/products", {
      headers: { Authorization: `Bearer ${adminAuth.token}` },
      data: payload,
    });

    expect(resp.status()).toBe(201);
    const body = await resp.json();
    expect(typeof body.id).toBe("number");
    expect(body.name).toBe(payload.name);
    expect(body.price).toBe(payload.price);
    expect(body.stock).toBe(payload.stock);
    expect(body.category).toBe(payload.category);
  });

  test("POST /api/admin/products returns 422 when name is missing", async ({
    request,
    adminAuth,
  }) => {
    const { name: _omit, ...withoutName } = makeProduct();

    const resp = await request.post("/api/admin/products", {
      headers: { Authorization: `Bearer ${adminAuth.token}` },
      data: withoutName,
    });

    expect(resp.status()).toBe(422);
    const body = await resp.json();
    expect(body.detail.some((e: { loc: string[] }) => e.loc.includes("name"))).toBe(true);
  });

  test("POST /api/admin/products returns 422 when price is negative", async ({
    request,
    adminAuth,
  }) => {
    const resp = await request.post("/api/admin/products", {
      headers: { Authorization: `Bearer ${adminAuth.token}` },
      data: makeProduct({ price: "-1.00" }),
    });

    expect(resp.status()).toBe(422);
    const body = await resp.json();
    expect(body.detail.some((e: { loc: string[] }) => e.loc.includes("price"))).toBe(true);
  });

  test("POST /api/admin/products returns 422 when stock is negative", async ({
    request,
    adminAuth,
  }) => {
    const resp = await request.post("/api/admin/products", {
      headers: { Authorization: `Bearer ${adminAuth.token}` },
      data: makeProduct({ stock: -5 }),
    });

    expect(resp.status()).toBe(422);
    const body = await resp.json();
    expect(body.detail.some((e: { loc: string[] }) => e.loc.includes("stock"))).toBe(true);
  });

  test("PUT /api/admin/products/{id} partially updates the product and returns 200", async ({
    request,
    adminAuth,
    adminApi,
  }) => {
    const created = await adminApi.createProduct(
      makeProduct({ name: `PUT Target ${Date.now()}`, price: "5.00", stock: 3 }),
    );

    const resp = await request.put(`/api/admin/products/${created.id}`, {
      headers: { Authorization: `Bearer ${adminAuth.token}` },
      data: { price: "8.50", stock: 7 },
    });

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.id).toBe(created.id);
    expect(body.name).toBe(created.name);
    expect(body.price).toBe("8.50");
    expect(body.stock).toBe(7);
  });

  test("PUT /api/admin/products/{id} returns 404 for a missing product id", async ({
    request,
    adminAuth,
  }) => {
    const resp = await request.put("/api/admin/products/999999", {
      headers: { Authorization: `Bearer ${adminAuth.token}` },
      data: { price: "1.00" },
    });

    expect(resp.status()).toBe(404);
    const body = await resp.json();
    expect(body.detail).toBe("product not found");
  });

  test("DELETE /api/admin/products/{id} returns 204 and removes the product", async ({
    request,
    adminAuth,
    adminApi,
  }) => {
    const created = await adminApi.createProduct(
      makeProduct({ name: `DELETE Target ${Date.now()}` }),
    );

    const resp = await request.delete(`/api/admin/products/${created.id}`, {
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });

    expect(resp.status()).toBe(204);
    expect((await resp.text()).length).toBe(0);

    const followup = await request.get(`/api/products/${created.id}`);
    expect(followup.status()).toBe(404);
  });

  test("DELETE /api/admin/products/{id} returns 404 for a missing product id", async ({
    request,
    adminAuth,
  }) => {
    const resp = await request.delete("/api/admin/products/999999", {
      headers: { Authorization: `Bearer ${adminAuth.token}` },
    });

    expect(resp.status()).toBe(404);
    const body = await resp.json();
    expect(body.detail).toBe("product not found");
  });
});
