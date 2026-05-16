import { expect, test } from "../../fixtures/test";
import { accounts } from "../../factories/test-data";

test.describe("login @smoke", () => {
  test("user can log in", async ({ loginPage, page }) => {
    await loginPage.loginAsUser();

    await expect(page).toHaveURL(/\/products\/?$/);
    await expect(page.getByTestId("logout-button")).toBeVisible();
    await expect(page.getByTestId("current-user")).toContainText(accounts.user.email);
  });

  test("invalid login shows error", async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(accounts.user.email, "definitely-not-the-right-password");

    await expect(loginPage.errorAlert).toBeVisible();
    await expect(loginPage.errorAlert).toContainText(/invalid email or password/i);
    await expect(page).toHaveURL(/\/login\/?$/);
  });
});
