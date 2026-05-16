import { expect, test } from "../../fixtures/test";

test.describe.configure({ mode: "serial" });

test.describe("visual regression @visual", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "visual baselines pinned to chromium");

  test("login page", async ({ page, loginPage }) => {
    await loginPage.goto();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(page).toHaveScreenshot("login.png", { fullPage: true });
  });

  test("products list", async ({ page, productsPage }) => {
    await productsPage.goto();
    await expect(productsPage.productCards.first()).toBeVisible();
    await expect(productsPage.productCards).toHaveCount(20);
    await expect(page).toHaveScreenshot("products.png", { fullPage: true });
  });

  test("cart with two items", async ({ userPage, userApi, cartPage }) => {
    await userApi.clearCart();
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[0].id);
    await userApi.addCartItem(products[1].id);

    await cartPage.goto();
    await expect(cartPage.items).toHaveCount(2);
    await expect(userPage).toHaveScreenshot("cart.png", { fullPage: true });
  });

  test("checkout with two items", async ({ userPage, userApi, checkoutPage }) => {
    await userApi.clearCart();
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[0].id);
    await userApi.addCartItem(products[1].id);

    await checkoutPage.goto();
    await expect(checkoutPage.submitButton).toBeEnabled();
    await expect(userPage).toHaveScreenshot("checkout.png", { fullPage: true });
  });

  test("order confirmation panel", async ({ userPage, userApi, checkoutPage }) => {
    await userApi.clearCart();
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[0].id);

    await checkoutPage.goto();
    await checkoutPage.placeOrder();
    await expect(userPage.getByTestId("order-confirmation")).toBeVisible();

    await expect(checkoutPage.confirmation).toHaveScreenshot("order-confirmation.png", {
      mask: [checkoutPage.confirmationId],
    });
  });

  test("admin products page", async ({ adminPage, adminProductsPage }) => {
    await adminProductsPage.goto();
    await expect(adminPage).toHaveURL(/\/admin\/products$/);
    await expect(adminProductsPage.form).toBeVisible();

    await expect(adminProductsPage.form).toHaveScreenshot("admin-products-form.png");
  });
});
