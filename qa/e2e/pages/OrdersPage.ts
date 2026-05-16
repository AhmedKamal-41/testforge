import type { Locator, Page } from "@playwright/test";

export class OrdersPage {
  readonly page: Page;
  readonly orderCards: Locator;
  readonly emptyState: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.orderCards = page.getByTestId("order-card");
    this.emptyState = page.getByTestId("empty-orders");
    this.errorAlert = page.getByTestId("error-alert");
  }

  async goto(): Promise<void> {
    await this.page.goto("/orders");
  }

  orderById(orderId: number): Locator {
    return this.page.locator(`[data-testid="order-card"][data-order-id="${orderId}"]`);
  }
}
