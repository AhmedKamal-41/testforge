# Flake Policy

> **A flaky test is a broken test.** It's worse than a missing test, because it teaches the team to ignore red. This document is how we keep TestForge's suite green and trustworthy — what we do by construction to prevent flake, and what we do when it shows up anyway.

Every rule below has a corresponding pattern in the repo. Where one exists, it's linked. Where one doesn't, the rule still applies — there just isn't a current example.

---

## 1. No hard waits

> If a test contains `waitForTimeout`, `sleep`, or `setTimeout`, that line is the bug.

Hard timers paper over real timing issues. The test either fails on a slow machine or wastes seconds on a fast one. Both are flake.

**Use instead:**

- **Web-first auto-retrying assertions** — `expect(locator).toBeVisible()`, `toHaveCount()`, `toHaveText()`. They retry every 100ms up to the configured `expect.timeout` (5s in [`playwright.config.ts`](../e2e/playwright.config.ts)). The assertion *itself* is the wait.
- **Network-event waits** — `page.waitForResponse(...)` when you need to be sure a specific request settled before the next interaction. See [`tests/smoke/cart.spec.ts:15`](../e2e/tests/smoke/cart.spec.ts) — the "add to cart" smoke awaits the POST to `/api/cart/items` before navigating, so it can't race ahead of the cart state.

**Anti-pattern:**

```ts
// ❌ flaky
await page.click('[data-testid="add-to-cart"]');
await page.waitForTimeout(2000);                          // hope it's added by now
await expect(cartPage.items).toHaveCount(1);

// ✅ deterministic
await page.click('[data-testid="add-to-cart"]');
await expect(cartPage.items).toHaveCount(1);              // auto-retries until true
```

**Audit:** the repo is checked with `grep -r "waitForTimeout\|setTimeout(\|sleep(" qa/e2e --include="*.ts"`. Zero matches as of Phase 13.

---

## 2. Retry only in CI

> Local: `retries = 0`. CI: `retries = 2`.

Locally, retries hide bugs. The first run is the honest one — if a test goes red, the dev sees the failure immediately and fixes the underlying race, not the retry threshold.

In CI, retries absorb genuinely random infrastructure noise (slow runner, networking blip) and prevent one bad minute from turning the whole suite red. Two retries is the industry-standard ceiling — more than that and you're masking a real test problem.

Wired in [`playwright.config.ts`](../e2e/playwright.config.ts):

```ts
retries: isCI ? 2 : 0,
```

**If a test only passes on retry, it goes on the watchlist** — see §7 (Quarantine policy).

---

## 3. Seeded test data

> Tests run against a deterministic database. The seed file is the single source of truth.

`apps/backend/app/seeds/seed.py` produces 3 canonical users and 20 canonical products. Every test environment — local Docker, CI runner, every developer — boots from the same fixture. There is no "data drift" between environments.

- **Canonical accounts** are referenced by name from [`qa/e2e/factories/test-data.ts`](../e2e/factories/test-data.ts) — never hardcoded in tests.
- **Ad-hoc data** (e.g., a one-off product for an admin-create test) goes through factories (`makeProduct(overrides)`), not raw object literals. Factories add a monotonic suffix so each invocation gets a unique name — no cross-test collisions.

**Anti-pattern:**

```ts
// ❌ assumes a manual database tweak existed
const product = await api.getProduct(42);

// ✅ pulls a known-seeded record by name
const products = await api.listProducts();
const tee = products.find((p) => p.name === "Classic Tee")!;
```

**DB reset cadence:** spec files that mutate shared state (cart, orders, admin-created products) prepend `node ./scripts/reset-db.mjs` via their npm script. See `test:smoke`, `test:visual` in [`package.json`](../e2e/package.json). For read-only spec files (catalog browse, a11y scans), reset is unnecessary.

---

## 4. API setup hooks

> If a test wants the user logged in, mint a token via API. Don't drive the UI.

UI login is itself a test (`tests/smoke/login.spec.ts`). Using UI login as a *setup* step couples every other test to that test's stability, and triples the time spent on the same flow.

Implementation in [`qa/e2e/fixtures/auth.fixture.ts`](../e2e/fixtures/auth.fixture.ts):

```ts
async function loginViaApi(request, email, password): Promise<AuthBundle> {
  const api = new ApiClient(request);
  await api.login(email, password);                       // POST /api/auth/login
  const user = await api.me();
  return { token: api.getToken()!, user };
}
```

