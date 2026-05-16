import { expect, test } from "../../fixtures/test";

test.describe("cart @smoke", () => {
  // Tests share the same user's cart, so within-file parallelism would race.
  // Cross-file collisions are avoided by running smoke with --workers=1.
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ userApi }) => {
    await userApi.clearCart();
  });

  test("user can add product to cart", async ({ userPage, productsPage, cartPage }) => {
    await userPage.goto("/products");

    const addCall = userPage.waitForResponse(
      (resp) =>
        resp.url().includes("/api/cart/items") &&
        resp.request().method() === "POST" &&
        resp.ok(),
    );
    const { name } = await productsPage.addFirstProductToCart();
    await addCall;

    await cartPage.goto();
    await expect(cartPage.items).toHaveCount(1);
    await expect(cartPage.rowForProductName(name)).toBeVisible();
  });

  test("user can remove product from cart", async ({ userPage, userApi, cartPage }) => {
    // API setup: pre-seed the cart so the test focuses on removal only.
    const products = await userApi.listProducts();
    const target = products[0];
    await userApi.addCartItem(target.id);

    await userPage.goto("/cart");
    await expect(cartPage.items).toHaveCount(1);

    await cartPage.removeByProductName(target.name);

    await expect(cartPage.items).toHaveCount(0);
    await expect(cartPage.emptyState).toBeVisible();
  });
});
