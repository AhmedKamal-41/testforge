# Coverage Matrix

> Stub created in Phase 0. Rows added as features land in Phases 1–2; columns filled in as suites land in Phases 5–7.

Maps every ShopLite feature to the layers of tests that cover it. A row should never be empty — if a feature has no test in any column, that's a gap.

| Feature / area              | Backend unit | API contract | UI smoke | UI regression | A11y | Visual |
|-----------------------------|:------------:|:------------:|:--------:|:-------------:|:----:|:------:|
| Auth — login                |              |              |          |               |      |        |
| Auth — logout               |              |              |          |               |      |        |
| Products — list             |              |              |          |               |      |        |
| Products — detail           |              |              |          |               |      |        |
| Cart — add / remove         |              |              |          |               |      |        |
| Cart — quantity math        |              |              |          |               |      |        |
| Checkout — happy path       |              |              |          |               |      |        |
| Checkout — validation       |              |              |          |               |      |        |
| Order history               |              |              |          |               |      |        |
| Admin — product CRUD        |              |              |          |               |      |        |
| Error states (404, 500, …)  |              |              |          |               |      |        |

Legend: `✓` covered · `~` partial · blank = gap.
