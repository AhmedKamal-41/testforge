import { expect, test } from "../../fixtures/test";
import { resetDatabase } from "../../utils/db-utils";

const PROTECTED_PATHS = ["/cart", "/checkout", "/orders", "/admin/products"] as const;

test.describe("protected routes @regression", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  for (const path of PROTECTED_PATHS) {
    test(`anonymous visit to ${path} redirects to /login`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL(/\/login\/?$/);
      await expect(page.getByTestId("login-submit")).toBeVisible();
    });
  }

  test("anonymous clicking Add to cart from /products is redirected to /login", async ({
    page,
    productsPage,
  }) => {
    await productsPage.goto();
    await expect(productsPage.productCards.first()).toBeVisible();

    await productsPage.productCards.first().getByTestId("add-to-cart").click();

    await expect(page).toHaveURL(/\/login\/?$/);
  });
});
