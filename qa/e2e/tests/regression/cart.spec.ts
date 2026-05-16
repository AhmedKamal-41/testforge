import { expect, test } from "../../fixtures/test";
import { accounts } from "../../factories/test-data";
import { resetDatabase } from "../../utils/db-utils";

test.describe("cart @regression", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    await resetDatabase();
  });

  test.beforeEach(async ({ userApi }) => {
    await userApi.clearCart();
  });

  test("adding the same product twice increments the quantity instead of creating a new line", async ({
    userApi,
    userPage,
    cartPage,
  }) => {
    const products = await userApi.listProducts();
    const target = products[0];

    await userApi.addCartItem(target.id);
    const finalCart = await userApi.addCartItem(target.id);

    await userPage.goto("/cart");
    await expect(cartPage.items).toHaveCount(1);

    const row = cartPage.rowForProductId(target.id);
    await expect(row.getByTestId("cart-item-quantity")).toHaveText("2");
    await expect(row.getByTestId("cart-item-total")).toHaveText(`$${finalCart.items[0].line_total}`);
    await expect(cartPage.total).toHaveText(`$${finalCart.total}`);
  });

  test("the cart total equals the sum of all line totals across distinct products", async ({
    userApi,
    userPage,
    cartPage,
  }) => {
    const products = await userApi.listProducts();
    const [a, b, c] = products;
    await userApi.addCartItem(a.id);
    await userApi.addCartItem(b.id);
    await userApi.addCartItem(c.id);
    const finalCart = await userApi.addCartItem(c.id); // c has quantity 2

    await userPage.goto("/cart");
    await expect(cartPage.items).toHaveCount(3);
    await expect(cartPage.total).toHaveText(`$${finalCart.total}`);

    for (const item of finalCart.items) {
      const row = cartPage.rowForProductId(item.product.id);
      await expect(row.getByTestId("cart-item-quantity")).toHaveText(String(item.quantity));
      await expect(row.getByTestId("cart-item-total")).toHaveText(`$${item.line_total}`);
    }
  });

  test("removing one item leaves the other rows untouched", async ({
    userApi,
    userPage,
    cartPage,
  }) => {
    const products = await userApi.listProducts();
    const [a, b] = products;
    await userApi.addCartItem(a.id);
    await userApi.addCartItem(b.id);

    await userPage.goto("/cart");
    await expect(cartPage.items).toHaveCount(2);

    await cartPage.removeByProductName(a.name);

    await expect(cartPage.items).toHaveCount(1);
    await expect(cartPage.rowForProductId(b.id)).toBeVisible();
    await expect(cartPage.rowForProductId(a.id)).toHaveCount(0);

    const remaining = await userApi.getCart();
    await expect(cartPage.total).toHaveText(`$${remaining.total}`);
  });

  test("an empty cart offers a Continue shopping link back to /products", async ({
    userPage,
    cartPage,
  }) => {
    await userPage.goto("/cart");

    await expect(cartPage.emptyState).toBeVisible();
    await expect(cartPage.checkoutButton).toHaveCount(0);

    await cartPage.continueShoppingLink.click();
    await expect(userPage).toHaveURL(/\/products\/?$/);
  });

  test("removing the last item flips the cart from filled to the empty state", async ({
    userApi,
    userPage,
    cartPage,
  }) => {
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[0].id);

    await userPage.goto("/cart");
    await expect(cartPage.items).toHaveCount(1);

    await cartPage.removeByProductName(products[0].name);

    await expect(cartPage.emptyState).toBeVisible();
    await expect(cartPage.items).toHaveCount(0);
    await expect(cartPage.checkoutButton).toHaveCount(0);
  });

  test("cart contents survive navigating away and back", async ({
    userApi,
    userPage,
    cartPage,
    navBar,
  }) => {
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[0].id);
    await userApi.addCartItem(products[1].id);

    await userPage.goto("/cart");
    await expect(cartPage.items).toHaveCount(2);

    await navBar.productsLink.click();
    await expect(userPage).toHaveURL(/\/products\/?$/);

    await navBar.cartLink.click();
    await expect(userPage).toHaveURL(/\/cart\/?$/);
    await expect(cartPage.items).toHaveCount(2);
  });

  test("cart contents survive a full page reload", async ({
    userApi,
    userPage,
    cartPage,
  }) => {
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[0].id);
    await userApi.addCartItem(products[1].id);

    await userPage.goto("/cart");
    await expect(cartPage.items).toHaveCount(2);

    await userPage.reload();

    await expect(cartPage.items).toHaveCount(2);
    await expect(cartPage.rowForProductId(products[0].id)).toBeVisible();
    await expect(cartPage.rowForProductId(products[1].id)).toBeVisible();
  });

  test("cart contents survive logout and a fresh UI login as the same user", async ({
    userApi,
    page,
    loginPage,
    cartPage,
    navBar,
  }) => {
    const products = await userApi.listProducts();
    await userApi.addCartItem(products[0].id);
    await userApi.addCartItem(products[1].id);

    await loginPage.loginAsUser();
    await expect(page).toHaveURL(/\/products\/?$/);
    await page.goto("/cart");
    await expect(cartPage.items).toHaveCount(2);

    await navBar.logout();
    await expect(page).toHaveURL(/\/login\/?$/);

    await loginPage.login(accounts.user.email, accounts.user.password);
    await expect(page).toHaveURL(/\/products\/?$/);
    await page.goto("/cart");

    await expect(cartPage.items).toHaveCount(2);
    await expect(cartPage.rowForProductId(products[0].id)).toBeVisible();
    await expect(cartPage.rowForProductId(products[1].id)).toBeVisible();
  });
});
