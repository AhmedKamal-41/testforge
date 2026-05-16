import { expect, test } from "../../fixtures/test";
import { makeProduct } from "../../factories/test-data";
import { resetDatabase } from "../../utils/db-utils";

test.describe("admin products @regression", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("admin can create a product and it appears in the catalog", async ({
    adminPage,
    adminProductsPage,
    productsPage,
  }) => {
    const draft = makeProduct({ name: `New Arrival ${Date.now()}`, price: "12.34", stock: 7 });

    await adminProductsPage.goto();
    await adminProductsPage.fillForm({
      name: draft.name,
      category: draft.category,
      price: draft.price,
      stock: String(draft.stock),
      description: draft.description,
    });
    await adminProductsPage.save();

    await expect(adminProductsPage.flash).toContainText(/created/i);
    await expect(adminProductsPage.rows.filter({ hasText: draft.name })).toHaveCount(1);

    await adminPage.goto("/products");
    await expect(productsPage.cardByName(draft.name)).toBeVisible();
  });

  test("admin can edit a product and the change is reflected in the catalog", async ({
    adminApi,
    adminProductsPage,
    productsPage,
    adminPage,
  }) => {
    const original = await adminApi.createProduct(
      makeProduct({ name: `Editable ${Date.now()}`, price: "5.00", stock: 10 }),
    );
    const updatedName = `${original.name} (Updated)`;

    await adminProductsPage.goto();
    await adminProductsPage.editByProductId(original.id);
    await adminProductsPage.fillForm({ name: updatedName, price: "7.50" });
    await adminProductsPage.save();

    await expect(adminProductsPage.flash).toContainText(/updated/i);

    await adminPage.goto("/products");
    await expect(productsPage.cardByName(updatedName)).toBeVisible();
    await expect(productsPage.cardByName(updatedName)).toContainText("$7.50");
  });

  test("admin can delete a product and it disappears from the catalog", async ({
    adminApi,
    adminProductsPage,
    productsPage,
    adminPage,
  }) => {
    const doomed = await adminApi.createProduct(
      makeProduct({ name: `Deletable ${Date.now()}` }),
    );

    await adminProductsPage.goto();
    await expect(adminProductsPage.rowForProductId(doomed.id)).toBeVisible();
    await adminProductsPage.deleteByProductId(doomed.id);

    await expect(adminProductsPage.rowForProductId(doomed.id)).toHaveCount(0);

    await adminPage.goto("/products");
    await expect(productsPage.cardByName(doomed.name)).toHaveCount(0);
  });

  test("clicking Edit pre-populates the form with the product's current values", async ({
    adminApi,
    adminPage,
    adminProductsPage,
  }) => {
    const product = await adminApi.createProduct(
      makeProduct({
        name: `Prefill ${Date.now()}`,
        price: "11.11",
        stock: 5,
        category: "qa-prefill",
      }),
    );

    await adminProductsPage.goto();
    await expect(adminPage).toHaveURL(/\/admin\/products\/?$/);
    await adminProductsPage.editByProductId(product.id);

    await expect(adminProductsPage.nameInput).toHaveValue(product.name);
    await expect(adminProductsPage.priceInput).toHaveValue("11.11");
    await expect(adminProductsPage.stockInput).toHaveValue("5");
    await expect(adminProductsPage.categoryInput).toHaveValue("qa-prefill");
    await expect(adminProductsPage.cancelButton).toBeVisible();
    await expect(adminProductsPage.saveButton).toHaveText(/save changes/i);
  });

  test("Cancel during an edit clears the form and exits edit mode", async ({
    adminApi,
    adminPage,
    adminProductsPage,
  }) => {
    const product = await adminApi.createProduct(
      makeProduct({ name: `Cancellable ${Date.now()}` }),
    );

    await adminProductsPage.goto();
    await expect(adminPage).toHaveURL(/\/admin\/products\/?$/);
    await adminProductsPage.editByProductId(product.id);
    await expect(adminProductsPage.nameInput).toHaveValue(product.name);

    await adminProductsPage.fillForm({ name: "I changed my mind" });
    await adminProductsPage.cancelButton.click();

    await expect(adminProductsPage.cancelButton).toHaveCount(0);
    await expect(adminProductsPage.saveButton).toHaveText(/create product/i);
    await expect(adminProductsPage.nameInput).toHaveValue("");
  });

  test("updating a product with a negative price is rejected by the server", async ({
    adminApi,
    adminPage,
    adminProductsPage,
  }) => {
    const product = await adminApi.createProduct(
      makeProduct({ name: `Price Guard ${Date.now()}`, price: "10.00" }),
    );

    await adminProductsPage.goto();
    await expect(adminPage).toHaveURL(/\/admin\/products\/?$/);
    await adminProductsPage.editByProductId(product.id);
    await adminProductsPage.fillForm({ price: "-1.00" });
    await adminProductsPage.save();

    await expect(adminProductsPage.errorAlert).toBeVisible();

    const unchanged = await adminApi.getProduct(product.id);
    expect(unchanged.price).toBe("10.00");
  });

  test("creating a product with a blank name is rejected client-side", async ({
    adminPage,
    adminProductsPage,
  }) => {
    await adminProductsPage.goto();
    await expect(adminPage).toHaveURL(/\/admin\/products\/?$/);

    // Bypass the HTML5 required check so we exercise the React validation path too.
    await adminProductsPage.nameInput.evaluate((el) => el.removeAttribute("required"));
    await adminProductsPage.fillForm({ name: "   " });

    let postCount = 0;
    await adminProductsPage.page.route("**/api/admin/products", (route) => {
      postCount += 1;
      return route.continue();
    });

    await adminProductsPage.save();

    await expect(adminProductsPage.errorAlert).toBeVisible();
    await expect(adminProductsPage.errorAlert).toContainText(/name is required/i);
    expect(postCount).toBe(0);
  });
});
