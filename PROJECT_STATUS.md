# Project status

## Current: 23 September 2026 — full V1 release candidate in progress

RC-04 secure fictional pilot now uses database-backed teacher/student sessions, class and roster lifecycle, CSRF/origin checks, throttled local credential login, and a private disposable PostgreSQL launcher. A Chromium teacher→student→five orders→report→revocation journey passes. RC-05 inspected visual correction is under review: the six-machine workspace fits desktop and landscape tablet, the map presents 30 live nodes and an accessible list, results layers and copy were corrected, and all gallery fixtures have image/reflow checks at 1366, 390 and 320 CSS pixels. Updated screenshots were inspected at desktop, landscape/portrait tablet and narrow width; owner approval and physical-device/assistive-technology review remain pending. The durable IndexedDB outbox, full math/report audit, retention operations, bounded load, and final acceptance audit remain locally actionable. Historical entries below are superseded where they conflict with this current section.

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
