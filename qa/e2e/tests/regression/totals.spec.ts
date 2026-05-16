import { expect, test } from "../../fixtures/test";
import { resetDatabase } from "../../utils/db-utils";

test.describe("end-to-end totals @regression", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("cart total equals checkout total equals order-history total for the same order", async ({
    userApi,
    userPage,
    cartPage,
    checkoutPage,
    ordersPage,
  }) => {
    await userApi.clearCart();
    const products = await userApi.listProducts();

    await userApi.addCartItem(products[0].id);
    await userApi.addCartItem(products[1].id);
    const cart = await userApi.addCartItem(products[1].id);
    const expectedTotal = cart.total;

    await userPage.goto("/cart");
    await expect(cartPage.total).toHaveText(`$${expectedTotal}`);

    await cartPage.proceedToCheckout();
    await expect(userPage).toHaveURL(/\/checkout\/?$/);
    await expect(checkoutPage.total).toHaveText(`$${expectedTotal}`);

    await checkoutPage.placeOrder();
    await expect(checkoutPage.confirmation).toBeVisible();
    await expect(checkoutPage.confirmationTotal).toHaveText(`$${expectedTotal}`);

    const confirmationText = await checkoutPage.confirmationId.textContent();
    const orderId = Number((confirmationText ?? "").replace(/[^\d]/g, ""));
    expect(orderId).toBeGreaterThan(0);

    await ordersPage.goto();
    const orderCard = ordersPage.orderById(orderId);
    await expect(orderCard).toBeVisible();
    await expect(orderCard.getByTestId("order-total")).toHaveText(`$${expectedTotal}`);
  });
});
