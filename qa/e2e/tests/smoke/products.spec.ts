import { expect, test } from "../../fixtures/test";

test.describe("products @smoke", () => {
  test("product list loads", async ({ productsPage }) => {
    await productsPage.goto();

    await expect(productsPage.productCards.first()).toBeVisible();
    const count = await productsPage.productCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("user can open product detail page", async ({ productsPage, productDetailsPage, page }) => {
    await productsPage.goto();
    const name = await productsPage.openFirstProduct();

    await expect(page).toHaveURL(/\/products\/\d+\/?$/);
    await expect(productDetailsPage.title).toBeVisible();
    await expect(productDetailsPage.title).toHaveText(name);
    await expect(productDetailsPage.addToCartButton).toBeVisible();
  });
});
