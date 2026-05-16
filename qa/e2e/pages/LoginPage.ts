import type { Locator, Page } from "@playwright/test";
import { accounts } from "../factories/test-data";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId("login-email");
    this.passwordInput = page.getByTestId("login-password");
    this.submitButton = page.getByTestId("login-submit");
    this.errorAlert = page.getByTestId("login-error");
  }

  async goto(): Promise<void> {
    await this.page.goto("/login");
  }

  async fillCredentials(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async login(email: string, password: string): Promise<void> {
    await this.fillCredentials(email, password);
    await this.submit();
  }

  /** Navigate to /login and sign in as the canonical regular user. */
  async loginAsUser(): Promise<void> {
    await this.goto();
    await this.login(accounts.user.email, accounts.user.password);
  }

  /** Navigate to /login and sign in as the canonical admin. */
  async loginAsAdmin(): Promise<void> {
    await this.goto();
    await this.login(accounts.admin.email, accounts.admin.password);
  }
}
