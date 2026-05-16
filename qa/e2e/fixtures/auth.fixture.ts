import type { APIRequestContext, BrowserContext, Page } from "@playwright/test";
import { test as base } from "@playwright/test";
import { ApiClient, type User } from "../utils/api-client";
import { accounts } from "../factories/test-data";

const AUTH_STORAGE_KEY = "shoplite-auth";

type AuthBundle = {
  token: string;
  user: User;
};

async function loginViaApi(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<AuthBundle> {
  const api = new ApiClient(request);
  await api.login(email, password);
  const user = await api.me();
  const token = api.getToken();
  if (!token) {
    throw new Error("login succeeded but ApiClient has no token");
  }
  return { token, user };
}

async function seedAuthIntoBrowser(context: BrowserContext, bundle: AuthBundle): Promise<void> {
  // Match the shape that `zustand/middleware`'s `persist` writes to localStorage,
  // so the frontend boots already authenticated.
  const stored = JSON.stringify({
    state: { token: bundle.token, user: bundle.user },
    version: 0,
  });
  await context.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: AUTH_STORAGE_KEY, value: stored },
  );
}

type AuthFixtures = {
  /** Browser page already logged in as the canonical regular user. */
  userPage: Page;
  /** Browser page already logged in as the canonical admin. */
  adminPage: Page;
  /** Auth bundle (token + user) for the regular user — no browser side-effects. */
  userAuth: AuthBundle;
  /** Auth bundle (token + user) for the admin — no browser side-effects. */
  adminAuth: AuthBundle;
  /** API client pre-authenticated as the regular user. */
  userApi: ApiClient;
  /** API client pre-authenticated as the admin. */
  adminApi: ApiClient;
};

export const authTest = base.extend<AuthFixtures>({
  userAuth: async ({ request }, use) => {
    const bundle = await loginViaApi(request, accounts.user.email, accounts.user.password);
    await use(bundle);
  },

  adminAuth: async ({ request }, use) => {
    const bundle = await loginViaApi(request, accounts.admin.email, accounts.admin.password);
    await use(bundle);
  },

  userPage: async ({ context, request, page }, use) => {
    const bundle = await loginViaApi(request, accounts.user.email, accounts.user.password);
    await seedAuthIntoBrowser(context, bundle);
    await use(page);
  },

  adminPage: async ({ context, request, page }, use) => {
    const bundle = await loginViaApi(request, accounts.admin.email, accounts.admin.password);
    await seedAuthIntoBrowser(context, bundle);
    await use(page);
  },

  userApi: async ({ request }, use) => {
    const client = new ApiClient(request);
    await client.login(accounts.user.email, accounts.user.password);
    await use(client);
  },

  adminApi: async ({ request }, use) => {
    const client = new ApiClient(request);
    await client.login(accounts.admin.email, accounts.admin.password);
    await use(client);
  },
});
