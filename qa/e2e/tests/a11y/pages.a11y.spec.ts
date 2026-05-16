import AxeBuilder from "@axe-core/playwright";
import type { Result as AxeResult } from "axe-core";
import type { Page } from "@playwright/test";
import { expect, test } from "../../fixtures/test";

const SEVERITIES = ["critical", "serious"] as const;

async function findSeriousViolations(page: Page): Promise<AxeResult[]> {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  return violations.filter((v) => v.impact && SEVERITIES.includes(v.impact as typeof SEVERITIES[number]));
}

function formatViolations(violations: AxeResult[]): string {
  return violations
    .map((v) => `[${v.impact}] ${v.id} — ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? "" : "s"})`)
    .join("\n");
}

test.describe("page accessibility @a11y", () => {
  test("/login has no critical or serious WCAG 2.1 AA violations", async ({ page, loginPage }) => {
    await loginPage.goto();

    const violations = await findSeriousViolations(page);
    expect(violations, formatViolations(violations)).toEqual([]);
  });

  test("/products has no critical or serious WCAG 2.1 AA violations", async ({
    page,
    productsPage,
  }) => {
    await productsPage.goto();
    await expect(productsPage.productCards.first()).toBeVisible();

    const violations = await findSeriousViolations(page);
    expect(violations, formatViolations(violations)).toEqual([]);
  });

  test("/products/{id} has no critical or serious WCAG 2.1 AA violations", async ({
    page,
    productsPage,
    productDetailsPage,
  }) => {
    await productsPage.goto();
    const products = await page.evaluate(() =>
      fetch("/api/products").then((r) => r.json()),
    );
    await productDetailsPage.goto(products[0].id);
    await expect(productDetailsPage.title).toBeVisible();

    const violations = await findSeriousViolations(page);
    expect(violations, formatViolations(violations)).toEqual([]);
  });

  test("/cart has no critical or serious WCAG 2.1 AA violations", async ({
    userPage,
    userApi,
    cartPage,
  }) => {
    await userApi.clearCart();
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[0].id);
    await userApi.addCartItem(products[1].id);

    await cartPage.goto();
    await expect(cartPage.items).toHaveCount(2);

    const violations = await findSeriousViolations(userPage);
    expect(violations, formatViolations(violations)).toEqual([]);
  });

  test("/checkout has no critical or serious WCAG 2.1 AA violations", async ({
    userPage,
    userApi,
    checkoutPage,
  }) => {
    await userApi.clearCart();
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[0].id);

    await checkoutPage.goto();
    await expect(checkoutPage.submitButton).toBeEnabled();

    const violations = await findSeriousViolations(userPage);
    expect(violations, formatViolations(violations)).toEqual([]);
  });

  test("/orders has no critical or serious WCAG 2.1 AA violations", async ({
    userPage,
    userApi,
    ordersPage,
  }) => {
    await userApi.clearCart();
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[0].id);
    await userApi.checkout();

    await ordersPage.goto();
    await expect(ordersPage.orderCards.first()).toBeVisible();

    const violations = await findSeriousViolations(userPage);
    expect(violations, formatViolations(violations)).toEqual([]);
  });

  test("/admin/products has no critical or serious WCAG 2.1 AA violations", async ({
    adminPage,
    adminProductsPage,
  }) => {
    await adminProductsPage.goto();
    await expect(adminProductsPage.form).toBeVisible();
    await expect(adminProductsPage.table).toBeVisible();

    const violations = await findSeriousViolations(adminPage);
    expect(violations, formatViolations(violations)).toEqual([]);
  });
});
