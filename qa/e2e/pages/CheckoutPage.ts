import type { Locator, Page } from "@playwright/test";

export class CheckoutPage {
  readonly page: Page;
  readonly lineItems: Locator;
  readonly total: Locator;
  readonly submitButton: Locator;
  readonly emptyState: Locator;
  readonly errorAlert: Locator;

  // confirmation view (rendered after a successful POST /api/checkout)
  readonly confirmation: Locator;
  readonly confirmationId: Locator;
  readonly confirmationTotal: Locator;
  readonly viewOrdersLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.lineItems = page.getByTestId("checkout-line-item");
    this.total = page.getByTestId("checkout-total");
    this.submitButton = page.getByTestId("checkout-submit");
    this.emptyState = page.getByTestId("checkout-empty");
    this.errorAlert = page.getByTestId("error-alert");
    this.confirmation = page.getByTestId("order-confirmation");
    this.confirmationId = page.getByTestId("order-confirmation-id");
    this.confirmationTotal = page.getByTestId("order-confirmation-total");
    this.viewOrdersLink = page.getByTestId("view-orders-link");
  }

  async goto(): Promise<void> {
    await this.page.goto("/checkout");
  }

  async placeOrder(): Promise<void> {
    await this.submitButton.click();
  }
}