The token is then dropped into `localStorage` via `context.addInitScript()` so the page boots already authenticated. `userPage` and `adminPage` fixtures expose this — every test that needs auth simply destructures the right one.

**Same rule for any other state setup:**
- Pre-seed a cart for a checkout test? `userApi.addCartItem(...)`.
- Pre-create orders for a history test? `userApi.checkout()`.
- Pre-build a product for an admin-edit test? `adminApi.createProduct(...)`.

UI is the test target, not the test scaffolding.

---

## 5. Test isolation

> No test depends on another. Order doesn't matter. Parallelism doesn't matter (except where explicitly serialized).

Three layers:

1. **Per-spec database state** — DB reset before suites that mutate shared rows (see §3).
2. **Per-test cart state** — specs that exercise the cart use `test.beforeEach(({ userApi }) => userApi.clearCart())` so each test starts from an empty cart. See [`tests/smoke/cart.spec.ts:8`](../e2e/tests/smoke/cart.spec.ts).
3. **Serial mode where same-user state would race** — when two tests in the same file both mutate the same user's cart, `test.describe.configure({ mode: "serial" })` forces sequential execution. This is the *only* place we accept ordering; it's scoped to one describe block.

**What we don't do:**
- No "test A creates the order that test B asserts on."
- No "test B must run after test A because it depends on stock decrement from A."
- No global counters or shared mutable state outside the database.

If a test reads "X must exist" — that X comes from the seed, the factory, or this test's own setup. Never from another test.

---

## 6. Network mocking where useful

> Don't mock for the sake of mocking. Mock when the alternative is slow, flaky, or impossible.

Default in this repo is **real backend** — Docker stack up, real requests, real Postgres. The whole point of a stack-up-front e2e framework is that integration is the thing under test.

