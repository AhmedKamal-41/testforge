import { expect, test } from "../../fixtures/test";
import { seededProductNames } from "../../factories/test-data";
import { resetDatabase } from "../../utils/db-utils";

test.describe("products API @api", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("GET /api/products returns the seeded catalog without requiring auth", async ({
    request,
  }) => {
    const resp = await request.get("/api/products");

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(seededProductNames.length);
    for (const product of body) {
      expect(typeof product.id).toBe("number");
      expect(typeof product.name).toBe("string");
      expect(typeof product.price).toBe("string");
      expect(typeof product.stock).toBe("number");
      expect(typeof product.category).toBe("string");
    }
  });

  test("GET /api/products/{id} returns the matching product shape", async ({ request }) => {
    const list = await request.get("/api/products").then((r) => r.json());
    const expected = list[0];

    const resp = await request.get(`/api/products/${expected.id}`);

    expect(resp.status()).toBe(200);
    const body = await resp.json();
    expect(body.id).toBe(expected.id);
    expect(body.name).toBe(expected.name);
    expect(body.price).toBe(expected.price);
    expect(body.stock).toBe(expected.stock);
    expect(body.category).toBe(expected.category);
    expect(typeof body.description).toBe("string");
    expect(typeof body.image_url).toBe("string");
  });

  test("GET /api/products/{id} returns 404 for a missing product id", async ({ request }) => {
    const resp = await request.get("/api/products/999999");

    expect(resp.status()).toBe(404);
    const body = await resp.json();
    expect(body.detail).toBe("product not found");
  });

  test("GET /api/products/{id} with a non-numeric id returns 422", async ({ request }) => {
    const resp = await request.get("/api/products/not-a-number");

    expect(resp.status()).toBe(422);
  });
});
