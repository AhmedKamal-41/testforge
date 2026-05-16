# ShopLite Test Plan

> Stub created in Phase 0. Filled out incrementally; finalised in Phase 10.

## 1. Scope

What's in scope and out of scope for testing TestForge / ShopLite.

- **In scope:** authentication, product catalog, cart, checkout, order history, admin CRUD, error states, REST API contract, key UI flows across Chromium / Firefox / WebKit, accessibility on primary pages, visual regression on primary pages.
- **Out of scope:** payment gateways (mocked), email delivery, real shipping integrations, load/perf testing.

## 2. Test types & where they live

| Type                  | Layer         | Tooling                       | Location                          |
|-----------------------|---------------|-------------------------------|-----------------------------------|
| Unit (backend)        | Backend       | pytest                        | `apps/backend/tests/`             |
| API contract          | API           | Playwright request fixtures   | `qa/e2e/tests/api/`               |
| UI smoke              | UI            | Playwright                    | `qa/e2e/tests/smoke/`             |
| UI regression         | UI            | Playwright                    | `qa/e2e/tests/regression/`        |
| Accessibility         | UI            | `@axe-core/playwright`        | `qa/e2e/tests/a11y/`              |
| Visual regression     | UI            | Playwright snapshots          | `qa/e2e/tests/visual/`            |

## 3. Environments

| Env       | URL                       | Data state                |
|-----------|---------------------------|---------------------------|
| local     | localhost via compose     | seeded + reset per run    |
| ci        | compose inside GH Actions | seeded + reset per run    |

## 4. Entry & exit criteria

_TBD in Phase 10._

## 5. Risk register

_TBD in Phase 10._
