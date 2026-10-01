# Project status

## Current: 30 September 2026 — Project changes pushed to GitHub

All 13 pending implementation/verification commits through `9a3ca1e` were pushed successfully to `main` at https://github.com/mjdoucet8/place-value-factory. This includes the approved map/gameplay art, question variety, logout and doucet login update. Final delivery records accompany this checkpoint; existing local play-session data and credentials remain local. No application behavior changed. Live deployment and validation details remain in the sections below.

## Current: 30 September 2026 — Class code changed to doucet, live

The existing shared fictional MVP class now uses `doucet`, and the live login form prefills the new code. Its class ID, all 18 students, credentials and saved progress are retained. Verified a fresh successful sign-in to the existing profile/map and checked the live form. Typecheck, the two existing login/credential tests and production build pass. Implementation `79da49a` is live as READY deployment `dpl_7Pno5YerdBp7c9HPY2bMgySgwzMp`; live bundle matches the tested build, health is OK, and bounded error scan is empty. Earlier sections below are historical.

## Current: 30 September 2026 — Settings replaced with logout, live

Removed the Settings screen and replaced its map button with Log out. Logout revokes the cookie session, clears private UI state, prevents signed-out Back navigation and preserves saved progress and drafts. Pending/error/retry behavior is covered. Typecheck/build pass; 100 regular tests, 34 browser checks and 4 real PostgreSQL secure-pilot journeys pass (9 dedicated-harness and 1 native-zoom skips documented). Only the map visual reference changed. See `docs/qa/LOGOUT_2026-09-30.md`. Published implementation `5b81a2c` as READY deployment `dpl_Dpboh9pA99NagQAUNxkuPob4AUHr` at https://math-factory-one.vercel.app/. Live health is OK, served code matches the tested build, and bounded error scan returned no records. Earlier sections below are historical.

## Current: 30 September 2026 — All-level question variety improvements live

Reviewed all 30 five-slot question blueprints and audited 128 seeded runs per level before/after. Levels 1–21 retain their existing behavior; Lab levels now vary active places and allowed machines inside the same objective/type-count/exchange constraints. Level 24 has five different two-place patterns. New Lab issuance is versioned xorshift32-v4; persisted active orders and evidence remain unchanged. Regular tests: 100 passed/9 dedicated-harness skips. Real PostgreSQL: 9 passed plus 3 after restart (2 inapplicable skips). Browser suite: 31 passed/1 existing native-zoom environment skip. Typecheck/build/diff checks pass. See `docs/qa/QUESTION_VARIETY_2026-09-30.md` for the full 30-level review and preserved difficulty constraints. Published implementation `2260479` as READY deployment `dpl_B1L24G24GtbJXwBRAwG2kFP4pEL7` at https://math-factory-one.vercel.app/. Live page and server health return 200; bounded startup error scan returned no records. Earlier sections below are historical.

## Current: 30 September 2026 — Approved gameplay equipment live

The approved dispenser/crate artwork is integrated as twelve independent transparent image files. Live quantity fields fit the ivory panels and move with their crates while dispensers stay fixed; shipment travel clears wide viewports and existing save sequencing/reduced motion remain intact. Typecheck/build and 31 browser checks pass, with one existing native-zoom environment skip. Only the gameplay visual baseline changed. See `docs/qa/GAMEPLAY_ART_2026-09-30.md` and `docs/GAMEPLAY_ARTWORK_V4.json`. Published implementation `f4f6e9d` as READY deployment `dpl_5txKDodqadGuFpJzcHomaxCiH4Y6` at https://math-factory-one.vercel.app/. Live health is OK, the updated build is served and all twelve live art hashes match the tested files. The bounded deployment error scan returned no records. Earlier status sections below are historical.

## Current: 30 September 2026 — Approved connected map live

The owner-approved generated campus now renders in the live map component with 30 semantic level buttons and server-derived stars, locks, current level and completion medals. Artwork and controls share one uniformly scaled coordinate space; all five stations and connections remain visible, and Level list provides full-size access. Typecheck/build and 28 browser checks pass, plus the focused earned-reward/keyboard check. Native browser zoom remains environment-skipped. Only the map visual baseline changed. See `docs/qa/COHESIVE_MAP_2026-09-30.md`. After explicit owner approval in this chat, deployment dpl_9sA8nvMiJNxsrB38T7oQPNgkq1JN is READY at https://math-factory-one.vercel.app/. Live page/health/artwork return 200; the artwork hash matches the tested local asset and the updated JavaScript/styles are served. The bounded new-deployment error-log query returned no error records. Earlier status sections below are historical.

