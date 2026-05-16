import { expect, test } from "../../fixtures/test";
import { resetDatabase } from "../../utils/db-utils";
import { queryOne, queryRows } from "../../utils/db-client";

test.describe("cart persistence @db", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    await resetDatabase();
  });

  test.beforeEach(async ({ userApi }) => {
    await userApi.clearCart();
  });

  test("POST /api/cart/items inserts a cart_items row for the user", async ({
    userApi,
    userAuth,
  }) => {
    const products = await userApi.listProducts();
    const target = products[0];

    await userApi.addCartItem(target.id, 3);

    const rows = await queryRows<{ user_id: number; product_id: number; quantity: number }>(
      "SELECT user_id, product_id, quantity FROM cart_items WHERE user_id = $1",
      [userAuth.user.id],
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      user_id: userAuth.user.id,
      product_id: target.id,
      quantity: 3,
    });
  });

  test("DELETE /api/cart/items/{id} removes the cart_items row from the table", async ({
    userApi,
  }) => {
    const products = await userApi.listProducts();
    const cart = await userApi.addCartItem(products[0].id);
    const itemId = cart.items[0].id;

    const before = await queryOne<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM cart_items WHERE id = $1",
      [itemId],
    );
    expect(Number(before?.count)).toBe(1);

    await userApi.removeCartItem(itemId);

    const after = await queryOne<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM cart_items WHERE id = $1",
      [itemId],
    );
    expect(Number(after?.count)).toBe(0);
  });
});
