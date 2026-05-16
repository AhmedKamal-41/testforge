import { expect, test } from "../../fixtures/test";
import { resetDatabase } from "../../utils/db-utils";

test.describe("orders @regression", () => {
  // Tests run in order so the first one observes the freshly reset DB
  // before later tests create orders for the same user.
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("a user with no orders sees the empty-orders state", async ({
    userPage,
    ordersPage,
  }) => {
    await ordersPage.goto();

    await expect(ordersPage.emptyState).toBeVisible();
    await expect(ordersPage.orderCards).toHaveCount(0);
    await expect(userPage.getByText(/start shopping/i)).toBeVisible();
  });

  test("multiple checkouts show up as separate order cards in history", async ({
    userApi,
    userPage,
    ordersPage,
  }) => {
    await userApi.clearCart();
    const products = await userApi.listProducts();

    await userApi.addCartItem(products[0].id);
    const firstOrder = await userApi.checkout();

    await userApi.addCartItem(products[1].id);
    await userApi.addCartItem(products[2].id);
    const secondOrder = await userApi.checkout();

    await ordersPage.goto();

    await expect(ordersPage.orderCards).toHaveCount(2);
    await expect(ordersPage.orderById(firstOrder.id)).toBeVisible();
    await expect(ordersPage.orderById(secondOrder.id)).toBeVisible();

    const secondCard = ordersPage.orderById(secondOrder.id);
    await expect(secondCard.getByTestId("order-line-item")).toHaveCount(2);
    await expect(secondCard.getByTestId("order-total")).toHaveText(`$${secondOrder.total}`);

    await expect(userPage).toHaveURL(/\/orders\/?$/);
  });
});
