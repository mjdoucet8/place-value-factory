# Local QA evidence

## 26 September 2026 — stricter fictional pilot-readiness audit

The prior local V1 candidate below is a historical checkpoint. The pilot-readiness pass adds a full 24-state/login/teacher visible-text contrast audit and selected review captures, a keyboard-only five-order journey, a five-order practice extension to the secure pilot, archive inventory/guarded expiry, and an independent deletion ledger replayed after restoring an older encrypted backup. Real PostgreSQL/restart, unit/type/build and browser checks remain separate commands. `docs/PILOT_VISUAL_REVIEW.md`, `docs/qa/RECOVERY_ACCESS_AUDIT_2026-09-26.md` and `docs/OPERATIONS.md` give reproducible scope and limits.

The sustained historical workload is an **unpassed local gate**. In the retained three-API-process run, 90 fictional learners with ten synthetic historical attempts each completed 29 timed rounds at 221 requests/s and zero errors. Profile/start/answer/retry p95 were 195/486/205/210 ms; full-year class report p95 was 1,042 ms against 500 ms. The 90-second test deliberately fails its report assertion, although final counts, cross-process duplicate receipts, class-local teacher totals and two-star rewards reconciled. Memory and database growth, all attempts and failed remedies are in `docs/qa/CLASSROOM_LOAD_2026-09-26.md`. The short fresh-data load below cannot close this gate. Native browser zoom, spoken assistive technology, representative devices and school network remain untested, and owner/school approvals remain outstanding.

## 26 September 2026 — V1 local release-candidate verification

All checks below used fictional data. `npx tsc --noEmit`, `npm run build`, and `npm test` passed (71 regular tests; 8 dedicated PostgreSQL/load cases intentionally skipped by that command). `npm run test:postgres` passed seven initial real-PostgreSQL cases and three post-restart cases (two restart-inapplicable cases skipped); operations exercised encrypted/wrong-key backup, distinct empty-database restore, restored HTTP report, archive, CLI preview/execute deletion and retention, backup-expiry markers and dependent-record isolation. `npm run test:e2e` passed 19 Chromium journeys, including keyboard shipment, login error association, 200% CSS zoom, contrast samples and queued recovery. `npx playwright test -c playwright.pilot.config.ts` passed four secure pilot journeys after archive/revocation and width changes. The final `npm run test:load` run after migration 010 passed a 90-student/30-concurrent private PostgreSQL workload with p95 start/answer/retry/report 343/450/405/67 ms, 87 req/s and zero errors. A separate local Chromium input-to-display check measured p95 5.1 ms across 30 quantity updates. `npm audit --omit=dev --audit-level=high` found zero production dependency vulnerabilities. See `docs/V1_CURRENT_ACCEPTANCE.md`, `docs/OPERATIONS.md`, and `docs/qa/` for exact scope and limits.

Classroom readiness remains unproven: owner visual approval, school identity/hosting/privacy/retention and backup policy, representative physical devices, assistive technology and school-network trials remain external gates. The local contrast/zoom checks and visual inspection do not prove WCAG conformance or Chromebook performance. Historical sections below retain their original evidence level.

## 26 September 2026 — RC-07 mathematics and progression checkpoint

The current committed RC-07 implementation was revalidated on 26 September 2026. These are local fictional-data checks and do not claim classroom readiness.

- `npm test`: 71 passed; 8 cases skipped outside the real-PostgreSQL harness (including the new load test, which runs in the PostgreSQL harness).
- `npx tsc --noEmit` and `npm run build`: passed with the scaffold runtime changes and current tests.
- `npm run test:postgres`: 7 initial PostgreSQL cases passed; after an actual `pg_ctl` restart, 3 cases passed and 2 restart-inapplicable cases were skipped. This includes the 30-level progression/practice/gate journey and the guarded operations test.
- `npm run test:e2e`: 13 Chromium journeys passed.
- `PVF_PILOT_CREDENTIALS=<private temporary pilot file> npx playwright test -c playwright.pilot.config.ts`: 4 secure fictional-pilot Chromium journeys passed, including teacher evidence, revocation, responsive fixtures and 30 map nodes. The temporary pilot was stopped afterward.
- `tests/unit/rc07-blueprints.test.ts`: 5 passed, including exact Stage 1–6 primary-skill attribution and Level 9 trailing/internal zero slots.
- `tests/unit/math.test.ts`: 47 passed, including independent DP minimum oracle and scaffold trigger/countdown/recovery.
- `tests/integration/idempotency.test.ts`: 12 passed, including malformed answer rejection and persisted cross-attempt scaffold issuance.
- `git diff --check`: final result recorded in the latest task log entry.

Scope evidence: `tests/unit/rc07-blueprints.test.ts` enumerates all 150 level/slot blueprints over bands and seeds and checks generated witnesses/fallback inventory; `tests/unit/math.test.ts` includes the independent minimum oracle. `tests/integration/rc07-progression-real.test.ts` verifies server-issued progression, practice, gates, restricted equivalence, advanced correction, certifications, reports, and persistence across a real PostgreSQL restart. `tests/unit/reporting.test.ts` covers report reconstruction and filters; integration and pilot browser tests cover authorized report/evidence views and reply loss. See the RC-07 handoff entries in `TASK_LOG.md` for exact evidence claims.

Not run for classroom readiness: physical-device/school-network testing, manual screen-reader and native zoom review, non-Chromium browser coverage, owner aesthetic approval, and measured 90-student/30-concurrent load. Those remain separate V1 release gates.

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
