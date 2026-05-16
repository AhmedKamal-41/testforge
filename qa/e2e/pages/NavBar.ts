import type { Locator, Page } from "@playwright/test";

export class NavBar {
  readonly page: Page;
  readonly brandLink: Locator;
  readonly productsLink: Locator;
  readonly cartLink: Locator;
  readonly ordersLink: Locator;
  readonly adminLink: Locator;
  readonly loginLink: Locator;
  readonly logoutButton: Locator;
  readonly currentUser: Locator;

  constructor(page: Page) {
    this.page = page;
    this.brandLink = page.getByTestId("brand-link");
    this.productsLink = page.getByTestId("nav-products");
    this.cartLink = page.getByTestId("nav-cart");
    this.ordersLink = page.getByTestId("nav-orders");
    this.adminLink = page.getByTestId("nav-admin");
    this.loginLink = page.getByTestId("nav-login");
    this.logoutButton = page.getByTestId("logout-button");
    this.currentUser = page.getByTestId("current-user");
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
