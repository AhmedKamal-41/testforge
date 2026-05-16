import { expect, type Locator, type Page } from "@playwright/test";

/** Assert the `error-alert` testid is visible and (optionally) contains a substring. */
export async function expectErrorAlert(page: Page, contains?: string): Promise<void> {
  const alert = page.getByTestId("error-alert");
  await expect(alert).toBeVisible();
  if (contains) {
    await expect(alert).toContainText(contains);
  }
}

/** Assert the browser is currently on a path matching the given regex or pathname. */
export async function expectOnPath(page: Page, pathOrRegex: string | RegExp): Promise<void> {
  const match = typeof pathOrRegex === "string" ? new RegExp(`${pathOrRegex}$`) : pathOrRegex;
  await expect(page).toHaveURL(match);
}

/** Assert a locator collection has the expected count, with a more descriptive failure message. */
export async function expectCount(locator: Locator, expected: number, label: string): Promise<void> {
  await expect(locator, `${label} count`).toHaveCount(expected);
}
