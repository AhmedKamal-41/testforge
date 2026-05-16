import type { Locator, Page } from "@playwright/test";

export class CartPage {
  readonly page: Page;
  readonly items: Locator;
  readonly emptyState: Locator;
  readonly total: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingLink: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.items = page.getByTestId("cart-item");
    this.emptyState = page.getByTestId("empty-cart");
    this.total = page.getByTestId("cart-total");
    this.checkoutButton = page.getByTestId("checkout-button");
    this.continueShoppingLink = page.getByTestId("continue-shopping");
    this.errorAlert = page.getByTestId("error-alert");
  }

  async goto(): Promise<void> {
    await this.page.goto("/cart");
  }

  rowForProductId(productId: number): Locator {
    return this.page.locator(`[data-testid="cart-item"][data-product-id="${productId}"]`);
  }

  rowForProductName(name: string): Locator {
    return this.items.filter({ hasText: name });
  }

  async removeByProductName(name: string): Promise<void> {
    await this.rowForProductName(name).getByTestId("remove-cart-item").click();
  }

  async proceedToCheckout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
