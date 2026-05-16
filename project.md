# TestForge — Project Inventory

> Exhaustive technical reference for the TestForge / ShopLite project. Every metric, every file area, every endpoint, every test, every config.
>
> This is the *reference* document. The recruiter-facing narrative lives in [`README.md`](./README.md); the QA doctrine lives in [`qa/docs/`](./qa/docs/).

---

## Table of contents

- [1. Headline metrics](#1-headline-metrics)
- [2. Tech stack matrix](#2-tech-stack-matrix)
- [3. Repository inventory](#3-repository-inventory)
- [4. Backend (FastAPI)](#4-backend-fastapi)
- [5. Frontend (React + TypeScript)](#5-frontend-react--typescript)
- [6. Database](#6-database)
- [7. Test inventory (every test, named)](#7-test-inventory-every-test-named)
- [8. CI / CD](#8-ci--cd)
- [9. Reporting & artifacts](#9-reporting--artifacts)
- [10. Performance testing (k6)](#10-performance-testing-k6)
- [11. Accessibility findings](#11-accessibility-findings)
- [12. Visual regression](#12-visual-regression)
- [13. Configuration files](#13-configuration-files)
- [14. QA documentation set](#14-qa-documentation-set)
- [15. Build phases timeline](#15-build-phases-timeline)
- [16. Coding rules (CLAUDE.md, summarized)](#16-coding-rules-claudemd-summarized)

---

## 1. Headline metrics

| Dimension                                                | Value                          |
|----------------------------------------------------------|--------------------------------|
| **Functional / quality tests**                           | **120**                        |
| ├ Playwright UI smoke                                    | 8                              |
| ├ Playwright UI regression                               | 36                             |
| ├ Playwright API contract                                | 35                             |
| ├ Playwright DB validation                               | 12                             |
| ├ Playwright accessibility (axe-core)                    | 7                              |
| ├ Playwright visual regression                           | 6                              |
| ├ Backend pytest fast (SQLite, TestClient)               | 10                             |
| └ Backend pytest Postgres integration (`-m postgres`)    | 6                              |
| **k6 performance scenarios (separate from tests)**       | **4**                          |
| **Spec files**                                           | 25 Playwright + 5 pytest + 4 k6 = 34 |
| **Page objects**                                         | 8 (`pages/`)                   |
| **Fixtures**                                             | 2 files (`auth.fixture.ts`, `test.ts`); 9 named fixtures |
| **Test data factories**                                  | 1 file, exports `accounts`, `makeProduct()`, `seededProductNames` |
| **HTTP routes total**                                    | **15** — 14 application API routes across 6 routers + 1 health route |
| **DB tables**                                            | 5 (`users`, `products`, `cart_items`, `orders`, `order_items`) |
| **Frontend pages**                                       | 7                              |
| **Frontend components**                                  | 6                              |
| **GitHub Actions workflows**                             | 2 (`ci.yml` + `perf.yml`)      |
| **PR CI jobs**                                           | 7 (quality-gates + backend + 4 Playwright + Allure merge) |
| **Manual workflows**                                     | 2 (`playwright-visual`, `perf.yml`) |
| **Report formats**                                       | 2 (Playwright HTML + Allure)   |
| **Allure failure categories**                            | 5                              |
| **Browsers**                                             | Playwright configured for Chromium, Firefox, WebKit; PR CI runs Chromium only; full cross-browser via local `npm run test:browsers` or manual workflow |
| **k6 thresholds enforced**                               | 8 (4 endpoints × p95 + error-rate) |

### Lines of code (excluding `node_modules`, build artifacts, caches)

| Area                                                | Files | Lines  |
|-----------------------------------------------------|------:|-------:|
| Backend application (`apps/backend/app/`)           | ~25   | 952    |
| Backend Alembic migrations                          |   3   | 161    |
| Backend tests (`apps/backend/tests/` incl. integration) |   8   | 534    |
| Frontend source (`apps/frontend/src/`)              | ~20   | 1,266  |
| Playwright framework (`qa/e2e/**/*.ts`)             |  ~30  | 2,864  |
| k6 + perf README (`qa/perf/`)                       |   6   | 357    |
| QA docs (`qa/docs/*.md`)                            |   6   | 447    |
| Infra (compose + Dockerfiles + workflows + ruff.toml)|  6   | 546    |
| **Total tracked source**                            | **~104** | **~7,127** |

(Excludes generated reports, baselines, lockfiles, and auto-generated `__init__.py`-style stubs.)

---

## 2. Tech stack matrix

| Layer          | Choice                                                             |
|----------------|--------------------------------------------------------------------|
| **Frontend framework** | React 18 + TypeScript (strict)                            |
| Build tool             | Vite                                                       |
| Styling                | Tailwind CSS                                               |
| Server state           | TanStack React Query                                       |
| Client state           | Zustand (with `persist` middleware → `localStorage`)       |
| Routing                | React Router v6                                            |
| HTTP client            | axios                                                      |
| **Backend framework**  | FastAPI                                                    |
| Language               | Python 3.12                                                |
| ORM                    | SQLAlchemy 2.x (modern declarative)                        |
| Migrations             | Alembic                                                    |
| Validation             | Pydantic v2                                                |
| Auth                   | JWT (HS256) + bcrypt                                       |
| ASGI server            | uvicorn                                                    |
| **Database**           | PostgreSQL 16 (Docker), SQLite for in-process pytest       |
| **E2E + API tests**    | Playwright + TypeScript                                    |
| DB tests               | Playwright + `pg` driver                                   |
| Accessibility          | `@axe-core/playwright`                                     |
| Visual                 | Playwright `toHaveScreenshot()`                            |
| Performance            | k6 (Go binary or `grafana/k6` Docker image)                |
| **Reports**            | Playwright HTML + Allure (`allure-playwright`)             |
| Allure CLI             | `allure-commandline` (Java)                                |
| **CI**                 | GitHub Actions                                             |
| Browsers in CI         | Chromium (PR), firefox/webkit on demand                    |
| **Containers**         | Docker + Docker Compose v2                                 |
| Frontend image         | multi-stage: `node:20-alpine` build → `nginx:alpine` runtime |
| Backend image          | `python:3.12-slim` + entrypoint runs migrations + seed     |

---

## 3. Repository inventory

```
testforge/
├── .github/
│   └── workflows/
│       ├── ci.yml             329 lines — quality-gates + backend pytest + 4 Playwright jobs + Allure merge
│       └── perf.yml            88 lines — manual k6 workflow
├── docs/
│   └── screenshots/           6 PNGs (login, products, cart, checkout, order, admin)
├── apps/
│   ├── frontend/              React + TS + Vite (1,266 LOC src)
│   └── backend/               FastAPI + SQLAlchemy + Alembic
│       ├── app/               952 LOC application
│       ├── alembic/versions/  161 LOC across 2 migrations (initial + soft delete)
│       ├── tests/             534 LOC (fast SQLite layer + Postgres integration layer)
│       └── ruff.toml          17 lines — lint config
├── qa/
│   ├── e2e/                   Playwright framework (2,864 LOC TS)
│   ├── perf/                  k6 scenarios + README (357 LOC)
│   └── docs/                  QA paper trail (447 LOC MD)
├── docker-compose.yml         67 lines — db + backend + frontend
├── .env.example
├── .gitignore                 75 lines — covers node, py, playwright, allure, docker, env
├── README.md                  recruiter-facing
├── CLAUDE.md                  coding rules for contributors (human or AI)
└── project.md                 this file
```

**Approximate tracked file count: 169** (excludes `node_modules`, `__pycache__`, generated reports, build outputs, browser caches, `db_data/`).

---

## 4. Backend (FastAPI)

### 4.1 Application layout

```
apps/backend/app/
├── api/                  HTTP routers (one per resource)
│   ├── admin_products.py     POST/PUT/DELETE under /api/admin/products
│   ├── auth.py               /api/auth/login + /logout + /me
│   ├── cart.py               /api/cart and /api/cart/items
│   ├── checkout.py           /api/checkout
│   ├── orders.py             /api/orders (list + detail)
│   ├── products.py           /api/products (list + detail)
│   └── router.py             aggregator — mounts all 6 routers
├── models/               SQLAlchemy 2.x models (5 tables)
├── schemas/              Pydantic v2 request/response shapes
├── services/             business logic (one file per domain)
├── seeds/
│   └── seed.py               3 users + 20 products; idempotent + --reset
├── config.py             pydantic-settings (env-driven)
├── database.py           engine, SessionLocal, Base, get_db
├── deps.py               get_current_user, require_admin (FastAPI Depends)
├── security.py           JWT encode/decode, bcrypt hashing
└── main.py               FastAPI app factory + /health route
```

### 4.2 HTTP API surface

**15 total HTTP routes: 14 application API routes across 6 routers + 1 health route.** Status codes are explicit on every mutation.

| Method | Path                                | Auth     | Returns                      | Source                              |
|--------|-------------------------------------|----------|------------------------------|-------------------------------------|
| GET    | `/health`                           | none     | `{"status": "ok"}`           | `main.py`                           |
| POST   | `/api/auth/login`                   | none     | 200 `{access_token, token_type}` | `api/auth.py:15`                |
| POST   | `/api/auth/logout`                  | bearer   | 200 `{detail}`               | `api/auth.py:26`                    |
| GET    | `/api/auth/me`                      | bearer   | 200 `UserOut`                | `api/auth.py:33`                    |
| GET    | `/api/products`                     | none     | 200 `list[ProductOut]`       | `api/products.py:11`                |
| GET    | `/api/products/{id}`                | none     | 200 `ProductOut` / 404       | `api/products.py:16`                |
| POST   | `/api/admin/products`               | admin    | 201 `ProductOut`             | `api/admin_products.py:13`          |
| PUT    | `/api/admin/products/{id}`          | admin    | 200 `ProductOut` / 404       | `api/admin_products.py:22`          |
| DELETE | `/api/admin/products/{id}`          | admin    | 204                          | `api/admin_products.py:35`          |
| GET    | `/api/cart`                         | bearer   | 200 `CartOut`                | `api/cart.py:29`                    |
| POST   | `/api/cart/items`                   | bearer   | 201 `CartOut`                | `api/cart.py:37`                    |
| DELETE | `/api/cart/items/{id}`              | bearer   | 200 `CartOut` / 404          | `api/cart.py:50`                    |
| POST   | `/api/checkout`                     | bearer   | 201 `OrderOut` / 400         | `api/checkout.py:13`                |
| GET    | `/api/orders`                       | bearer   | 200 `list[OrderOut]`         | `api/orders.py:13`                  |
| GET    | `/api/orders/{id}`                  | bearer   | 200 `OrderOut` / 404         | `api/orders.py:21`                  |

**Error envelope:** application errors use a consistent `{"detail": "..."}` shape; FastAPI's framework-level validation errors (422) follow FastAPI's standard array shape. No tracebacks leak.

### 4.3 Models (SQLAlchemy 2.x)

| Model       | Table          | Key columns                                                                |
|-------------|----------------|----------------------------------------------------------------------------|
| `User`      | `users`        | `id`, `email` (unique), `full_name`, `hashed_password`, `role`, `created_at` |
| `Product`   | `products`     | `id`, `name`, `description`, `price` (Numeric 10,2), `stock`, `category` (indexed), `image_url`, `is_active` (indexed, default true), `deleted_at` (nullable), `created_at` |
| `CartItem`  | `cart_items`   | `id`, `user_id` (FK→users), `product_id` (FK→products), `quantity`, `created_at`. Unique constraint `(user_id, product_id)` |
| `Order`     | `orders`       | `id`, `user_id` (FK→users), `total`, `status` ("placed"), `created_at`     |
| `OrderItem` | `order_items`  | `id`, `order_id` (FK→orders, CASCADE), `product_id` (FK→products), `product_name`, `unit_price`, `quantity` |

Cascades: `User → cart_items, orders` (delete cascade). `Order → order_items` (delete-orphan).

### 4.4 Services (business logic)

| File                     | Responsibility                                                    |
|--------------------------|-------------------------------------------------------------------|
| `services/auth.py`       | Verify password + issue JWT                                       |
| `services/products.py`   | List + lookup catalog rows. **Public queries filter on `is_active=true`**; admin queries see everything. `delete_product` soft-deletes (flips `is_active` + stamps `deleted_at`) — historical `order_items` rows are unaffected because they store `product_name` + `unit_price` at the time of purchase. |
| `services/cart.py`       | Add/remove/list cart items, merge same-product quantities (`uq_cart_user_product`). Rejects soft-deleted products. |
| `services/checkout.py`   | **Concurrency-safe checkout.** Uses an atomic `UPDATE products SET stock = stock - q WHERE id = ? AND is_active AND stock >= q` for every line; if any returns `rowcount=0`, raises `CheckoutError` and rolls back the entire transaction (no partial order, no partial stock decrement, no stock-goes-negative). Verified by a threaded concurrent-oversell test in the Postgres integration suite. |
| `services/orders.py`     | List user's orders, fetch by id (404 if not owner)                |

### 4.5 Schemas (Pydantic v2)

| File             | Schemas                                                              |
|------------------|----------------------------------------------------------------------|
| `schemas/auth.py`     | `LoginIn`, `TokenOut`, `Message`                                |
| `schemas/product.py`  | `ProductOut`, `ProductCreate`, `ProductUpdate`                  |
| `schemas/cart.py`     | `CartItemIn`, `CartItemOut`, `CartOut`                          |
| `schemas/checkout.py` | (re-exports `OrderOut`)                                         |
| `schemas/order.py`    | `OrderItemOut`, `OrderOut`                                      |
| `schemas/common.py`   | `Message`, `HealthOut`                                          |

All routes — including `/health` (`response_model=HealthOut`) — receive and return Pydantic models. Application errors use a consistent `{"detail": "..."}` shape; FastAPI's framework-level validation errors (422) follow its standard array shape.

### 4.6 Auth model

- **Token type:** JWT, HS256, bearer.
- **Claims:** `sub` = user id, `email`, `role`, `exp`.
- **Hashing:** bcrypt with cost factor 12 (default).
- **Stateless** — no server-side session table. Logout is a client-side discard.
- **Dependency:** `get_current_user` reads the `Authorization: Bearer <token>` header; `require_admin` adds a role check.

### 4.7 Backend pytest tests

Two layers, by design:

**Fast API/integration tests** — `apps/backend/tests/` — 10 tests, SQLite-backed via `conftest.py`, run without Docker. These exercise the FastAPI app in-process through `TestClient` and verify shapes, status codes, and basic state changes. Default `pytest` invocation runs only these (`addopts = ... -m "not postgres"`).

| File                | Tests |
|---------------------|-------|
| `test_health.py`    | `test_health_returns_ok` |
| `test_auth.py`      | `test_login_success`, `test_login_failure_wrong_password`, `test_login_failure_unknown_email` |
| `test_products.py`  | `test_list_products_returns_seeded`, `test_product_detail_returns_one`, `test_product_detail_404` |
| `test_checkout.py`  | `test_checkout_success`, `test_checkout_failure_empty_cart`, `test_checkout_rejects_quantity_above_stock_without_partial_writes` |

**Postgres integration tests** — `apps/backend/tests/integration/` — 6 tests, opt-in via `pytest -m postgres`. Each runs in its own isolated schema (`itest_<uuid>`) created with the full DDL, so they don't pollute the seeded dev database. These exercise transactional behavior that SQLite can't fairly model: concurrent stock decrement, FK relationship integrity, and partial-write rollback under failure.

| Test                                                       | What it proves                                                              |
|------------------------------------------------------------|-----------------------------------------------------------------------------|
| `test_checkout_creates_order_in_postgres`                  | A successful checkout produces a persisted `orders` row owned by the user   |
| `test_checkout_creates_order_items_per_cart_line`          | One `order_items` row per distinct product line, with `product_name`/`unit_price` snapshotted |
| `test_cart_unique_constraint_merges_same_product`          | `uq_cart_user_product` + service merge logic produces a single row, not duplicates |
| `test_checkout_persists_stock_decrement`                   | `products.stock` reflects the purchase after commit                         |
| `test_checkout_rolls_back_on_insufficient_stock`           | Asking for more than `stock` leaves zero orders, zero order_items, stock unchanged |
| `test_concurrent_checkout_cannot_oversell`                 | Two threads buying the last unit at the same time: exactly one succeeds, stock ends at 0 (never negative) |

---

## 5. Frontend (React + TypeScript)

### 5.1 Application layout

```
apps/frontend/src/
├── pages/                7 page components
├── components/           6 shared components
├── stores/auth.ts        Zustand store (persisted as "shoplite-auth" in localStorage)
├── lib/
│   ├── api.ts            axios client + endpoint wrappers + extractError()
│   └── types.ts          shared TS types (Product, Order, etc.)
├── router.tsx            React Router v6 config + 404 page
├── main.tsx              entry: QueryClient + Router + Layout
└── index.css             Tailwind directives
```

### 5.2 Pages (7)

| Path                    | Component               | Auth required | Notes                                    |
|-------------------------|-------------------------|---------------|------------------------------------------|
| `/login`                | `LoginPage.tsx`         | no            | Email + password form, error alert       |
| `/products`             | `ProductsPage.tsx`      | no            | Grid of 20 product cards, out-of-stock labelled |
| `/products/:id`         | `ProductDetailPage.tsx` | no            | Single product, large CTA                |
| `/cart`                 | `CartPage.tsx`          | yes (redirect)| Line items + total + checkout CTA + empty state |
| `/checkout`             | `CheckoutPage.tsx`      | yes           | Order review → POST /api/checkout → confirmation panel |
| `/orders`               | `OrdersPage.tsx`        | yes           | Order history list                       |
| `/admin/products`       | `AdminProductsPage.tsx` | yes (admin)   | CRUD form + product table                |

Plus a 404 catch-all in `router.tsx`.

### 5.3 Components (6)

| Component           | Purpose                                                       |
|---------------------|---------------------------------------------------------------|
| `Layout.tsx`        | App shell — header + NavBar + outlet                          |
| `NavBar.tsx`        | Brand link, route links, current user, logout, Admin link (role-gated) |
| `ProductCard.tsx`   | Used on `/products` and admin views                           |
| `ProtectedRoute.tsx`| Guard wrapping authed routes; redirects to `/login`           |
| `ErrorAlert.tsx`    | Standard error UI with `data-testid="error-alert"`            |
| `Loading.tsx`       | Spinner / pending state                                       |

### 5.4 State management

| Store                | Tech            | Lives in                                                 |
|----------------------|-----------------|----------------------------------------------------------|
| Server state         | TanStack React Query | `useQuery`/`useMutation` per page                   |
| Auth (token + user)  | Zustand + `persist` middleware | `stores/auth.ts`, key `shoplite-auth` in localStorage |

Test fixtures inject the persisted-store shape directly via `addInitScript`, so the page boots already authenticated without ever rendering the login form.

### 5.5 data-testid contract

Every interactive element has a `data-testid`, set at build time. Page objects consume them; tests never know the actual attribute name.

| `data-testid`             | Where                                       |
|---------------------------|---------------------------------------------|
| `login-email`             | LoginPage                                   |
| `login-password`          | LoginPage                                   |
| `login-submit`            | LoginPage                                   |
| `login-error`             | LoginPage (validation)                      |
| `logout-button`           | NavBar                                      |
| `current-user`            | NavBar                                      |
| `product-card`            | ProductsPage (one per product)              |
| `product-title`           | ProductCard                                 |
| `product-description`     | ProductCard                                 |
| `product-price`           | ProductCard                                 |
| `product-detail`          | ProductDetailPage                           |
| `product-detail-title`    | ProductDetailPage                           |
| `product-detail-stock`    | ProductDetailPage                           |
| `add-to-cart`             | ProductCard + ProductDetailPage             |
| `cart-item`               | CartPage (one per row)                      |
| `remove-cart-item`        | CartPage                                    |
| `checkout-button`         | CartPage                                    |
| `checkout-page`           | CheckoutPage                                |
| `checkout-line-item`      | CheckoutPage                                |
| `checkout-total`          | CheckoutPage                                |
| `checkout-submit`         | CheckoutPage                                |
| `checkout-empty`          | CheckoutPage (empty state)                  |
| `order-confirmation`      | CheckoutPage (success state)                |
| `order-confirmation-id`   | CheckoutPage (the order #, masked in visual snapshots) |
| `order-confirmation-total`| CheckoutPage                                |
| `view-orders-link`        | CheckoutPage                                |
| `order-card`              | OrdersPage                                  |
| `order-id`                | OrdersPage                                  |
| `order-status`            | OrdersPage                                  |
| `order-total`             | OrdersPage                                  |
| `admin-products-table`    | AdminProductsPage                           |
| `admin-product-row`       | AdminProductsPage (one per product)         |
| `admin-product-form`      | AdminProductsPage                           |
| `admin-save`              | AdminProductsPage                           |
| `error-alert`             | shared `ErrorAlert`                         |
| `empty-products`          | ProductsPage (empty catalog state)          |
| `empty-orders`            | OrdersPage (empty history state)            |
| `not-found`               | router.tsx 404 page                         |

---

## 6. Database

### 6.1 Schema (5 tables)

```
users ────┬──< cart_items >── products  (is_active, deleted_at — soft delete)
          │                       ▲
          └──< orders >──< order_items ─┘  (order_items snapshot product_name + unit_price)
```

Cascades + uniqueness:
- `users.email` unique
- `cart_items (user_id, product_id)` unique → enforces merge-on-readd (proven by Postgres integration test)
- `orders → order_items` cascade delete + delete-orphan
- `users → cart_items, orders` cascade delete on user removal
- `products.category` indexed for filter speed
- `products.is_active` indexed (`ix_products_is_active`) — public catalog filter
- `products.deleted_at` nullable timestamp — set when admin soft-deletes; `order_items` snapshots `product_name` + `unit_price` so historical orders are unaffected

### 6.2 Seed data (`apps/backend/app/seeds/seed.py`)

**3 users — DEMO-ONLY seed credentials** (fake local/demo accounts used only for development and automated tests; not real secrets; only `.env.example` is committed):

| Email                 | Password   | Role  |
|-----------------------|------------|-------|
| `admin@shoplite.io`   | `admin123` | admin |
| `user@shoplite.io`    | `user1234` | user  |
| `alice@shoplite.io`   | `alice123` | user  |

**20 products** across 4 categories (`apparel`, `books`, `electronics`, `home`), prices $9.50–$249, stock 25–100 per product. The `seededProductNames` constant in `qa/e2e/factories/test-data.ts` mirrors the list and is asserted on by `seed.db.spec.ts`.

CLI: `python -m app.seeds.seed` (idempotent), `python -m app.seeds.seed --reset` (drop + recreate + reseed).

### 6.3 Migrations (Alembic)

Two migrations, applied in order on container boot via `docker-entrypoint.sh`:

| Revision                       | What it does                                                                 |
|--------------------------------|------------------------------------------------------------------------------|
| `0001_initial`                 | Creates all 5 tables, unique constraints, and the `ix_products_category` index |
| `0002_product_soft_delete`     | Adds `products.is_active` (boolean, default true) and `products.deleted_at` (nullable), plus `ix_products_is_active` |

Idempotent — re-running against a populated DB is a no-op.

---

## 7. Test inventory (every test, named)

### 7.1 Smoke — 8 tests (`@smoke`)

| File                       | Test                                                                  |
|----------------------------|-----------------------------------------------------------------------|
| `smoke/login.spec.ts`      | user can log in                                                       |
| `smoke/login.spec.ts`      | invalid login shows error                                             |
| `smoke/products.spec.ts`   | product list loads                                                    |
| `smoke/products.spec.ts`   | user can open product detail page                                     |
| `smoke/cart.spec.ts`       | user can add product to cart                                          |
| `smoke/cart.spec.ts`       | user can remove product from cart                                     |
| `smoke/checkout.spec.ts`   | user can checkout successfully                                        |
| `smoke/checkout.spec.ts`   | user can see order confirmation and find the order in history        |

### 7.2 Regression — 36 tests (`@regression`)

**`auth.spec.ts` (4)**
- successful login lands on /products and shows the user in the navbar
- logout clears the session and returns to /login
- session persists across a full page reload
- brand link in the navbar returns to /products from anywhere

**`catalog.spec.ts` (4)**
- out-of-stock product disables Add to cart and labels itself
- requesting a non-existent product id surfaces an error
- unknown routes render the 404 page
- out-of-stock product is disabled and labelled in the /products grid

**`cart.spec.ts` (8)**
- adding the same product twice increments the quantity instead of creating a new line
- the cart total equals the sum of all line totals across distinct products
- removing one item leaves the other rows untouched
- an empty cart offers a Continue shopping link back to /products
- removing the last item flips the cart from filled to the empty state
- cart contents survive navigating away and back
- cart contents survive a full page reload
- cart contents survive logout and a fresh UI login as the same user

**`checkout.spec.ts` (4)**
- checkout page with an empty cart shows the empty state and hides the submit button
- placing an order clears the cart on the backend
- checkout decrements product stock by the purchased quantity
- checkout fails with an error when cart quantity exceeds product stock

**`orders.spec.ts` (2)**
- a user with no orders sees the empty-orders state
- multiple checkouts show up as separate order cards in history

**`protected-routes.spec.ts` (2)** — one parameterized test fires 4 cases (`/cart`, `/checkout`, `/orders`, `/admin/products`) + 1 click-redirect test
- anonymous visit to {/cart,/checkout,/orders,/admin/products} redirects to /login
- anonymous clicking Add to cart from /products is redirected to /login

**`admin-authorization.spec.ts` (4)**
- regular user is redirected away from /admin/products
- navbar hides the Admin link for regular users
- admin sees the Admin link and can open the admin products page
- admin API rejects requests from a regular user with 403

**`admin-products.spec.ts` (7)**
- admin can create a product and it appears in the catalog
- admin can edit a product and the change is reflected in the catalog
- admin can delete a product and it disappears from the catalog
- clicking Edit pre-populates the form with the product's current values
- Cancel during an edit clears the form and exits edit mode
- updating a product with a negative price is rejected by the server
- creating a product with a blank name is rejected client-side

**`totals.spec.ts` (1)**
- cart total equals checkout total equals order-history total for the same order

### 7.3 API — 35 tests (`@api`)

**`auth.api.spec.ts` (5)**
- POST /api/auth/login returns 200 and a bearer token for valid credentials
- POST /api/auth/login returns 401 for a wrong password
- POST /api/auth/login returns 422 when the email field is missing
- GET /api/auth/me returns 401 without a token
- GET /api/auth/me returns the authenticated user's profile

**`products.api.spec.ts` (4)**
- GET /api/products returns the seeded catalog without requiring auth
- GET /api/products/{id} returns the matching product shape
- GET /api/products/{id} returns 404 for a missing product id
- GET /api/products/{id} with a non-numeric id returns 422

**`cart.api.spec.ts` (7)**
- GET /api/cart returns 401 without a token
- GET /api/cart returns an empty cart for a user with nothing in it
- POST /api/cart/items returns 401 without a token
- POST /api/cart/items adds the product and returns the updated cart with 201
- POST /api/cart/items returns 404 when the product does not exist
- POST /api/cart/items returns 422 when quantity is zero
- DELETE /api/cart/items/{id} returns 404 for an item that does not exist

**`checkout.api.spec.ts` (4)**
- POST /api/checkout returns 401 without a token
- POST /api/checkout returns 400 with 'cart is empty' for an empty cart
- POST /api/checkout returns 201 with an order matching the cart contents
- POST /api/checkout decrements stock by the purchased quantity

**`orders.api.spec.ts` (5)**
- GET /api/orders returns 401 without a token
- GET /api/orders returns an empty list for a user with no order history
- GET /api/orders returns each placed order with full line-item shape
- GET /api/orders/{id} returns the user's own order
- GET /api/orders/{id} returns 404 when the order belongs to another user

**`admin.api.spec.ts` (10)**
- POST /api/admin/products returns 401 without a token
- POST /api/admin/products returns 403 for a regular user
- POST /api/admin/products returns 201 and the created product for an admin
- POST /api/admin/products returns 422 when name is missing
- POST /api/admin/products returns 422 when price is negative
- POST /api/admin/products returns 422 when stock is negative
- PUT /api/admin/products/{id} partially updates the product and returns 200
- PUT /api/admin/products/{id} returns 404 for a missing product id
- DELETE /api/admin/products/{id} returns 204 and removes the product
- DELETE /api/admin/products/{id} returns 404 for a missing product id

### 7.4 DB validation — 12 tests (`@db`)

**`seed.db.spec.ts` (2)**
- seeded users exist in the users table with the correct roles
- seeded products table contains every catalog item the factory tracks

**`cart.db.spec.ts` (2)**
- POST /api/cart/items inserts a cart_items row for the user
- DELETE /api/cart/items/{id} removes the cart_items row from the table

**`admin-products.db.spec.ts` (4)**
- POST /api/admin/products inserts a products row with the submitted values
- PUT /api/admin/products/{id} updates the products row, not just the API response
- DELETE /api/admin/products/{id} soft-deletes the row (`is_active=false`, `deleted_at` set)
- after a product is soft-deleted, GET /api/products no longer returns it but the row survives

**`checkout.db.spec.ts` (4)**
- checkout inserts a row in orders for the buying user
- checkout inserts one order_items row per cart line with correct fields
- checkout deletes the user's cart_items rows after creating the order
- checkout decrements products.stock by the purchased quantity

### 7.5 Accessibility — 7 tests (`@a11y`)

All in `a11y/pages.a11y.spec.ts`. Each scans the page with `@axe-core/playwright` (tags `wcag2a / wcag2aa / wcag21a / wcag21aa`) and asserts zero `critical`+`serious` violations.

- `/login` has no critical or serious WCAG 2.1 AA violations
- `/products` has no critical or serious WCAG 2.1 AA violations
- `/products/{id}` has no critical or serious WCAG 2.1 AA violations
- `/cart` has no critical or serious WCAG 2.1 AA violations
- `/checkout` has no critical or serious WCAG 2.1 AA violations
- `/orders` has no critical or serious WCAG 2.1 AA violations
- `/admin/products` has no critical or serious WCAG 2.1 AA violations

### 7.6 Visual — 6 tests (`@visual`, chromium-only)

All in `visual/pages.visual.spec.ts`. Tests are skipped on firefox/webkit at the project level (`testIgnore: ["**/visual/**"]`).

- login page (full page)
- products list (full page, 20 cards asserted)
- cart with two items (full page, API-seeded)
- checkout with two items (full page, API-seeded)
- order confirmation panel (element-scoped, dynamic id masked)
- admin products page (form-scoped, table excluded to avoid stock drift)

Baselines committed at `qa/e2e/tests/visual/pages.visual.spec.ts-snapshots/`:
- `login-chromium-win32.png`
- `products-chromium-win32.png`
- `cart-chromium-win32.png`
- `checkout-chromium-win32.png`
- `order-confirmation-chromium-win32.png`
- `admin-products-form-chromium-win32.png`

Diff tolerance: `maxDiffPixelRatio: 0.01` (project-wide).

### 7.7 k6 — 4 scripts

| Script         | Endpoint                  | Profile                | Thresholds (tag-scoped)                              |
|----------------|---------------------------|------------------------|------------------------------------------------------|
| `products.js`  | GET /api/products         | ramp to 10 VUs, ~35s   | `p(95) < 500ms`, error rate `< 1%`                   |
| `login.js`     | POST /api/auth/login      | ramp to 5 VUs, ~35s    | `p(95) < 500ms`, error rate `< 1%`                   |
| `cart.js`      | POST /api/cart/items      | ramp to 5 VUs, ~30s    | `p(95) < 500ms`, error rate `< 1%`                   |
| `checkout.js`  | POST /api/checkout        | ramp to 2 VUs, ~35s    | `p(95) < 800ms` on the checkout call, error rate `< 1%` |

### 7.8 Backend pytest — 16 tests (10 fast + 6 Postgres)

**Fast layer** (`apps/backend/tests/`) — SQLite via `TestClient`, 10 tests, default `pytest` runs these:

| Test                                                                 | File                |
|----------------------------------------------------------------------|---------------------|
| `test_health_returns_ok`                                             | `test_health.py`    |
| `test_login_success`                                                 | `test_auth.py`      |
| `test_login_failure_wrong_password`                                  | `test_auth.py`      |
| `test_login_failure_unknown_email`                                   | `test_auth.py`      |
| `test_list_products_returns_seeded`                                  | `test_products.py`  |
| `test_product_detail_returns_one`                                    | `test_products.py`  |
| `test_product_detail_404`                                            | `test_products.py`  |
| `test_checkout_success`                                              | `test_checkout.py`  |
| `test_checkout_failure_empty_cart`                                   | `test_checkout.py`  |
| `test_checkout_rejects_quantity_above_stock_without_partial_writes`  | `test_checkout.py`  |

**Postgres integration layer** (`apps/backend/tests/integration/`) — real Postgres, schema-isolated, 6 tests, opt-in via `pytest -m postgres`:

| Test                                                | What it proves                                                            |
|-----------------------------------------------------|---------------------------------------------------------------------------|
| `test_checkout_creates_order_in_postgres`           | Persisted `orders` row owned by the user                                  |
| `test_checkout_creates_order_items_per_cart_line`   | One `order_items` row per line with snapshotted `product_name`/`unit_price` |
| `test_cart_unique_constraint_merges_same_product`   | `uq_cart_user_product` enforces single row + service quantity merge       |
| `test_checkout_persists_stock_decrement`            | `products.stock` reflects purchase after commit                           |
| `test_checkout_rolls_back_on_insufficient_stock`    | Failure leaves zero orders, zero order_items, stock unchanged             |
| `test_concurrent_checkout_cannot_oversell`          | Two threads racing for the last unit: exactly one wins, stock ends at 0   |

---

## 8. CI / CD

### 8.1 Workflows

| Workflow                | File                              | Trigger                                                  |
|-------------------------|-----------------------------------|----------------------------------------------------------|
| Main CI                 | `.github/workflows/ci.yml`        | `push: [main]`, `pull_request`, `workflow_dispatch`      |
| Performance (k6)        | `.github/workflows/perf.yml`      | `workflow_dispatch` only (with `script` choice input)    |

`ci.yml` has a `workflow_dispatch` input `run_visual: bool` (default false). Concurrency is cancel-in-progress per ref.

### 8.2 Main CI jobs

| Job (display name)        | Strategy        | Runs on                  | Key steps                                                                 |
|---------------------------|-----------------|--------------------------|---------------------------------------------------------------------------|
| `quality-gates`           | single          | `ubuntu-latest`          | Frontend `npm run typecheck` + `npm run build`, Playwright framework `npm run typecheck`, backend `ruff check .` |
| `backend-tests`           | needs gates     | `ubuntu-latest`          | setup-python 3.12 → pip install → `pytest -v` (fast SQLite layer; excludes `@postgres` marker) |
| `playwright-smoke`        | matrix (suite=smoke), needs gates | `ubuntu-latest` | compose up → wait `/health` + `:5173` → setup-node 22 → `npm ci` → install chromium → DB reset → `playwright test --grep @smoke --workers=1 --project=chromium` |
| `playwright-api`          | matrix (suite=api), needs gates | same       | same minus DB reset                                                       |
| `playwright-regression`   | matrix (suite=regression), needs gates | same | same minus DB reset                                                       |
| `accessibility`           | matrix (suite=a11y), needs gates | same      | same minus DB reset                                                       |
| `allure-report`           | needs: playwright | `ubuntu-latest`       | setup-java 17 → download all `allure-results-*` → merge → `npx allure generate` → upload `allure-report` |
| `playwright-visual`       | conditional manual | `ubuntu-latest`          | only on `workflow_dispatch` with `run_visual: true`                       |

### 8.3 Artifacts uploaded (always, including on failure)

| Artifact name                       | Job(s)                                 | Path                          |
|-------------------------------------|----------------------------------------|-------------------------------|
| `playwright-report-<suite>`         | each Playwright job                    | `qa/e2e/playwright-report/`   |
| `allure-results-<suite>`            | each Playwright job                    | `qa/e2e/allure-results/`      |
| `test-artifacts-<suite>`            | each Playwright job                    | `qa/e2e/test-results/`        |
| `allure-report`                     | `allure-report` merge job              | `qa/e2e/allure-report/`       |
| `docker-logs-<suite>`               | on failure only                        | `docker-logs.txt`             |
| `k6-summaries`                      | `perf.yml`                             | `summary-*.json`              |
| `visual-diffs` / `playwright-report-visual` | `playwright-visual`              | `qa/e2e/test-results/` + report |

### 8.4 CI-only config

| Setting                  | Local | CI         |
|--------------------------|-------|------------|
| Playwright retries       | 0     | 2          |
| Playwright workers       | undef | 2          |
| `forbidOnly`             | false | true       |
| Browsers installed       | dev's choice | chromium only (with `--with-deps`) |

### 8.5 Performance workflow (`perf.yml`)

- `workflow_dispatch` only
- Inputs: `script` = `all | products | login | cart | checkout` (default `all`)
- Brings up stack, installs k6 via apt (signed key from k6.io), resets DB, runs selected script(s) with `--summary-export=summary-*.json`, uploads JSONs as `k6-summaries`

---

## 9. Reporting & artifacts

### 9.1 Reporters configured

`playwright.config.ts` reporter array:

```ts
reporter: [
  ["list"],                                              // console
  ["html", { open: "never", outputFolder: "playwright-report" }],
  ["allure-playwright", { detail: true, outputFolder: "allure-results", suiteTitle: false }],
]
```

### 9.2 Trace / screenshot / video policy

| Artifact   | Mode               | When captured                       |
|------------|--------------------|-------------------------------------|
| Screenshot | `only-on-failure`  | Single PNG of the page at failure   |
| Video      | `retain-on-failure`| Full test recording, kept on failure|
| Trace      | `retain-on-failure`| Full DOM + network + console timeline, viewable with `npx playwright show-trace` |

### 9.3 Allure polish

| Item                                       | Where                                       |
|--------------------------------------------|---------------------------------------------|
| Failure categories (Product / Test / Flaky / a11y / Visual) | `qa/e2e/allure/categories.json` (copied into `allure-results/` by global-setup) |
| Run environment (BASE_URL, OS, Node, CI, run timestamp) | `allure-results/environment.properties` (written by global-setup) |

### 9.4 npm report scripts

| Script                       | Effect                                                |
|------------------------------|-------------------------------------------------------|
| `npm run report`             | `playwright show-report` (opens Playwright HTML)      |
| `npm run report:allure`      | `allure generate --clean` + `allure open` static HTML |
| `npm run report:allure:generate` | static `allure-report/` only                      |
| `npm run report:allure:open` | open existing static                                  |
| `npm run report:allure:serve`| interactive watch mode (auto-rebuild)                 |

---

## 10. Performance testing (k6)

### 10.1 Scripts and thresholds

| Script         | Endpoint                | Ramp profile                | Threshold                                        |
|----------------|-------------------------|------------------------------|--------------------------------------------------|
| `products.js`  | GET /api/products       | 0 → 10 VUs → 0 over 35s     | `p(95)<500ms`, `rate<0.01` (tag `endpoint:products_list`) |
| `login.js`     | POST /api/auth/login    | 0 → 5 VUs → 0 over 35s      | `p(95)<500ms`, `rate<0.01` (tag `endpoint:auth_login`) |
| `cart.js`      | POST /api/cart/items    | 0 → 5 VUs → 0 over 30s      | `p(95)<500ms`, `rate<0.01` (tag `endpoint:cart_add`) |
| `checkout.js`  | POST /api/checkout      | 0 → 2 VUs → 0 over 35s      | `p(95)<800ms`, `rate<0.01` (tag `endpoint:checkout`) |

### 10.2 Last verified results (local Docker stack on Windows)

| Script   | p95 measured | Threshold | Errors | Iterations |
|----------|-------------:|----------:|-------:|-----------:|
| products | **10ms**     | < 500ms ✓ | 0%     | 275        |
| login    | **237ms**    | < 500ms ✓ | 0%     | 112        |
| cart     | **24ms**     | < 500ms ✓ | 0%     | 125        |
| checkout | **14ms**     | < 800ms ✓ | 0%     | 59         |

Login p95 is the highest — that's bcrypt doing its job; not a regression.

### 10.3 Shared config

`qa/perf/lib/config.js` — exports `BASE_URL`, `USER`, `JSON_HEADERS`, `authHeaders(token)`. All overridable via `-e ENV=value` k6 flags.

---

## 11. Accessibility findings

All scans use `@axe-core/playwright` with WCAG tags `wcag2a / wcag2aa / wcag21a / wcag21aa`, filtered to `critical` + `serious` impact.

**Initial audit (Phase 9) flushed 4 color-contrast violations:**

| Page                | Element                                  | Foreground / Background | Old ratio | Fix                          | New ratio |
|---------------------|------------------------------------------|-------------------------|----------:|------------------------------|----------:|
| `/products`         | Product card image placeholder           | `text-slate-400` / `bg-slate-100` | 2.34:1 | → `text-slate-600`     | ~6.3:1    |
| `/products/{id}`    | Product detail image placeholder         | `text-slate-400` / `bg-slate-100` | 2.34:1 | → `text-slate-600`     | ~6.3:1    |
| `/orders`           | Order date small text                    | `text-slate-400` / white | 2.56:1   | → `text-slate-600`           | ~7.0:1    |
| `/admin/products`   | Admin table `<thead>`                    | `text-slate-500` / `bg-slate-100` | 4.34:1 | → `text-slate-700`     | ~9.5:1    |

All fixed in product code (not suppressed). Final suite: 7/7 a11y tests pass.

---

## 12. Visual regression

- **Toolchain:** Playwright's native `toHaveScreenshot()` (pixel diff).
- **Scope:** chromium-only. Enforced project-level via `testIgnore: ["**/visual/**"]` on the firefox + webkit projects.
- **Tolerance:** `maxDiffPixelRatio: 0.01` (project-wide).
- **Animations:** disabled by Playwright's `toHaveScreenshot` default.
- **Dynamic content:** `order-confirmation-id` is masked via Playwright's pink overlay; admin table excluded from the snapshot to avoid stock-drift coupling.
- **Determinism:** `npm run test:visual` precedes the suite with `node ./scripts/reset-db.mjs`, and tests run with `--workers=1` in serial mode.

Baselines pinned to Windows (`-chromium-win32.png`). The CI workflow has a manual `workflow_dispatch` path for regenerating Linux baselines.

---

## 13. Configuration files

| File                                | Purpose                                                          |
|-------------------------------------|------------------------------------------------------------------|
| `docker-compose.yml`                | db + backend + frontend services + named volume `db_data`        |
| `.env.example` (root)               | Compose-level vars                                               |
| `apps/backend/.env.example`         | `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRE_MINUTES`, etc.         |
| `apps/backend/alembic.ini`          | Alembic config                                                   |
| `apps/backend/pytest.ini`           | testpaths, strict markers, `@postgres` marker registered, default `-m "not postgres"` so fast layer runs by default |
| `apps/backend/ruff.toml`            | Lint config — `E/F/I/B` rules, `target-version=py312`, per-file ignores for tests + alembic |
| `apps/backend/requirements.txt`     | Python deps (FastAPI, SQLAlchemy 2, Pydantic v2, alembic, **ruff**, etc.) |
| `apps/backend/requirements-postgres.txt` | Postgres driver (psycopg)                                   |
| `apps/backend/Dockerfile`           | `python:3.12-slim` + entrypoint                                  |
| `apps/backend/docker-entrypoint.sh` | Runs migrations + seeds before uvicorn                           |
| `apps/frontend/.env.example`        | `VITE_API_URL`                                                   |
| `apps/frontend/vite.config.ts`      | Vite config (React plugin, port 5173)                            |
| `apps/frontend/tsconfig.json`       | TS strict mode, path aliases                                     |
| `apps/frontend/tailwind.config.js`  | Tailwind content paths, theme                                    |
| `apps/frontend/postcss.config.js`   | Tailwind + autoprefixer                                          |
| `apps/frontend/nginx.conf`          | Reverse-proxies `/api` and `/health` to backend                  |
| `apps/frontend/Dockerfile`          | Multi-stage: node build → nginx                                  |
| `apps/frontend/package.json`        | Frontend deps + scripts                                          |
| `qa/e2e/.env.example`               | `PLAYWRIGHT_BASE_URL`, optional credential overrides             |
| `qa/e2e/playwright.config.ts`       | testDir, reporters, projects, trace/video/screenshot, timeouts   |
| `qa/e2e/global-setup.ts`            | `/health` precheck + writes Allure env + categories              |
| `qa/e2e/tsconfig.json`              | TS strict, noUnusedLocals, noUnusedParameters                    |
| `qa/e2e/package.json`               | All npm scripts (test:smoke, test:visual, report:allure, etc.)   |
| `qa/e2e/scripts/reset-db.mjs`       | `docker compose exec backend python -m app.seeds.seed --reset`   |
| `qa/e2e/allure/categories.json`     | Allure failure-bucket regexes (5 categories)                     |
| `qa/perf/lib/config.js`             | k6 base URL + credentials                                        |
| `.github/workflows/ci.yml`          | Main CI                                                          |
| `.github/workflows/perf.yml`        | Manual k6 workflow                                               |
| `.gitignore`                        | node, py, playwright, allure, docker, env, IDE                   |
| `CLAUDE.md`                         | Coding rules (Backend / Frontend / Tests + workflow rules)       |

---

## 14. QA documentation set

| File                                | What it covers                                                       |
|-------------------------------------|----------------------------------------------------------------------|
| `qa/docs/test-plan.md`              | Scope, environments, entry/exit criteria                             |
| `qa/docs/coverage-matrix.md`        | Feature × test-type grid                                             |
| `qa/docs/qa-strategy.md`            | Test pyramid, principles, tagging convention, headline rules, **security notes** (demo-vs-production tradeoffs) |
| `qa/docs/flake-policy.md`           | The full flake-prevention discipline (8 sections + audit checklist)  |
| `qa/docs/release-checklist.md`      | Pre-release gate                                                     |
| `qa/docs/bug-report-template.md`    | Standard bug-report shape                                            |
| `qa/perf/README.md`                 | k6 install, run, thresholds, design notes, limitations               |
| `README.md`                         | Recruiter-facing overview                                            |
| `project.md`                        | This file (technical inventory)                                      |
| `CLAUDE.md`                         | Coding rules for contributors                                        |

### `flake-policy.md` table of contents (the substantive doc)

1. No hard waits
2. Retry only in CI
3. Seeded test data
4. API setup hooks
5. Test isolation
6. Network mocking where useful
7. Quarantine policy
8. Good vs bad selectors
9. How we audit for flake (grep checklist)
10. What to do when a test fails

---

## 15. Build phases timeline

| Phase | Goal                                              | Status   |
|-------|---------------------------------------------------|----------|
| 0     | Repo scaffolding & project plan                   | ✅ done  |
| 1     | Backend: ShopLite API (FastAPI + Postgres)        | ✅ done  |
| 2     | Frontend: ShopLite UI (React + TS + Vite)         | ✅ done  |
| 3     | Dockerized full stack                             | ✅ done  |
| 4     | Playwright framework foundation                   | ✅ done  |
| 5     | UI smoke + regression suites                      | ✅ done  |
| 6     | API contract-style tests                          | ✅ done  |
| 6.5   | Database validation tests (Postgres-backed)       | ✅ done  |
| 7     | Accessibility tests (axe-core)                    | ✅ done  |
| 8     | Visual regression                                 | ✅ done  |
| 9     | Reports (Playwright HTML + Allure) + cross-browser| ✅ done  |
| 10    | GitHub Actions CI                                 | ✅ done  |
| 11    | Flake-prevention doctrine                         | ✅ done  |
| 12    | k6 performance tests                              | ✅ done  |
| 13    | Final docs + resume polish                        | ✅ done  |
| 14    | Project inventory (this file)                     | ✅ done  |
| 15    | Reviewer-fix sweep — soft delete, atomic checkout, Postgres integration tests, CI quality gates, k6 isolation, honest doc positioning | ✅ done  |


---

## 16. Coding rules (CLAUDE.md, summarized)

**General**

1. Plain, readable code over clever code.
2. No premature abstraction.
3. No comments by default — only when the *why* is non-obvious.
4. No dead code, no commented-out code, no TODO graveyards.
5. No backwards-compatibility shims.
6. Validate at boundaries only.

**Backend (FastAPI / Python)**

7. Python 3.12+, type-hint everything that crosses a function boundary.
8. Pydantic v2 for request/response schemas. No raw dicts in routes.
9. SQLAlchemy 2.x modern declarative.
10. Alembic migration for every schema change.
11. One concern per router.
12. Uniform error envelope.
13. Seeds are the single source of truth for test data.

**Frontend (React / TS)**

14. TypeScript strict mode.
15. React Query owns server state, Zustand owns local client state.
16. `data-testid` on every interactive element, baked in at build time.
17. Tailwind utility classes; component extractions only when reused 3+ times.
18. No business logic in components.
19. Error states first-class (loading / empty / error variants on every async surface).

**Tests (Playwright / TS)**

20. Page Object Model strictly: tests describe intent, page objects describe interaction, locators live in page objects only.
21. Fixtures over `beforeEach` for anything that crosses tests.
22. Tests own their data; factories on top of deterministic seeds.
23. Mint auth via API in fixtures, never via UI login.
24. DB reset per spec file by default.
25. Tags: `@smoke`, `@regression`, `@a11y`, `@visual`, `@api`, `@db`, `@quarantine`.
26. Retries 2 in CI, 0 locally.
27. Every failure ships triage evidence (screenshot + video + trace).

**Workflow**

- Phase-by-phase delivery with end-of-phase reports and explicit approval before the next starts.
- Stay strictly within phase scope — no bonus features.
