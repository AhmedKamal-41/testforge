import { expect, test } from "../../fixtures/test";
import { accounts } from "../../factories/test-data";
import { resetDatabase } from "../../utils/db-utils";

test.describe("auth @regression", () => {
  test.beforeAll(async () => {
    await resetDatabase();
  });

  test("successful login lands on /products and shows the user in the navbar", async ({
    loginPage,
    navBar,
    page,
  }) => {
    await loginPage.goto();
    await loginPage.login(accounts.user.email, accounts.user.password);

    await expect(page).toHaveURL(/\/products\/?$/);
    await expect(navBar.currentUser).toContainText(accounts.user.email);
    await expect(navBar.logoutButton).toBeVisible();
    await expect(navBar.loginLink).toHaveCount(0);
  });

  test("logout clears the session and returns to /login", async ({
    loginPage,
    navBar,
    page,
  }) => {
    await loginPage.goto();
    await loginPage.login(accounts.user.email, accounts.user.password);
    await expect(navBar.logoutButton).toBeVisible();

    await navBar.logout();

    await expect(page).toHaveURL(/\/login\/?$/);
    await expect(navBar.logoutButton).toHaveCount(0);
    await expect(navBar.loginLink).toBeVisible();

    await page.goto("/cart");
    await expect(page).toHaveURL(/\/login\/?$/);
  });

  test("session persists across a full page reload", async ({
    loginPage,
    navBar,
    page,
  }) => {
    await loginPage.goto();
    await loginPage.login(accounts.user.email, accounts.user.password);
    await expect(navBar.currentUser).toContainText(accounts.user.email);

    await page.reload();

    await expect(navBar.currentUser).toContainText(accounts.user.email);
    await expect(navBar.logoutButton).toBeVisible();
  });

  test("brand link in the navbar returns to /products from anywhere", async ({
    userPage,
    navBar,
  }) => {
    await userPage.goto("/orders");
    await expect(userPage).toHaveURL(/\/orders\/?$/);

    await navBar.brandLink.click();

    await expect(userPage).toHaveURL(/\/products\/?$/);
    await expect(userPage.getByTestId("product-grid")).toBeVisible();
  });
});