## Current: 29 September 2026 — Linear RC-07 revalidation

MAT-5 through MAT-8 are locally complete; their Linear statuses are being synchronized. Corrected place-value practice to the specification's inclusive xorshift range mapping and added independent golden-vector coverage. New orders are marked xorshift32-v2; stored history is preserved. Final regular suite: 81 passed/9 dedicated-harness skips; typecheck/build pass; real PostgreSQL: 9 initial plus 3 restart checks pass. Final browser verification: 24 passed/1 native-zoom environment skip; secure pilot: 4 passed. Source/test/docs reviewed for a local checkpoint. See `docs/qa/LINEAR_RC07_2026-09-29.md`. Older sections below are historical; no deployment is made in this task.

## Current: 27 September 2026 — Vercel/Supabase fictional staging package prepared

The GitHub-tracked MVP now has a Vercel container path (`Dockerfile.vercel`, Fluid configuration and build exclusions) that serves the existing web/API application on Vercel's assigned port. Autoscaling boot performs no migrations or identity provisioning. Runtime accepts Supabase Marketplace `POSTGRES_URL`, administrative setup prefers the non-pooling/direct URL, and staging limits each container to one PostgreSQL connection by default. The fictional-only and production school-identity guards remain intact. Typecheck, build, Vercel structure verification and 78 regular tests pass with 9 dedicated-harness skips. No Vercel/Supabase account, resource, database, region, secret or deployment was created. See `docs/qa/VERCEL_SUPABASE_PREP_2026-09-27.md`.

## Current: 27 September 2026 — functional MVP release candidate verified

The current redesign passed a fresh isolated PostgreSQL pilot covering teacher provisioning, fictional student login, five-order play, interrupted-save recovery, results, teacher evidence, practice, revocation and archive. Release verification passes: typecheck, build, 77 regular tests (9 dedicated-harness skips), PostgreSQL 9 initial plus 3 restart checks (2 restart-inapplicable skips), 22 browser checks (1 native-zoom environment skip), and 4 secure-pilot browser journeys. The visual refresh exposed and then corrected Ship-button and artwork-label contrast issues; the intentional gameplay baseline was refreshed.

A provider-independent container staging package now builds the web client, serves it with the API, runs migrations, provisions a host-secret fictional teacher, exposes `/api/healthz`, binds through `HOST`, and requires `PVF_MODE=staging`, `PVF_AUTH=local` and `PVF_FICTIONAL_ONLY=true`. Production still fails closed pending a school identity adapter. An external staging launch was attempted only through available local tooling: the repository remote exists, but the saved GitHub credential is invalid and no hosting CLI is connected, so no remote service was created or changed. See `docs/qa/MVP_RC_2026-09-27.md`. Existing development data and private configuration remain uncommitted.

## Current: 27 September 2026 — local v2 reporting performance target passed

The unchanged 90-student/30-concurrent/three-worker historical workload passed: actual-browser class-summary request p95 **475 ms** against **<500 ms**, with zero unexpected errors and exact evidence/retry/reward reconciliation. The retained change removes redundant timestamp parsing and scanning in the shared evidence selector without changing selection rules. Typecheck, 76 regular tests, PostgreSQL 9+3 checks, 22 browser checks and build pass (documented harness/native-zoom skips). Full usable-summary interaction is separately 717 ms p95, not an API-latency claim. See `docs/qa/REPORTING_V2_PASS_2026-09-27.md` and its structured measurements. Legacy v1 performance and broader release/pilot/checkpoint work remain separate; no classroom readiness claim. Weekly usage guard remains 90%. All earlier current-status sections below are historical.

## Current: 27 September 2026 — resumed reporting performance investigation

The owner resumed work directly in `/home/owner/Math Factory`, preserving all changes, and raised the weekly usage guard to 90%. Actual account usage was verified at 75%. Stop at 90% or when usage verification is unavailable; do not redeem resets without explicit authorization. PERF-01 remains open at the prior 566 ms browser class-summary measurement. Retained fictional-data query diagnosis completed: a narrower materialized order projection did not improve latency and was rejected without source edits. See `docs/qa/REPORTING_V2_RESUME_DIAGNOSTIC.md`. Latest weekly usage verified at 76%. Older current-status sections are historical.

