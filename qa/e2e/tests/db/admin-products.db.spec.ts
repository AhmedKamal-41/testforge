import { expect, test } from "../../fixtures/test";
import { makeProduct } from "../../factories/test-data";
import { resetDatabase } from "../../utils/db-utils";
import { queryOne } from "../../utils/db-client";

test.describe("admin product writes @db", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("POST /api/admin/products inserts a products row with the submitted values", async ({
    adminApi,
  }) => {
    const draft = makeProduct({
      name: `DB Insert ${Date.now()}`,
      price: "14.50",
      stock: 9,
      category: "qa-db",
    });

    const created = await adminApi.createProduct(draft);

    const row = await queryOne<{
      name: string;
      category: string;
      price: string;
      stock: number;
    }>(
      "SELECT name, category, price::text AS price, stock FROM products WHERE id = $1",
      [created.id],
    );

    expect(row).not.toBeNull();
    expect(row!.name).toBe(draft.name);
    expect(row!.category).toBe(draft.category);
    expect(row!.price).toBe("14.50");
    expect(row!.stock).toBe(9);
  });

  test("PUT /api/admin/products/{id} updates the products row, not just the API response", async ({
    adminApi,
  }) => {
    const original = await adminApi.createProduct(
      makeProduct({ name: `DB Update ${Date.now()}`, price: "5.00", stock: 2 }),
    );

    await adminApi.updateProduct(original.id, { price: "9.99", stock: 11 });

    const row = await queryOne<{ price: string; stock: number; name: string }>(
      "SELECT name, price::text AS price, stock FROM products WHERE id = $1",
      [original.id],
    );

    expect(row).not.toBeNull();
    expect(row!.price).toBe("9.99");
    expect(row!.stock).toBe(11);
    expect(row!.name).toBe(original.name);
  });

  test("DELETE /api/admin/products/{id} soft-deletes the row (is_active=false, deleted_at set)", async ({
    adminApi,
  }) => {
    const doomed = await adminApi.createProduct(
      makeProduct({ name: `DB Delete ${Date.now()}` }),
    );

    const before = await queryOne<{ is_active: boolean; deleted_at: string | null }>(
      "SELECT is_active, deleted_at FROM products WHERE id = $1",
      [doomed.id],
    );
    expect(before).not.toBeNull();
    expect(before!.is_active).toBe(true);
    expect(before!.deleted_at).toBeNull();

    await adminApi.deleteProduct(doomed.id);

    const after = await queryOne<{ is_active: boolean; deleted_at: string | null }>(
      "SELECT is_active, deleted_at FROM products WHERE id = $1",
      [doomed.id],
    );
    expect(after).not.toBeNull();
    expect(after!.is_active).toBe(false);
    expect(after!.deleted_at).not.toBeNull();
  });

  test("after a product is soft-deleted, GET /api/products no longer returns it but the row survives", async ({
    adminApi,
    request,
  }) => {
    const product = await adminApi.createProduct(
      makeProduct({ name: `Hidden ${Date.now()}` }),
    );

    const beforeList = await request.get("/api/products");
    const beforeIds = ((await beforeList.json()) as { id: number }[]).map((p) => p.id);
    expect(beforeIds).toContain(product.id);

    await adminApi.deleteProduct(product.id);

    const afterList = await request.get("/api/products");
    const afterIds = ((await afterList.json()) as { id: number }[]).map((p) => p.id);
    expect(afterIds).not.toContain(product.id);

    const detail = await request.get(`/api/products/${product.id}`);
    expect(detail.status()).toBe(404);

    const row = await queryOne<{ id: number; is_active: boolean }>(
      "SELECT id, is_active FROM products WHERE id = $1",
      [product.id],
    );
    expect(row).not.toBeNull();
    expect(row!.is_active).toBe(false);
  });
});
