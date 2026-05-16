import type { Locator, Page } from "@playwright/test";

export type AdminProductFormInput = {
  name?: string;
  category?: string;
  price?: string;
  stock?: string;
  imageUrl?: string;
  description?: string;
};

export class AdminProductsPage {
  readonly page: Page;
  readonly form: Locator;
  readonly nameInput: Locator;
  readonly categoryInput: Locator;
  readonly priceInput: Locator;
  readonly stockInput: Locator;
  readonly imageUrlInput: Locator;
  readonly descriptionInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly flash: Locator;
  readonly errorAlert: Locator;
  readonly table: Locator;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.form = page.getByTestId("admin-product-form");
    this.nameInput = page.getByTestId("admin-input-name");
    this.categoryInput = page.getByTestId("admin-input-category");
    this.priceInput = page.getByTestId("admin-input-price");
    this.stockInput = page.getByTestId("admin-input-stock");
    this.imageUrlInput = page.getByTestId("admin-input-image-url");
    this.descriptionInput = page.getByTestId("admin-input-description");
    this.saveButton = page.getByTestId("admin-save");
    this.cancelButton = page.getByTestId("admin-cancel");
    this.flash = page.getByTestId("admin-flash");
    this.errorAlert = page.getByTestId("error-alert");
    this.table = page.getByTestId("admin-products-table");
    this.rows = page.getByTestId("admin-product-row");
  }

  async goto(): Promise<void> {
    await this.page.goto("/admin/products");
  }

  rowForProductId(productId: number): Locator {
    return this.page.locator(`[data-testid="admin-product-row"][data-product-id="${productId}"]`);
  }

  async fillForm(values: AdminProductFormInput): Promise<void> {
    if (values.name !== undefined) await this.nameInput.fill(values.name);
    if (values.category !== undefined) await this.categoryInput.fill(values.category);
    if (values.price !== undefined) await this.priceInput.fill(values.price);
    if (values.stock !== undefined) await this.stockInput.fill(values.stock);
    if (values.imageUrl !== undefined) await this.imageUrlInput.fill(values.imageUrl);
    if (values.description !== undefined) await this.descriptionInput.fill(values.description);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
  }

  async editByProductId(productId: number): Promise<void> {
    await this.rowForProductId(productId).getByTestId("admin-edit").click();
  }

  async deleteByProductId(productId: number): Promise<void> {
    await this.rowForProductId(productId).getByTestId("admin-delete").click();
  }
}