## Current: 27 September 2026 — paused by owner usage guard

Weekly Codex account usage could not be verified; coding and testing are paused pending the owner. The last already-running reporting v2 benchmark failed actual-browser class-summary p95 at 566 ms (target below 500 ms), although scripted class-summary p95 was 467 ms and correctness checks reconciled. Current-code typecheck and PostgreSQL/restart checks pass. Work remains uncommitted and PERF-01 remains open. See [resumable handoff](docs/qa/REPORTING_V2_PAUSED_HANDOFF.md) for completed work, outstanding checks, preservation requirements and the next step. All older current-status sections below are historical.

## Current: 26 September 2026 — reporting v2 integration, PERF-01 under verification

The owner authorized additive summary/drilldown reporting and continued performance work. The v2 teacher workflow, optimistic revision-bound paging, complete v1 parity fixtures, browser navigation and direct authoritative summary reads are implemented. V1 remains compatible and its original sustained benchmark remains available. The API-only v2 candidate passed; the expanded real-browser workload exposed class-summary misses (596 ms, then 815 ms for the unsuccessful JSON-batch variant). A per-order fact read with one shared summary reducer now passes PostgreSQL parity/restart checks and is undergoing the unchanged sustained workload. PERF-01 is not yet marked complete. `docs/qa/REPORTING_V2_2026-09-26.md` maps the full acceptance boundary and reproduction commands. The older current-status sections below are historical checkpoints.

## Current: 26 September 2026 — pilot-readiness checkpoint, performance open

The locally achievable visual, operations, pilot and deployment-preparation packages have been implemented with fictional data. Browser audit covered visible text in 24 gallery states plus login and teacher views, corrected map-node contrast, added a narrow teacher-table scroll cue, and prepared selected owner-review captures. Keyboard-only five-order play, reduced motion, CSS zoom and 320px reflow are locally checked; native browser zoom and a spoken screen-reader trial remain NOT RUN. A fresh secure pilot completed provisioned access, five path orders, five practice orders, interrupted-save recovery, teacher evidence, revocation and archive. Guarded encrypted backup inventory/expiry and an independent encrypted deletion ledger were rehearsed with an older-backup restore into a disposable target. Production mode fails closed pending a school identity adapter, and provider-independent configuration validation and a school decision register are prepared.

**PERF-01 blocks completion of this local milestone.** The latest unchanged sustained workload had 90 fictional learners, 30 concurrent users, ten synthetic historical attempts per learner plus two API-earned attempts, three API workers and overlapping full-year reports. The final targeted report-calculation run took 93.8 seconds at 216 requests/s with zero errors or observed advisory waits; p95 profile/start/answer/retry/report was **253/510/202/194/842 ms** against the separate 500 ms targets. Report loading consumed 370 ms p95 and report construction 90 ms p95 in diagnostic server timing; the client also spent 172 ms p95 receiving and 90 ms p95 parsing roughly 11.4 MB p95 report bodies. The best earlier full-workload report p95 with the same joined read path was 833 ms, still failing. Final attempts, answers, receipts, class-local report totals and rewards reconciled. The synthetic history is performance data, not earned mastery evidence. See `docs/qa/CLASSROOM_LOAD_2026-09-26.md` for evidence and options. The short fresh-data load remains passing and does not close this gap. A versioned summary/drilldown idea is only a proposal in `DECISIONS.md`; the accepted v1 report contract remains intact. No classroom-readiness claim or owner/school approval follows from this checkpoint.

External steps after local PERF-01 is resolved: owner visual approval; school identity, hosting/region, privacy, retention, backup/ledger custody and operating-owner decisions; representative physical device, selected assistive technology, actual native zoom and school-network trials. The current review and operations packs are `docs/PILOT_VISUAL_REVIEW.md`, `docs/PILOT_OPERATOR_GUIDE.md`, `docs/DEPLOYMENT_READINESS.md` and `docs/OPERATIONS.md`. The sections below are historical and may claim a completed local candidate before the stricter sustained-history milestone was attempted.

## Current: 26 September 2026 — V1 local release-candidate verification