Mocking via [`page.route()`](https://playwright.dev/docs/network) is the right tool when:

| Scenario                                    | Why mock                                                           |
|---------------------------------------------|--------------------------------------------------------------------|
| Verifying frontend error states             | The backend may not produce a 500 on demand; intercept the response |
| Slow third-party (analytics, telemetry)     | Block or stub so the test isn't gated on a flaky external service |
| Frontend behavior on partial/empty payloads | Force the edge case the seeded data doesn't naturally hit         |
| Offline / network failure paths             | `page.route(url, route => route.abort())`                          |

**Pattern:**

```ts
// Force the products endpoint to return a 500 and verify the error UI.
await page.route("**/api/products", (route) => route.fulfill({ status: 500, body: "{}" }));
await page.goto("/products");
await expect(page.getByTestId("error-alert")).toBeVisible();
```

**Anti-pattern:** mocking `/api/auth/login` in a login *integration* test — that test exists specifically to prove the real backend honors the contract. Mocking it tests nothing useful.

Use mocking to *narrow scope*, never to *avoid the backend*.

---

## 7. Quarantine policy

> A test that fails when nothing changed is the test team's job, not the dev team's blocker.

**Lifecycle:**

1. **Tag and skip from the gate.** Add `@quarantine` to the test title and remove its other gating tags (`@smoke` etc. stay if they apply for documentation, but the CI smoke job filters to `--grep @smoke --grep-invert @quarantine`).
2. **File a triage ticket the same day.** The ticket cites the failure run, the suspected cause, and the owner. Tracked in the bug tracker (see [`bug-report-template.md`](./bug-report-template.md)).
3. **Triage within 1 working day.** Either fix the underlying race, fix the product bug it exposed, or — if both are impractical — document why the test is unreliable and either restructure it or delete it. Quarantine is **temporary**, never permanent.
4. **Un-tag and re-gate** once the root cause is resolved. Watch the test through three consecutive green runs before considering it stable again.

**Trigger criteria:**
- A test passes on retry 3 times in a rolling 7-day window, **or**
- A test fails on a clean CI run with no recent code change in its area of coverage, **or**
- A developer needs to rerun to land their PR more than once for the same test.

**What quarantine is not:**
- Not a graveyard. A quarantined test with no movement after 5 working days gets escalated or deleted.
- Not a substitute for fixing the underlying race. If three tests for the same feature get quarantined, the feature itself needs a flake review.

**Where it's wired:** `@quarantine` is one of the standing tags in [`qa-strategy.md`](./qa-strategy.md). CI's grep expressions will exclude it once a test first lands there.

---

## 8. Good vs bad selectors

> Pick the selector that survives the next CSS refactor and the next layout change.

**The hierarchy, best to worst:**

1. ✅ **`data-testid`** — purpose-built, doesn't appear in CSS or business logic. Every interactive element in the frontend has one, baked in at build time (see CLAUDE.md rule 16).
   ```ts
   page.getByTestId("login-submit");
   ```
2. ✅ **`getByRole` + name** — accessible, survives layout changes, doubles as an a11y check (if the test can find it by role, a screen reader can too).
   ```ts
   page.getByRole("button", { name: "Add to cart" });
   ```
3. 🟡 **Visible text** (`getByText`) — fine for stable copy, fragile for anything that gets translated or A/B-tested.
4. 🟡 **Composed `data-testid` + data-attribute** — used in this repo for collection items: `[data-testid="cart-item"][data-product-id="${id}"]`. Pattern is in [`pages/CartPage.ts:27`](../e2e/pages/CartPage.ts), [`pages/OrdersPage.ts:21`](../e2e/pages/OrdersPage.ts), [`pages/AdminProductsPage.ts:50`](../e2e/pages/AdminProductsPage.ts). Stable as long as both attributes survive.
5. ❌ **CSS classes** — `.btn-primary`, `.product-card__title` — break on every Tailwind refactor.
6. ❌ **Tag + nth-child** — `tr:nth-child(3) td:nth-child(2)` — breaks on every row insert.
7. ❌ **XPath in general** — verbose, slow, brittle.

**Locator-only rule:** locators live in page objects. Tests describe *intent* (`cartPage.removeByProductName("Classic Tee")`), page objects describe *interaction* (the testid composition), and the frontend owns the contract (the `data-testid` attribute itself).

**Anti-pattern:**

```ts
// ❌ tightly coupled to markup
await page.locator(".product-grid > div:first-child .btn").click();

// ✅ via page object
await productsPage.addFirstProductToCart();
```

---

## How we audit for flake

These are checks any contributor can run before opening a PR:

| Check                                    | Command                                                              |
|------------------------------------------|----------------------------------------------------------------------|
| Hard waits in the test code              | `grep -r "waitForTimeout\|setTimeout(\|sleep(" qa/e2e --include="*.ts"` |
| Raw CSS selectors in page objects        | `grep -rE "locator\\([\"'][.#]" qa/e2e/pages`                        |
| Hardcoded credentials (should use `accounts`) | `grep -r "@shoplite.io" qa/e2e --include="*.ts" \| grep -v factories` |
| Hardcoded product ids/names              | `grep -rE "products\\[[0-9]+\\]\\.id" qa/e2e --include="*.ts"`       |
| Cross-test ordering assumptions          | review by reading — look for `beforeAll` that mutates shared state without cleanup |

Any non-empty result is investigated. Most should stay empty.

---

## What to do when a test fails

1. **Read the trace, not just the screenshot.** `npx playwright show-trace path/to/trace.zip` — the trace shows the DOM at every step, every network call, every assertion. It almost always reveals the actual cause.
2. **Rerun once locally.** If it passes on rerun, that's a flake — don't merge; investigate. If it fails consistently, it's a real bug.
3. **Don't add a retry to make it go away.** Don't add a `waitForTimeout`. Don't downgrade the assertion. Find what changed in product or test, and fix that.
4. **If you can't reproduce within 30 minutes, quarantine it** (§7) and continue. The job is to keep the suite trustworthy, not to win a single fight.

---

## Files this policy depends on

| File                                                | Role                                                |
|-----------------------------------------------------|-----------------------------------------------------|
| [`qa/e2e/playwright.config.ts`](../e2e/playwright.config.ts) | Retries, timeouts, trace/video/screenshot on failure |
| [`qa/e2e/fixtures/auth.fixture.ts`](../e2e/fixtures/auth.fixture.ts) | API-minted auth, no UI-login setup     |
| [`qa/e2e/fixtures/test.ts`](../e2e/fixtures/test.ts) | Merged fixture exports                              |
| [`qa/e2e/factories/test-data.ts`](../e2e/factories/test-data.ts) | Canonical accounts + factories                      |
| [`qa/e2e/scripts/reset-db.mjs`](../e2e/scripts/reset-db.mjs) | DB reset between specs                              |
| [`apps/backend/app/seeds/seed.py`](../../apps/backend/app/seeds/seed.py) | The single source of truth for test data           |
| [`qa/e2e/pages/`](../e2e/pages/)                    | All locators (no locators outside this directory)   |
