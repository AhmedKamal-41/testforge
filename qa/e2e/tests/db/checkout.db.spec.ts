import { expect, test } from "../../fixtures/test";
import { resetDatabase } from "../../utils/db-utils";
import { queryOne, queryRows } from "../../utils/db-client";

test.describe("checkout writes @db", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    await resetDatabase();
  });

  test.beforeEach(async ({ userApi }) => {
    await userApi.clearCart();
  });

  test("checkout inserts a row in orders for the buying user", async ({
    userApi,
    userAuth,
  }) => {
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[0].id);
    await userApi.addCartItem(products[1].id);
    const placed = await userApi.checkout();

    const row = await queryOne<{
      id: number;
      user_id: number;
      total: string;
      status: string;
    }>(
      "SELECT id, user_id, total::text AS total, status FROM orders WHERE id = $1",
      [placed.id],
    );

    expect(row).not.toBeNull();
    expect(row!.user_id).toBe(userAuth.user.id);
    expect(row!.status).toBe("placed");
    expect(row!.total).toBe(placed.total);
  });

  test("checkout inserts one order_items row per cart line with correct fields", async ({
    userApi,
  }) => {
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[0].id);
    await userApi.addCartItem(products[1].id);
    await userApi.addCartItem(products[1].id);
    const placed = await userApi.checkout();

    const items = await queryRows<{
      product_id: number;
      product_name: string;
      unit_price: string;
      quantity: number;
    }>(
      `SELECT product_id, product_name, unit_price::text AS unit_price, quantity
       FROM order_items
       WHERE order_id = $1
       ORDER BY id`,
      [placed.id],
    );

    expect(items).toHaveLength(2);

    const p0 = items.find((i) => i.product_id === products[0].id)!;
    expect(p0.product_name).toBe(products[0].name);
    expect(p0.unit_price).toBe(products[0].price);
    expect(p0.quantity).toBe(1);

    const p1 = items.find((i) => i.product_id === products[1].id)!;
    expect(p1.product_name).toBe(products[1].name);
    expect(p1.unit_price).toBe(products[1].price);
    expect(p1.quantity).toBe(2);
  });

  test("checkout deletes the user's cart_items rows after creating the order", async ({
    userApi,
    userAuth,
  }) => {
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[2].id);
    await userApi.addCartItem(products[3].id);

    const before = await queryOne<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM cart_items WHERE user_id = $1",
      [userAuth.user.id],
    );
    expect(Number(before?.count)).toBe(2);

    await userApi.checkout();

    const after = await queryOne<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM cart_items WHERE user_id = $1",
      [userAuth.user.id],
    );
    expect(Number(after?.count)).toBe(0);
  });

  test("checkout decrements products.stock by the purchased quantity", async ({
    userApi,
  }) => {
    const products = await userApi.listProducts();
    const target = products[4];
    const stockBefore = (
      await queryOne<{ stock: number }>("SELECT stock FROM products WHERE id = $1", [target.id])
    )!.stock;

    await userApi.addCartItem(target.id);
    await userApi.addCartItem(target.id);
    await userApi.checkout();

    const stockAfter = (
      await queryOne<{ stock: number }>("SELECT stock FROM products WHERE id = $1", [target.id])
    )!.stock;

    expect(stockAfter).toBe(stockBefore - 2);
  });
});