The RC-07 mathematics/progression/reporting checkpoint remains intact, including its follow-up scaffold correction (`f410558`). Guarded operations now include teacher-owned class archive, encrypted private backup and authenticated restore into a separate empty disposable PostgreSQL database, configurable student deletion and archived-class retention, dependent-record removal, expiry markers for backups, and expired-secret/session cleanup. A restored API returned the same five-order teacher report; wrong-key restore left the target empty. These operations were tested only with fictional data. The existing development database and private configuration remain outside the checkpoint.

Secure local identity now has bounded network failure throttling in addition to per-account limits, session/CSRF/origin and class-isolation checks. The 90-student/30-concurrent local workload initially missed the 500 ms p95 API target; changed-entity persistence and repeatable-read GET snapshots brought the final measured p95 to 343 ms starts, 450 ms answers, 405 ms retries and 67 ms reports, with 87 requests/s and zero errors. Global mutation locking remains for exactly-once effects. Local Chromium recovery/accessibility checks cover queued reply loss, revocation, keyboard shipment, labels, focus, reduced motion, 200% CSS zoom, core contrast and 320–1366px reflow. Final verification passed: `npm test` 71 passed (8 PostgreSQL/load cases skipped by that command), `npm run test:postgres` 7 initial and 3 restart-phase passed (2 restart-inapplicable skips), `npm run test:load` passed, `npm run test:e2e` 19 passed, secure pilot 4 passed, `npx tsc --noEmit` and `npm run build` passed. See `docs/V1_CURRENT_ACCEPTANCE.md`, `docs/OPERATIONS.md` and `docs/qa/` for scope and evidence.

This is a fictional-data local candidate, not classroom readiness. External gates are owner visual approval; school identity, hosting, privacy and retention/backup decisions; and representative physical-device, assistive-technology and school-network trials. The historical sections below retain their original dates and are superseded by this current section where they describe these local work packages as incomplete.

## Current: 26 September 2026 — RC-07 local checkpoint verified

Fictional students can complete all 30 levels, practice missing skills at every stage boundary and after level 30, earn six persistent certifications and Factory Master, replay levels and earn transfer rewards once. The full isolated PostgreSQL HTTP journey earns evidence through submitted answers, accepts a nonminimal restricted representation, corrects advanced objectives and verifies saved order/answer history after restart. The engine verifies all 150 level/slot cells across seeds and bands, independent witnesses and minimum-crate oracle cases. Teacher class and student reports use the same persisted reconstruction, class-local date filters and transfer exclusion by default; the workspace shows stored question, first answer, final answer, skill progress and pending/corrected counts. The secure fictional pilot, standard browser recovery journeys and real PostgreSQL security/rollback suites have passing evidence in the RC-07 task handoff.

The latest audit also connected bounded per-skill scaffolding to server issuance. Difficulty now uses the student's committed cross-attempt mastery and reconstructs scaffold state from resolved evidence; initial, subsequent, skipped replacement and practice orders share that policy. Regression tests cover activation, three-order countdown, two-success exit, and real API issuance from persisted history. Malformed answer vectors now return 422 without changing response history or first-attempt evidence. Level 9 zero-pattern coverage and primary-skill attribution are asserted for all 150 blueprints.

This is a local fictional-data checkpoint, not the full V1 release candidate or classroom readiness. Next V1 work includes guarded backup/restore, retention/deletion and class archive, session/network hardening, measured 90-student/30-concurrent load, complete local accessibility and recovery fault audit, and owner visual review. School identity/hosting/retention approval and physical device, network and assistive-technology trials remain external gates. Historical sections below retain their original dates and may describe earlier gaps that this checkpoint supersedes.

## Historical: 23 September 2026 — full V1 release candidate in progress

RC-04 secure fictional pilot now uses database-backed teacher/student sessions, class and roster lifecycle, CSRF/origin checks, throttled local credential login, and a private disposable PostgreSQL launcher. A Chromium teacher→student→five orders→report→revocation journey passes. RC-05 inspected visual correction is committed (`c913c9c`): the six-machine workspace fits desktop and landscape tablet, the map presents 30 live nodes and an accessible list, results layers and copy were corrected, and all gallery fixtures have image/reflow checks at 1366, 390 and 320 CSS pixels. Updated screenshots were inspected at desktop, landscape/portrait tablet and narrow width; owner approval and physical-device/assistive-technology review remain pending. RC-06 now queues answer and help commands in IndexedDB before send, retries their immutable keys after refresh/reconnect, and preserves pending versus confirmed feedback. Real PostgreSQL pilot browser tests cover before-commit, after-commit and final-result reply loss with five submitted orders in the teacher report. Recovery remains partial pending the final conflict/lease and acceptance audit. Full math/report audit, retention operations, bounded load and final acceptance audit remain locally actionable. Historical entries below are superseded where they conflict with this current section.

