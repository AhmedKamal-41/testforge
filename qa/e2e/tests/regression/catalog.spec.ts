import { expect, test } from "../../fixtures/test";
import { makeProduct } from "../../factories/test-data";
import { resetDatabase } from "../../utils/db-utils";

test.describe("catalog @regression", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("out-of-stock product disables Add to cart and labels itself", async ({
    adminApi,
    userPage,
    productDetailsPage,
  }) => {
    const product = await adminApi.createProduct(makeProduct({ stock: 0, name: "Sold Out QA" }));

    await productDetailsPage.goto(product.id);
    await expect(productDetailsPage.title).toHaveText(product.name);
    await expect(productDetailsPage.addToCartButton).toBeDisabled();
    await expect(productDetailsPage.addToCartButton).toHaveText(/out of stock/i);
    await expect(productDetailsPage.stock).toContainText("0 in stock");

    await userPage.goto("/products"); // ensure no accidental cart side-effect
  });

  test("requesting a non-existent product id surfaces an error", async ({
    productDetailsPage,
  }) => {
    await productDetailsPage.goto(999_999);

    await expect(productDetailsPage.errorAlert).toBeVisible();
    await expect(productDetailsPage.title).toHaveCount(0);
  });

  test("unknown routes render the 404 page", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");

    await expect(page.getByTestId("not-found")).toBeVisible();
    await expect(page.getByTestId("not-found")).toContainText(/page not found/i);
  });

  test("out-of-stock product is disabled and labelled in the /products grid", async ({
    adminApi,
    userPage,
    productsPage,
  }) => {
    const product = await adminApi.createProduct(
      makeProduct({ stock: 0, name: `Sold Out Grid ${Date.now()}` }),
    );

    await userPage.goto("/products");
    const card = productsPage.cardByName(product.name);
    await expect(card).toBeVisible();

    const button = card.getByTestId("add-to-cart");
    await expect(button).toBeDisabled();
    await expect(button).toHaveText(/out of stock/i);
  });
});
