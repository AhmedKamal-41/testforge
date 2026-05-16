import type { Locator, Page } from "@playwright/test";

export class ProductsPage {
  readonly page: Page;
  readonly grid: Locator;
  readonly productCards: Locator;
  readonly emptyState: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.grid = page.getByTestId("product-grid");
    this.productCards = page.getByTestId("product-card");
    this.emptyState = page.getByTestId("empty-products");
    this.errorAlert = page.getByTestId("error-alert");
  }

  async goto(): Promise<void> {
    await this.page.goto("/products");
  }

  cardById(productId: number): Locator {
    return this.productCards.filter({ has: this.page.locator(`[data-product-id="${productId}"]`) });
  }

  cardByName(name: string): Locator {
    return this.productCards.filter({ hasText: name });
  }

  async addToCartByName(name: string): Promise<void> {
    await this.cardByName(name).getByTestId("add-to-cart").click();
  }

  /** Open the first product's detail page and return its title. */
  async openFirstProduct(): Promise<string> {
    const firstCard = this.productCards.first();
    const name = (await firstCard.getByTestId("product-title").textContent())?.trim() ?? "";
    await firstCard.getByTestId("product-title").click();
    return name;
  }

  /** Click "Add to cart" on the first product card and return its title. */
  async addFirstProductToCart(): Promise<{ name: string }> {
    const firstCard = this.productCards.first();
    const name = (await firstCard.getByTestId("product-title").textContent())?.trim() ?? "";
    await firstCard.getByTestId("add-to-cart").click();
    return { name };
  }
}