The previous system-PostgreSQL access blocker is superseded. `npm run test:postgres` creates an isolated user-owned PostgreSQL 16 cluster with a private Unix socket, peer authentication and no TCP listener. The API now selects normalized PostgreSQL persistence when `DATABASE_URL` is configured and holds replies until transaction commit. Actual HTTP five-order completion, concurrent retries, injected database rollback, result/report reconciliation and fresh API reads after a PostgreSQL restart pass. Runtime-issued order IDs no longer collide across repeated attempts; exact evidence links are stored. Requests currently use a correctness-first global database transaction lock; bounded load and narrower locking remain to verify. Secure identity/rosters, durable browser outbox, full math/report audit and visual acceptance remain implementable work. Pilot/production startup rejects the development identity adapter. The broader release candidate is not complete. See `docs/RELEASE_CANDIDATE_PLAN.md`; all sections below are historical claims, not current acceptance proof.

## 2026-09-22 artwork pack delivery

Created 23 original transparent assets in apps/web/public/assets/art-v1/: six mascot poses, five configured zone buildings, five factory props, five zone cosmetics and two effects. Original 1254×1254 PNG masters are preserved; alpha-preserving 512px/768px WebP derivatives total 1,130,984 bytes versus 24,421,384 bytes of originals (95% reduction). Existing scene backgrounds are retained.

Exact prompts, inventory, intended state mapping and integration constraints are in docs/ARTWORK_PROMPTS.json, docs/ASSET_MANIFEST.md and docs/ARTWORK_HANDOFF.md. The standalone artwork preview loads all 23 assets without broken images and was inspected on light/navy backgrounds; npm run build and git diff --check passed. This is artwork-ready delivery, not completion of the full visual integration milestone. The live screens still need pose wiring, layout composition, motion, comprehensive visual QA and owner approval.

## 2026-09-22 original art and visual experience integration

The original `art-v1` WebP pack now decorates the live React screens through reusable presentation components. All six mascot poses are mapped to meaningful non-authoritative states; the map composes all five original zone buildings with live level nodes and CSS available/completed/locked effects; calm gameplay uses the supplied factory scene, and busy gameplay adds separately removable factory props. Results use the celebration effect and mascot while the rating remains semantic HTML. Login, level introduction, progress, settings, teacher, loading/error/empty, pause/takeover, help, feedback and gallery states receive the shared visual treatment without changing game behavior.

Restrained mascot, conveyor, light, steam and celebration animation is disabled for `prefers-reduced-motion` and the saved reduced-motion setting. Decorative images have empty alt treatment, use contained explicit dimensions, and do not carry changing student information. Browser coverage now reaches every documented gallery fixture, verifies primary image loading, calm/busy state wiring, reduced-motion hiding, narrow 390px reflow, controls, results refresh and recovery journeys. Final review captures are in `docs/visual-evidence/`.

Verified: `npm test` (46 tests), `npx tsc --noEmit`, `npm run build`, `npm run test:e2e` (7 Chromium journeys), and `git diff --check` passed. This completes the locally verifiable art-integration slice; final owner visual approval, manual screen-reader/device/zoom review and external production prerequisites remain separate from the fictional-data milestone.

## 2026-09-22 handoff-faithful gameplay and visual acceptance

The game now uses a compact factory workspace: a central current order, small guide, live expression monitor, six semantic factory-machine controls and nearby shipping actions read as one playable workbench rather than a tall form. The map keeps its accessible live level list while visually linking original buildings and nodes; zone cosmetics appear only after a whole zone is complete. Results use readable child-facing summaries, live stars and a correctly layered celebration composition. Internal skill identifiers are translated in map, progress and results screens without modifying scored data.

The acceptance suite adds deterministic, manually inspected gallery baselines for map, calm gameplay and three-star results, with motion disabled. The same suite retains real five-order, correction, refresh, storage, takeover, hint-focus and drop-after-commit recovery journeys. Manual screen-reader, physical touch-device and zoom review remain NOT RUN; owner visual approval remains pending.

## 2026-09-22 secure classroom pilot readiness audit

