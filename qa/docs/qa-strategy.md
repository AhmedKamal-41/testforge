# QA Strategy

> The opinionated overview. The full flake / determinism discipline lives in [`flake-policy.md`](./flake-policy.md).

## North star

> Catch regressions early, cheaply, and with high signal — and make every failure easy to triage.

## Test pyramid we're aiming for

```
                  /\
                 /  \         Visual + a11y      (few, targeted)
                /----\
               /      \       UI E2E             (smoke + regression)
              /--------\
             /          \     API contract       (broad)
            /------------\
           /              \   Backend unit       (broadest)
          /----------------\
```

## Principles

1. **Test at the lowest layer that can give a confident answer.** Don't drive the UI for something a request-context API test could prove.
2. **Deterministic by construction.** Seed + reset DB per run. Mint auth tokens via API in fixtures, not via UI login.
3. **Tests own their data.** Factories generate unique data per test; no cross-test ordering assumptions.
4. **Every failure ships triage evidence.** Screenshots, video, and trace on failure are non-negotiable.
5. **Smoke is sacred.** `@smoke` runs on every PR, finishes in under a few minutes, and must stay green.

## Where each concern lives

- **POM (Page Object Model)** → `qa/e2e/pages/`
- **Fixtures** (auth, API client, DB reset) → `qa/e2e/fixtures/`
- **Data factories** → `qa/e2e/factories/`
- **Test data / seeds** → `apps/backend/app/seeds/` (single source of truth)
- **Helpers / utils** → `qa/e2e/utils/`

## Tagging convention

- `@smoke` — must-pass critical path
- `@regression` — full suite
- `@a11y` — accessibility scans (`@axe-core/playwright`)
- `@visual` — screenshot diff (chromium-only by config)
- `@api` — request-context only, no UI
- `@db` — database validation tests
- `@quarantine` — temporarily excluded from gating, owner + ticket required ([see flake policy §7](./flake-policy.md#7-quarantine-policy))

## Flake policy

See the full policy in [`flake-policy.md`](./flake-policy.md). Headline rules:

- Retries: 2 in CI, 0 locally.
- No hard waits — web-first assertions or network-event waits only.
- Auth setup via API, never via UI login.
- Tests own their data; the seed is the single source of truth.
- A test that fails intermittently 3+ times is quarantined (`@quarantine`) and triaged within the next working day.

## Security notes (demo-vs-production)

This project's threat model is "small demo with an honest call-out", not "deploy to the public internet". The tradeoffs that future code would have to fix:

- **JWT storage.** Tokens are persisted in `localStorage` via Zustand's `persist` middleware so test fixtures can inject them directly with an init script. Any XSS on the site can read the token. **In production this would be HttpOnly, Secure, SameSite cookies** — the token leaves the JS heap entirely, and CSRF is countered with the SameSite=Lax/Strict attribute plus a CSRF token on state-changing requests.
- **Demo seed credentials are committed.** The 3 seeded users in `apps/backend/app/seeds/seed.py` are demo-only — not real secrets, not used to access anything outside this repo. Only `.env.example` files are tracked; `.env` is gitignored. Runtime secrets come from environment variables.
- **No rate limiting on `/api/auth/login`.** Brute-force vector against real accounts. Production: rate-limit per IP + per email; lock accounts after N failed attempts.
- **Permissive CORS.** Compose default allows `http://localhost:5173`. Production: explicit allowlist of real origins only.
- **Bcrypt cost factor default (12).** Fine for this profile; tunable based on login throughput and threat model in production.

These are listed in the README's *Security tradeoffs* section so reviewers see them without having to dig.
