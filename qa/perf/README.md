# Performance scenarios (k6)

> **Smoke-load benchmark, not production capacity testing.** These run locally or in a manual CI workflow against a single-host Docker stack; the numbers prove latency under light controlled load and catch regressions, not real production throughput. Headline phrasing in resume/docs: **k6 performance scenarios**, not "k6 tests" — they're separate from the functional test count.


Load tests for ShopLite's hot-path API endpoints. Deliberately separate from the e2e suite:

- **Functional tests** answer *did the endpoint do the right thing?*
- **Performance tests** answer *and did it do it fast enough, under load, without errors?*

These run **manually** — never on a PR. They reset the database, mutate shared state, and need a stable target to produce meaningful numbers.

## What's tested

| Script           | Endpoint                  | Concurrency  | Duration | Thresholds                                                  |
|------------------|---------------------------|--------------|----------|-------------------------------------------------------------|
| `products.js`    | `GET /api/products`       | ramp to 10 VUs | ~35s    | `p(95) < 500ms`, error rate `< 1%`                          |
| `login.js`       | `POST /api/auth/login`    | ramp to 5 VUs  | ~35s    | `p(95) < 500ms`, error rate `< 1%`                          |
| `cart.js`        | `POST /api/cart/items`    | ramp to 5 VUs  | ~30s    | `p(95) < 500ms`, error rate `< 1%`                          |
| `checkout.js`    | `POST /api/checkout`      | **1 VU** (constant) | ~30s | `p(95) < 800ms` on checkout call, error rate `< 1%`         |

**Data isolation for checkout.** All k6 scripts authenticate as the single seeded user (no public registration endpoint). For products/login/cart that's fine — those endpoints don't have a shared mutable state per-VU. For checkout it would: VU A's checkout would drain items VU B added between A's add and A's checkout, producing spurious empty-cart 400s that aren't a real latency signal. So `checkout.js` runs **1 VU** and **clears the cart at the start of every iteration**. Each iteration is self-contained: clear → add → checkout. Throughput is bounded by that profile by design.

Thresholds are tagged (`endpoint:products_list`, `endpoint:auth_login`, etc.) so the gate evaluates the endpoint itself — not the setup calls (login/list/add) that the journey script makes before measuring `/api/checkout`.

## Install k6

| Platform | Install                                         |
|----------|-------------------------------------------------|
| Windows  | `winget install k6` *or* `choco install k6`     |
| macOS    | `brew install k6`                               |
| Linux    | See [k6.io/docs/get-started/installation](https://k6.io/docs/get-started/installation) |
| Any OS w/ Docker | `docker run --rm -v "$PWD/qa/perf:/perf" grafana/k6 run /perf/<script>.js` |

## Run

The ShopLite stack must be up first:

```powershell
docker compose up -d --build
```

Then from the repo root:

```powershell
# Each script in turn
k6 run qa/perf/products.js
k6 run qa/perf/login.js
k6 run qa/perf/cart.js
k6 run qa/perf/checkout.js

# Override the base URL or credentials
k6 run -e BASE_URL=http://localhost:8000 qa/perf/products.js
k6 run -e SHOPLITE_USER_EMAIL=user@shoplite.io -e SHOPLITE_USER_PASSWORD=user1234 qa/perf/login.js

# Save the structured result for trend tracking / CI
k6 run --summary-export=summary-products.json qa/perf/products.js
```

### Run via Docker (no local k6)

The CI workflow uses this exact path. `host.docker.internal` is the host machine from inside the container on macOS / Windows Docker Desktop; on Linux use `--network=host` with `BASE_URL=http://localhost:8000` instead.

```powershell
docker run --rm `
  -v "${PWD}/qa/perf:/perf" `
  -e BASE_URL=http://host.docker.internal:8000 `
  grafana/k6 run /perf/products.js
```

## Interpreting the output

A k6 run ends with one of two outcomes:

- **Thresholds passed:** every assertion under `█ THRESHOLDS` shows a green ✓ and the process exits 0. Safe to merge / ship.
- **Thresholds failed:** any ✗ under `█ THRESHOLDS` and the process exits non-zero (CI fails the job). The threshold *only* gates on the configured metrics — individual `check()` failures are visible in the summary but don't fail the run on their own. That's intentional: we treat a slow p95 as a release blocker, not "this one request returned the wrong shape mid-load".

Key metrics to read:

| Metric                        | What it tells you                                                |
|-------------------------------|------------------------------------------------------------------|
| `http_req_duration p(95)`     | The latency 19/20 requests beat. The thresholded metric.         |
| `http_req_failed rate`        | Share of HTTP responses that weren't 2xx/3xx. The thresholded metric. |
| `checks_succeeded`            | Share of `check()` assertions that passed. Diagnostic, not gating. |
| `iterations` / `http_reqs`    | Throughput sanity — did we actually generate the load we asked for? |
| `vus_max`                     | Confirms the VU plateau was reached.                              |

## Design notes

- **Why ramp instead of constant VUs?** A 5s ramp-in lets warmups (DB connection pool, JIT) settle before the threshold window. Without it, the first second's worth of slow requests skews the p95.
- **Why `sleep(1)` per iteration?** Realistic pacing. A real user doesn't hammer the catalog as fast as the network round-trips will let them; one request per VU-second is a sane default for a smoke-load test. Drop it (or shorten it) to escalate to stress tests.
- **Why tags on requests?** So the threshold gates only the endpoint of interest — `checkout.js` includes a login + add-to-cart setup, but only the checkout call is judged against the 800ms gate.
- **Why such modest VU counts?** This is a **smoke-load** profile: enough load to surface obvious regressions, light enough to run on a developer laptop and a free GitHub runner. Escalating to **stress** (find the breaking point) or **soak** (find leaks) means bumping VUs into the hundreds and running for hours — a separate workflow, not this one.
- **Why is `checkout.js` a journey, not a pure endpoint test?** `POST /api/checkout` requires a non-empty cart. Pre-seeding 10000 cart items in setup would distort the latency picture (one giant cart vs realistic small carts). Adding one item per iteration is the cleanest way to keep the measured call honest.

## Limitations to know about

- **Single shared user.** All VUs authenticate as `user@shoplite.io`. Real concurrent users would have independent carts; here, VUs race on the same cart row. Cart and checkout numbers are valid latency signals, but throughput is bounded by single-user write contention — not a representative throughput ceiling for the system as a whole. Fixing this needs a user-registration endpoint, which the seed doesn't currently expose.
- **Stack on the same host.** When the stack runs on the same machine as k6, CPU contention skews both. For real performance numbers, target a stack running on a separate host with known resources.
- **No DB reset between scripts.** Stock decrements from `checkout.js` persist. Re-seed before a fresh baseline: `docker compose exec backend python -m app.seeds.seed --reset`.

## Files

```
qa/perf/
├── README.md         this file
├── lib/
│   └── config.js     baseURL + credentials, env-overridable
├── products.js       GET /api/products
├── login.js          POST /api/auth/login
├── cart.js           POST /api/cart/items (auth via setup())
└── checkout.js       full journey, threshold on the checkout call only
```