This milestone is blocked before real-database acceptance. The local PostgreSQL socket is present but the workspace has no authorized role: the workspace user role does not exist and the server `postgres` role requires peer authentication; `DATABASE_URL` is unset and Docker is unavailable. The PostgreSQL migration/repository code and pg-mem test are not evidence that the live application uses a real PostgreSQL transaction path. The active runtime remains the JSON fictional-development adapter.

Needed to proceed: an authorized disposable PostgreSQL connection string or a workspace-owned role/database for fictional test data and migration verification. This does not request production access, external account changes or real student data. Visual owner approval and manual screen-reader/physical-device checks remain separately pending.

As of 20 September 2026 | Baseline v1.0

**Specification ready; application implementation not started in this handoff.**

Available: PDF and editable Markdown specification; four original inspected design references; five root coordination documents; deterministic math fixture data; README and portable ZIP. The specifications contain a 30-level baseline, 19 skills, algorithms, contracts, acceptance IDs and roadmap.

Not implemented or tested: frontend, backend, authentication, database/migrations, pure TypeScript game engine, endpoints, progression, reports, offline queue, accessibility behavior, load or classroom-device operation. The supplied fixture JSON is expected test data, not a passing application test suite.

Documentation verification: inspect the main PDF layout, reconcile mathematical examples and check the archive/appendices before delivery. A documentation audit does not close any application acceptance ID.

Next: PA-01 inspect any existing repository and choose pinned stack/identity adapter; freeze shared schemas; GL-01 validator/oracle first. FE semantic components and BE auth may proceed after interfaces are frozen.

Recommended technical baseline: React/TypeScript, Node API, PostgreSQL, shared schema and pure engine packages; semantic HTML/SVG, no AI dependency. No hosting provider or repository has been selected by this package.

Pending before a real-student rollout: school-authorized hosting/data arrangements, teacher identity, retention settings, final visual approval and actual school-device/network QA. Fictional-data development can proceed.

All application acceptance IDs: NOT RUN. Update this file with evidence levels and commit references, not optimistic percentages.

## 2026-09-19 implementation checkpoint

Implemented: root npm TypeScript workspace; pure engine and independent oracle; fixture-driven tests; fictional-data Node API; server-owned JSON persistence; semantic React login/map/game/results/teacher report.

Observed: `npm test` = 29 passed; `npx tsc --noEmit` and `npm run build` passed. API journey completed five server-validated shipments, reloaded results, and teacher evidence matched (`persistedEvidence:5`).

Evidence: VALIDATE/ORDER mathematical scope is logic verified; narrow fictional API slice is integrated. Browser E2E, PostgreSQL, production security/auth, recovery, full progression and classroom/device accessibility remain incomplete and NOT RUN.

## 2026-09-19 difficulty checkpoint

Level 1 no longer uses a placeholder fixed target list. Its immutable configuration defines the five required place-value slots and easy/medium/hard digit bands; orders retain their issued band and primary skill. The next order can step down only after two incorrect mathematical submissions, never because of speed, accessibility settings or network conditions. This is verified for the Level 1 API path, not a claim that V1's full adaptive/mastery system is complete.

## 2026-09-19 progression foundation checkpoint

All 30 baseline level definitions now live in immutable config and have a deterministic server generator path. The map is driven by committed level completion and exposes only the next level; a 150-order test confirms a valid whole-crate witness for every level/slot definition. Stage 6 browser controls for two representations and repacking are still missing, and mastery gates/practice scheduling are not yet implemented. Therefore this is a configuration/integration checkpoint, not completion of full V1 progression.

## 2026-09-20 command-safety checkpoint

The fictional-data API now requires matching idempotency keys for starts and shipment responses, stores response receipts, validates optimistic revisions, and enforces a bounded single-writer lease. The game screen sends these fields and clearly disables editing while a shipment is being saved. Isolated integration tests verify exact duplicate replay, altered duplicate rejection, stale revision rejection, and a second active tab rejection.

This is still a narrow development adapter, not PostgreSQL persistence: its JSON file has no cross-process transaction or rollback guarantee. Database migrations, durable browser outbox/reconciliation, lease heartbeat/takeover, CSRF/session hardening, browser E2E, and classroom evidence remain NOT RUN.

## 2026-09-20 mastery-policy checkpoint

