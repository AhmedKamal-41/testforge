import { expect, test } from "../../fixtures/test";
import { makeProduct } from "../../factories/test-data";
import { resetDatabase } from "../../utils/db-utils";

test.describe("checkout @regression", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    await resetDatabase();
  });

  test.beforeEach(async ({ userApi }) => {
    await userApi.clearCart();
  });

  test("checkout page with an empty cart shows the empty state and hides the submit button", async ({
    userPage,
    checkoutPage,
  }) => {
    await userPage.goto("/checkout");

    await expect(checkoutPage.emptyState).toBeVisible();
    await expect(checkoutPage.submitButton).toHaveCount(0);
  });

  test("placing an order clears the cart on the backend", async ({
    userApi,
    userPage,
    cartPage,
    checkoutPage,
  }) => {
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[0].id);
    await userApi.addCartItem(products[1].id);

    await userPage.goto("/checkout");
    await checkoutPage.placeOrder();
    await expect(checkoutPage.confirmation).toBeVisible();

    const cart = await userApi.getCart();
    expect(cart.items).toHaveLength(0);

    await cartPage.goto();
    await expect(cartPage.emptyState).toBeVisible();
  });

  test("checkout decrements product stock by the purchased quantity", async ({
    userApi,
    userPage,
    checkoutPage,
  }) => {
    const products = await userApi.listProducts();
    const target = products[0];
    const stockBefore = target.stock;

    await userApi.addCartItem(target.id);
    await userApi.addCartItem(target.id); // quantity 2

    await userPage.goto("/checkout");
    await checkoutPage.placeOrder();
    await expect(checkoutPage.confirmation).toBeVisible();

    const updated = await userApi.getProduct(target.id);
    expect(updated.stock).toBe(stockBefore - 2);
  });

  test("checkout fails with an error when cart quantity exceeds product stock", async ({
    adminApi,
    userApi,
    userPage,
    checkoutPage,
  }) => {
    const scarce = await adminApi.createProduct(
      makeProduct({ stock: 1, name: `Scarce ${Date.now()}` }),
    );

    await userApi.addCartItem(scarce.id);
    await userApi.addCartItem(scarce.id); // quantity 2 > stock 1

    await userPage.goto("/checkout");
    await checkoutPage.placeOrder();

    await expect(checkoutPage.errorAlert).toBeVisible();
    await expect(checkoutPage.errorAlert).toContainText(/insufficient stock/i);
    await expect(checkoutPage.confirmation).toHaveCount(0);

    const stillThere = await adminApi.getProduct(scarce.id);
    expect(stillThere.stock).toBe(1);
  });
});
