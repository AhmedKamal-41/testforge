import { expect, test } from "../../fixtures/test";
import { resetDatabase } from "../../utils/db-utils";

test.describe("admin authorization @regression", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("regular user is redirected away from /admin/products", async ({ userPage }) => {
    await userPage.goto("/admin/products");

    await expect(userPage).toHaveURL(/\/products\/?$/);
    await expect(userPage.getByTestId("product-grid")).toBeVisible();
  });

  test("navbar hides the Admin link for regular users", async ({ userPage, navBar }) => {
    await userPage.goto("/products");

    await expect(navBar.currentUser).toBeVisible();
    await expect(navBar.adminLink).toHaveCount(0);
  });

  test("admin sees the Admin link and can open the admin products page", async ({
    adminPage,
    navBar,
    adminProductsPage,
  }) => {
    await adminPage.goto("/products");

    await expect(navBar.adminLink).toBeVisible();
    await navBar.adminLink.click();

    await expect(adminPage).toHaveURL(/\/admin\/products\/?$/);
    await expect(adminProductsPage.form).toBeVisible();
    await expect(adminProductsPage.table).toBeVisible();
  });

  test("admin API rejects requests from a regular user with 403", async ({ userAuth, request }) => {
    const resp = await request.post("/api/admin/products", {
      headers: { Authorization: `Bearer ${userAuth.token}` },
      data: {
        name: "Should never persist",
        description: "",
        price: "1.00",
        stock: 1,
        category: "qa-fixtures",
        image_url: "",
      },
    });

    expect(resp.status()).toBe(403);
  });
});