Pure engine functions now calculate evidence scores, rolling weighted mastery, secure gates, difficulty bands, refresh flags, and reversible scaffolding without using speed or accessibility settings. Unit fixtures cover the score precedence, minimum secure sample, diversity, signature deduplication, staleness, and scaffold recovery.

The server does not yet persist or use this policy when issuing orders, completing attempts, unlocking gates, scheduling practice, or reporting to teachers. This is logic verified only.

## 2026-09-20 PostgreSQL foundation checkpoint

A forward PostgreSQL schema, migration runner, and parameterized serializable transaction repository now exist for durable attempts, immutable orders, responses, receipts, and evidence. The repository is deliberately not yet the active API store: this workspace has no PostgreSQL client, database service, or container runtime, so migrations and database integration tests are NOT RUN.

The JSON adapter remains fictional-data-only and is not production persistence. Selecting the database repository at runtime requires a disposable database verification first, including migration, rollback, receipt replay, lease, and concurrent transaction tests.

## 2026-09-21 integrated completion audit

The local fictional-data application now has a 46-test passing suite, TypeScript check and production web build. The audited, implemented local path includes deterministic validation/generation/mastery, all configured levels, restricted/minimum/exact/two-way/repack metadata, ordered H1-H3 supports, pause/resume, skip replacement, leases/takeover, recovery across a JSON-store restart, a five-shipment completion, an optional transfer third star, profile settings, and teacher-report reconciliation.

The acceptance checklist and exact commands are in `docs/COMPLETION_CHECKLIST.md` and `docs/QA_EVIDENCE.md`. This is **integrated fictional-data evidence**, not classroom-ready or production-security evidence. Playwright Chromium covers the primary student/teacher journey and refresh/takeover recovery. Manual screen-reader/representative-device accessibility, real PostgreSQL migration/rollback/concurrency, school identity/hosting/retention approval, and classroom network/load testing are still NOT RUN. The JSON adapter remains development-only.

## 2026-09-22 teacher-report integrity checkpoint

The fictional teacher report now uses an order-level submitted denominator, so a wrong answer followed by a correction is one submitted order rather than two. Its ISO date window can yield explicit zero-evidence counts, and the fictional adapter owner-scopes both class reports and exact order evidence; a second teacher cannot read the seeded class's report or response. `npx tsc --noEmit`, `npm test` (46 tests), `npm run build`, and `npm run test:e2e` passed.

This is still only an integrated fictional-data report slice. Roster provision/reset/revoke, report pagination/individual drilldowns, production identity/session hardening, and durable PostgreSQL report queries remain incomplete or externally unverified.

## 2026-09-22 browser-storage recovery checkpoint

Browser draft/pending persistence is now guarded against unavailable or quota-exhausted device storage. Gameplay remains usable in memory, but it tells the student not to refresh or close because unsaved work cannot be restored. The existing Playwright journey plus an injected storage-failure journey passed; deliberate drop-reply and simultaneous two-tab browser fault injection are still NOT RUN.

## 2026-09-22 two-tab recovery checkpoint

Playwright Chromium now opens the same active attempt in two pages. The second tab takes over the lease, a shipment from the stale tab is rejected with the authoritative lease-loss message, and the new writer successfully saves the following shipment. Deliberate drop-after-commit/before-reply remains NOT RUN.

## 2026-09-22 pre-art milestone

The student frontend is now separated into reusable login, map, level-introduction, progress, settings, gameplay, machine-editor, results, teacher and development-gallery components. Route-shaped browser history covers the specified student URLs, including a refreshable saved-results route. Shared CSS design tokens establish the stable semantic layer that original artwork will decorate.

The development-only visual gallery covers map locked/unlocked/resume, level introduction, progress, calm/busy play, restricted/minimum/exact-types/two-way/repack objectives, incorrect/correct/pending/offline/storage/takeover/pause/help states, loading/error/empty states and two-/three-star results. Playwright now verifies six journeys, including quantity preservation after a wrong response, progress/practice visibility, advanced-mode fixture rendering and drop-after-commit/before-reply receipt recovery.

Verified at this checkpoint: `npm test` (46 tests), `npx tsc --noEmit`, `npm run build`, and `npm run test:e2e` (6 Chromium journeys) passed. The semantic UI/state surface is ready for original artwork integration. Production identity, real PostgreSQL runtime verification, roster lifecycle, retention/deletion, manual assistive-technology/device review and classroom load/network evidence remain outside this milestone.
