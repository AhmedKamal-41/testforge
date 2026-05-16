# TestForge

TestForge is two things in one repo: **ShopLite**, a small online store, and the tests that exercise it.

ShopLite is a React frontend and a FastAPI backend backed by Postgres. You can browse products, sign in, manage a cart, check out, view past orders, and (as an admin) add or retire products. It is not a production storefront—there are no payments, emails, or shipping—but the flows are real enough to automate properly.

The test side is built with Playwright (TypeScript), pytest, axe for accessibility, screenshot comparison for layout, and optional k6 scripts for light API load. Everything runs against the same Docker stack you use locally. About **120 tests** run in CI on every pull request; k6 stays on a separate manual workflow.

---

## The app

**Frontend** (http://localhost:5173): login, product list, product detail, cart, checkout, order history, admin catalog.

**Backend** (http://localhost:8000, Swagger at `/docs`): JWT login, product catalog, cart, checkout, orders, admin CRUD.

**Database:** Postgres 16 in Compose. Migrations and seeds run when the backend starts—three users and twenty products.

| Email | Password | Role |
|-------|----------|------|
| `admin@shoplite.io` | `admin123` | admin |
| `user@shoplite.io` | `user1234` | user |
| `alice@shoplite.io` | `alice123` | user |

A few backend details matter for the tests:

- Checkout decrements stock in one transaction. Two clients cannot buy the last unit twice.
- Admin “delete” is a soft delete. Old orders still show what was bought; removed products vanish from the public catalog only.
- Adding the same product to the cart twice increases quantity on one row, not two.

---

## Screenshots

These are the pages covered by visual regression (`qa/e2e/tests/visual/`). Baseline PNGs live next to that spec under `pages.visual.spec.ts-snapshots/`.

**Login**

![Login](./docs/screenshots/01-login.png)

**Products** — twenty seeded items; out-of-stock rows disable “Add to cart”.

![Products](./docs/screenshots/02-products.png)

**Cart** — line items, remove, total, checkout button.

![Cart](./docs/screenshots/03-cart.png)

**Checkout** — review lines before placing the order.

![Checkout](./docs/screenshots/04-checkout.png)

**Order confirmation** — shown after a successful checkout. The order number is masked in screenshot tests because it changes every run.

![Order confirmation](./docs/screenshots/05-order-confirmation.png)

**Admin products** — create, edit, and soft-delete catalog entries (admin only).

![Admin](./docs/screenshots/06-admin.png)

---

## How the tests are organized

```
qa/e2e/
  pages/          Page objects (locators live here only)
  fixtures/       Auth and shared setup
  factories/      Test data on top of seeds
  tests/          smoke, regression, api, db, a11y, visual
  scripts/        DB reset between spec files
```

**Setup habits**

- Log in through the API and drop the token into `localStorage` before the page loads. Specs that test the login form still use the UI; everything else avoids logging in through the browser for speed.
- Reset the database between spec files so tests do not depend on order.
- Use `data-testid` in the UI; tests go through page objects, not raw selectors.
- In CI, failed tests keep a screenshot, video, and trace.

**Suites**

| Suite | Tests | Tag | What it checks |
|-------|------:|-----|----------------|
| Smoke | 8 | `@smoke` | Login, catalog, cart, checkout happy path |
| Regression | 36 | `@regression` | Cart edge cases, admin auth, totals, redirects |
| API | 35 | `@api` | HTTP contracts without a browser |
| Database | 12 | `@db` | Rows in Postgres after cart/checkout/admin actions |
| Accessibility | 7 | `@a11y` | axe, WCAG 2.1 AA; fails on serious/critical |
| Visual | 6 | `@visual` | Chromium screenshots |
| Backend (pytest) | 10 | — | FastAPI via TestClient on SQLite |
| Backend (Postgres) | 6 | `@postgres` | Transactions and concurrency on real Postgres |
| **Total** | **120** | | |
| k6 (optional) | 4 scripts | — | Light load on hot API paths |

Backend tests: `pytest -v` in `apps/backend` (no Docker). Postgres integration: `pytest -m postgres -v` with Compose up.

More on strategy and flake handling: [`qa/docs/`](./qa/docs/).

---

## Tech stack

| | |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind, React Query, Zustand |
| Backend | FastAPI, Python 3.12, SQLAlchemy, Alembic, Pydantic, JWT |
| E2E | Playwright, TypeScript |
| A11y | `@axe-core/playwright` |
| Reports | Playwright HTML, Allure |
| CI | GitHub Actions, Docker Compose |

---

## Run the application

```powershell
copy .env.example .env
docker compose up --build
```

| URL | |
|-----|---|
| http://localhost:5173 | Store UI |
| http://localhost:8000/health | API health |
| http://localhost:8000/docs | API docs |

```powershell
docker compose down
docker compose down -v
docker compose exec backend python -m app.seeds.seed --reset
```

---

## Run the tests

Start the stack first for Playwright and k6.

```powershell
cd qa\e2e
npm install
npx playwright install
```

| Command | |
|---------|---|
| `npm run test:smoke` | Critical path (resets DB) |
| `npm run test:regression` | UI regression |
| `npm run test:api` | API only |
| `npm run test:db` | Postgres assertions |
| `npm run test:a11y` | Accessibility |
| `npm run test:visual` | Screenshot compare |
| `npm run test:visual:update` | Refresh baselines after a UI change |
| `npm run test:browsers` | Chromium, Firefox, WebKit |
| `npm test` | Full Playwright suite |

```powershell
cd apps\backend
pip install -r requirements.txt
pytest -v
pytest -m postgres -v
```

k6 (stack must be up):

```powershell
k6 run qa/perf/products.js
k6 run qa/perf/login.js
k6 run qa/perf/cart.js
k6 run qa/perf/checkout.js
```

See [`qa/perf/README.md`](./qa/perf/README.md) for install notes. Load tests are not part of the default PR workflow.

---

## Reports

A Playwright run produces:

1. **Terminal list** — live progress  
2. **HTML report** — `qa/e2e/playwright-report/`  
3. **Allure raw results** — `qa/e2e/allure-results/`  
4. **Failure files** — under `qa/e2e/test-results/` when something breaks  

Those folders are gitignored.

**Open the HTML report**

```powershell
cd qa\e2e
npm test
npm run report
```

**Allure** needs Java 17+ locally. CI installs it for the merge job.

```powershell
npm test
npm run report:allure:generate
npm run report:allure:open
npm run report:allure:serve
```

Before tests run, `global-setup.ts` writes environment info (URL, OS, Node, CI flag) into Allure and copies `qa/e2e/allure/categories.json`, which groups failures as product bugs, test bugs, flaky retries, a11y issues, or visual diffs.

**When a test fails**, you get a screenshot, a video, and a trace zip. Open a trace:

```powershell
npx playwright show-trace qa\e2e\test-results\<folder>\trace.zip
```

**In GitHub Actions**, each Playwright job uploads its HTML report, Allure JSON, and failure artifacts. The `allure-report` job combines all `allure-results-*` into one HTML download. Names to look for: `playwright-report-smoke`, `allure-report`, `test-artifacts-regression`, `visual-diffs`, and `docker-logs-*` when the stack misbehaves.

---

## CI

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs on push and PR to `main`.

1. **quality-gates** — frontend typecheck and build, e2e TypeScript, Python lint  
2. **backend-tests** — `pytest -v`  
3. **Playwright jobs** (each brings up Compose): smoke, api, regression, accessibility, visual  
4. **allure-report** — merged Allure HTML, even if a suite failed  

Playwright jobs use Chromium only in CI. Run `npm run test:browsers` locally for Firefox and WebKit.

Visual tests compare against Linux screenshots on the runner. Windows baselines in the repo use the `*-chromium-win32.png` suffix; CI builds or restores `*-chromium-linux.png` via cache. To regenerate Linux baselines on purpose: run the workflow manually with **Regenerate Linux visual snapshots** checked, then download the `visual-snapshots-linux` artifact.

Load tests: [`.github/workflows/perf.yml`](./.github/workflows/perf.yml) (manual).

---

## Visual regression

Six Chromium screenshots—same views as [above](#screenshots). Tolerance is 1% pixel difference (`playwright.config.ts`). Firefox and WebKit skip visual specs.

```powershell
cd qa\e2e
npm run test:visual
npm run test:visual:update
```

---

## Performance (k6)

Four scripts hit products, login, add-to-cart, and checkout under modest load. They catch obvious latency regressions on a laptop-grade Docker setup; they are not capacity tests. Checkout runs one virtual user so two VUs do not fight over the same seeded cart.

---

## Caveats

This is a demo and test harness, not something you would ship as-is.

- JWTs sit in `localStorage` (fine for tests; use HttpOnly cookies in a real app).
- Seed passwords are in the repo on purpose.
- No rate limiting on login.
- Accessibility CI only fails on serious and critical axe findings.
- Each Playwright CI job starts its own Compose stack—simple, but not the fastest pipeline.

---

## Repo layout

```
apps/frontend/     React store
apps/backend/      API, models, seeds, pytest
qa/e2e/            Playwright
qa/perf/           k6
qa/docs/           Test plan, strategy, flake policy, coverage matrix
docs/screenshots/  Images for this README
.github/workflows/ ci.yml, perf.yml
docker-compose.yml
```

---

## More docs

- [`qa/docs/test-plan.md`](./qa/docs/test-plan.md)  
- [`qa/docs/coverage-matrix.md`](./qa/docs/coverage-matrix.md)  
- [`qa/docs/qa-strategy.md`](./qa/docs/qa-strategy.md)  
- [`qa/docs/flake-policy.md`](./qa/docs/flake-policy.md)  
- [`qa/perf/README.md`](./qa/perf/README.md)  
