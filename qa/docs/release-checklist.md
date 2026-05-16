# Release Checklist

> Run through this before tagging a TestForge release or promoting a ShopLite build. Stub created in Phase 0; finalized in Phase 10.

## Pre-flight

- [ ] All CI jobs green on `main`
- [ ] No `@skip` / `@fixme` annotations in the suites being released
- [ ] Coverage matrix has no new gaps vs the previous release
- [ ] DB migrations apply cleanly forward **and** rollback cleanly
- [ ] Seed data still loads without errors

## Smoke

- [ ] `@smoke` suite passes against the release build in all three browsers
- [ ] Manual smoke: login → browse → add to cart → checkout → see order in history
- [ ] Admin: create / edit / delete a product

## Regression

- [ ] Full regression suite passes in CI
- [ ] Accessibility scans show no new violations on primary pages
- [ ] Visual regression has no unexpected diffs (or diffs are reviewed and baselines updated intentionally)

## Cross-cutting

- [ ] Reports (HTML + Allure) archived as CI artifacts
- [ ] Traces / videos for any flaky retries reviewed
- [ ] README phase tracker updated
- [ ] CHANGELOG / release notes drafted

## Sign-off

- [ ] QA owner:
- [ ] Engineering owner:
- [ ] Date:
