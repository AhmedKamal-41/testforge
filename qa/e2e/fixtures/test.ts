import { mergeTests } from "@playwright/test";
import { ApiClient } from "../utils/api-client";
import { authTest } from "./auth.fixture";

import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { ProductsPage } from "../pages/ProductsPage";
import { ProductDetailsPage } from "../pages/ProductDetailsPage";
import { CartPage } from "../pages/CartPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { OrdersPage } from "../pages/OrdersPage";
import { AdminProductsPage } from "../pages/AdminProductsPage";
import { NavBar } from "../pages/NavBar";

type Fixtures = {
  api: ApiClient;
  loginPage: LoginPage;
  productsPage: ProductsPage;
  productDetailsPage: ProductDetailsPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  ordersPage: OrdersPage;
  adminProductsPage: AdminProductsPage;
  navBar: NavBar;
};

const pageObjectTest = base.extend<Fixtures>({
  api: async ({ request }, use) => {
    await use(new ApiClient(request));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  productsPage: async ({ page }, use) => {
    await use(new ProductsPage(page));
  },
  productDetailsPage: async ({ page }, use) => {
    await use(new ProductDetailsPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  ordersPage: async ({ page }, use) => {
    await use(new OrdersPage(page));
  },
  adminProductsPage: async ({ page }, use) => {
    await use(new AdminProductsPage(page));
  },
  navBar: async ({ page }, use) => {
    await use(new NavBar(page));
  },
});

export const test = mergeTests(pageObjectTest, authTest);
export { expect } from "@playwright/test";
