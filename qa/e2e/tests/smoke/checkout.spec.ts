import { expect, test } from "../../fixtures/test";

test.describe("checkout @smoke", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ userApi }) => {
    await userApi.clearCart();
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[0].id);
  });

  test("user can checkout successfully", async ({ userPage, cartPage, checkoutPage }) => {
    await userPage.goto("/cart");
    await expect(cartPage.items).toHaveCount(1);
    await cartPage.proceedToCheckout();

    await expect(userPage).toHaveURL(/\/checkout\/?$/);
    await expect(checkoutPage.submitButton).toBeEnabled();

    const checkoutCall = userPage.waitForResponse(
      (resp) =>
        resp.url().includes("/api/checkout") &&
        resp.request().method() === "POST" &&
        resp.ok(),
    );
    await checkoutPage.placeOrder();
    await checkoutCall;

    await expect(checkoutPage.confirmation).toBeVisible();
  });

  test("user can see order confirmation and find the order in history", async ({
    userPage,
    checkoutPage,
    ordersPage,
  }) => {
    await userPage.goto("/checkout");

    await checkoutPage.placeOrder();

    await expect(checkoutPage.confirmation).toBeVisible();
    await expect(checkoutPage.confirmationId).toContainText(/#\d+/);
    await expect(checkoutPage.confirmationTotal).toContainText(/^\$\d+(\.\d{2})?$/);

    await checkoutPage.viewOrdersLink.click();

    await expect(userPage).toHaveURL(/\/orders\/?$/);
    await expect(ordersPage.orderCards.first()).toBeVisible();
  });
});
