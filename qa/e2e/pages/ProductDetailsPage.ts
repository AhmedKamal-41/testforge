import type { Locator, Page } from "@playwright/test";

export class ProductDetailsPage {
  readonly page: Page;
  readonly title: Locator;
  readonly price: Locator;
  readonly description: Locator;
  readonly stock: Locator;
  readonly addToCartButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByTestId("product-detail-title");
    this.price = page.getByTestId("product-detail-price");
    this.description = page.getByTestId("product-detail-description");
    this.stock = page.getByTestId("product-detail-stock");
    this.addToCartButton = page.getByTestId("add-to-cart");
    this.errorAlert = page.getByTestId("error-alert");
  }

  async goto(productId: number): Promise<void> {
    await this.page.goto(`/products/${productId}`);
  }

  async addToCart(): Promise<void> {
    await this.addToCartButton.click();
  }
}
