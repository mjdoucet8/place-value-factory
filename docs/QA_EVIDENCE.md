# Local QA evidence

## 21 September 2026 — integrated local verification

- `npx tsc --noEmit`: passed.
- `npm test`: passed, 46 tests in four files.
- `npm run build`: passed for the Vite web application.
- `npm audit --omit=dev --audit-level=high`: passed with no production vulnerabilities after updating Vite to 7.3.6.
- `tests/unit/math.test.ts`: 38 deterministic validator, generator, mastery, stage-gate and independent dynamic-programming-oracle tests.
- `tests/integration/idempotency.test.ts`: 6 fictional API tests covering exact receipt replay, altered duplicate rejection, stale revision, takeover/old epoch rejection, skip replacement, ordered H1-H3 evidence, and the optional transfer star.
- `tests/integration/journey.test.ts`: fresh student authentication; wrong saved response; server restart and snapshot recovery; five saved shipments; profile/settings persistence; teacher report reconciliation; and student denial of the teacher report route.
- `tests/integration/postgres-repository.test.ts`: pg-mem forward-migration/repository transaction and receipt/evidence replay path.
- `npm run test:e2e`: passed with Playwright Chromium. It uses the live Vite/API process to exercise student login, draft restoration after refresh, explicit lease takeover, five committed shipments, optional transfer star, settings persistence, and teacher evidence view. A generated gameplay screenshot was visually inspected against the reference hierarchy: one CURRENT ORDER panel, live machine controls, clear denomination labels, factory guide, and responsive grid are present.

## Limits recorded honestly

The available computer-use runtime had no interactive browser surface (`iab` unavailable), but repeatable Playwright Chromium browser E2E is now installed and passing. It does not replace manual screen-reader or representative-device review. Narrow-device, actual simultaneous two-tab, private-mode/storage-quota and deliberate drop-reply browser checks remain required before classroom readiness.

No real PostgreSQL service, Docker runtime, school identity provider, hosting environment, retention decision, or classroom network/device was available. The PostgreSQL repository is exercised with pg-mem only; the JSON adapter is explicitly development-only.
