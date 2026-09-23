# Local QA evidence

## 23 September 2026 — current release-candidate evidence

- RC-06: browser tests verified IndexedDB pending answer after disconnect before commit, duplicate receipt replay after commit, help-event restoration, online retry, cross-tab non-merge/review, and an explicit warning when IndexedDB is unavailable. The secure PostgreSQL pilot journey fault-injected first, intermediate, and final shipments and still reconciled five submitted orders in the teacher report. One isolated API test verified expired foreign writers are denied and same-tab resume increments the epoch. Final full-suite counts are recorded in the RC-06 task log after sequential execution.
- `npm test`: 49 passed, 5 dedicated real-PostgreSQL cases skipped outside their isolated harness; `npx tsc --noEmit` and `npm run build` passed.
- `npm run test:postgres`: 5 actual PostgreSQL cases passed, then 2 post-restart cases passed. The harness creates a new user-owned private local cluster without touching an existing database.
- `npm run test:e2e`: 13 isolated Chromium journeys passed, including correction, refresh, optional transfer, competing tabs, IndexedDB before/after-commit recovery, automatic reconnect, queued help, unavailable storage, all documented gallery states and art loading.
- `npx playwright test -c playwright.pilot.config.ts` with the private fictional pilot credentials: 4 passed. The integrated journey covered teacher class and roster creation, student five-order completion, refreshed results, teacher count reconciliation and revoked login; the visual tests checked every fixture at 1366/390/320 CSS pixels plus four layout captures and all 30 map nodes.
- Manually inspected the refreshed map, gameplay and results baselines plus landscape/portrait/narrow captures. Found and corrected the 1024-pixel two-row machine layout and inaccurate star copy before acceptance. Browser images and controls remained decoded and operable.
- Not yet run: native 200% browser zoom, manual screen reader, physical touch device, school network, non-Chromium engine and bounded classroom load. Owner aesthetic approval is pending. Further math, outbox, report and operations acceptance remains incomplete.

## 21 September 2026 — integrated local verification

- `npx tsc --noEmit`: passed.
- `npm test`: passed, 46 tests in four files.
- `npm run build`: passed for the Vite web application.
- `npm audit --omit=dev --audit-level=high`: passed with no production vulnerabilities after updating Vite to 7.3.6.
- `tests/unit/math.test.ts`: 38 deterministic validator, generator, mastery, stage-gate and independent dynamic-programming-oracle tests.
- `tests/integration/idempotency.test.ts`: 6 fictional API tests covering exact receipt replay, altered duplicate rejection, stale revision, takeover/old epoch rejection, skip replacement, ordered H1-H3 evidence, and the optional transfer star.
- `tests/integration/journey.test.ts`: fresh student authentication; wrong saved response; server restart and snapshot recovery; five saved shipments; profile/settings persistence; teacher report reconciliation; and student denial of the teacher report route.
- The same journey test verifies a report's five submitted-order denominator despite six response records, zero-valued counts for an empty date window, and 404 denial when a second fictional teacher requests another class's report or exact order evidence.
- `tests/integration/postgres-repository.test.ts`: pg-mem forward-migration/repository transaction and receipt/evidence replay path.
- `npm run test:e2e`: passed with 6 Playwright Chromium journeys. It uses a freshly cleared root-level fictional E2E data file, then exercises student login, level introduction, a wrong response with preserved quantities, draft restoration, five committed shipments, refreshable saved results, optional transfer, settings/progress and teacher evidence.
- The Playwright suite also overrides browser storage to throw a quota/private-mode error. The student sees the explicit non-recovery warning, can still fill a canonical representation, and receives the server's accepted-shipment acknowledgement.
- A separate two-tab Playwright journey opens the active attempt in the same browser context, takes over from the second tab, verifies the first tab receives the lease-loss save failure, then verifies the new writer can commit the next shipment.
- A dropped-reply journey commits a shipment while aborting the browser response, reloads, replays the original idempotency key and restores the one committed result without duplicating shipment progress.
- The deterministic development gallery is browser-checked for restricted, minimum, exact-types, two-representation and repack objectives; locked/resume/progress states; unavailable storage/takeover; and two-/three-star completion. See `docs/VISUAL_STATE_GALLERY.md`.

## Limits recorded honestly

Repeatable Playwright Chromium browser E2E is installed and passing. It does not replace manual screen-reader or representative-device review. Actual browser private-mode variants, narrow-device/zoom review and assistive-technology checks remain required before classroom readiness.

No real PostgreSQL service, Docker runtime, school identity provider, hosting environment, retention decision, or classroom network/device was available. The PostgreSQL repository is exercised with pg-mem only; the JSON adapter is explicitly development-only.
