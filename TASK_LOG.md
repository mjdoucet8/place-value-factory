# Task log

## 2026-09-23 | RC-01 | CLAIM | Full V1 release candidate

Scope: expanded owner objective in `docs/RELEASE_CANDIDATE_PLAN.md`; retain all unmet V1 requirements. Primary editor owns scripts/, database repository tests, acceptance ledger and coordination documents. Start with isolated user-owned PostgreSQL verification; then runtime persistence/security, recovery, educational audit and remaining visual/teacher work. No existing database resets. Contract v1.0 unchanged at this checkpoint. Acceptance: DATA-01..04, RECOVERY-05, SEC-01..03 and full register tracked in the ledger.

## 2026-09-23 | RC-01 | UPDATE | Real database path unblocked

Implemented a user-owned PostgreSQL 16 test harness, without TCP, sudo, system-cluster changes or existing database access. Real tests verify migrations from empty schema, two concurrent migration runners, reapplication, rollback after response/order/revision writes, six simultaneous duplicate answers (one commit/five replays), altered key conflict, wrong-student denial, stale revision/lease denial, evidence isolation and process-restart durability. Added bounded whole-transaction serialization/deadlock retries and normalized PostgreSQL Date evidence to ISO strings. Migration CLI now uses the same tested module and resolves migrations independent of current working directory.

Observed commands: `npm run test:postgres` passed before and after a real PostgreSQL restart; `npx tsc --noEmit` passed; `npm test` passed 46 existing tests with the dedicated real-database test skipped outside its harness. This closes the credential blocker only; no full runtime or release completion claimed. Full acceptance ledger and resumable dependency queue added. Next task: normalized runtime entity persistence and authenticated transaction boundary, retaining original math and client recovery invariants.

## 2026-09-22 | ART-01 | HANDOFF / DONE (asset delivery)

Created and inspected 23 original transparent PNG assets using built-in image generation. Kept the existing robot identity and factory palette; followed the actual Receiving/Packing/Warehouse/Shipping/Lab zones. Added alpha-preserving WebP copies (1.13 MB total, 95% smaller), a light/navy preview page, exact prompt provenance and per-asset integration notes. Original scenes and other work are preserved.

Checks: all 23 PNGs contain real transparent pixels; all 23 WebPs preserve alpha; headless Chromium preview reports 23 images and zero broken images; light and navy screenshots inspected; npm run build passed; git diff --check passed. Screenshots: docs/artwork-preview-light.png and docs/artwork-preview-navy.png.

Evidence: finished asset pack, ready for integration. Remaining: live screen composition and state wiring, motion, accessibility/device visual review and owner art approval. No game logic, database or gameplay source edits in this task. No commit created because pre-existing uncommitted art integration work remains in the workspace.

## 2026-09-22 | ART-01 | CLAIM

Goal: create the complete reusable original artwork pack requested by the owner: six isolated mascot poses, five actual configured zone buildings, factory overlays and zone cosmetics. Preserve existing scenes and source assets. Owns apps/web/public/assets/art-v1/, docs/ARTWORK_HANDOFF.md, docs/ASSET_MANIFEST.md and this log. No mathematical/API changes. Evidence target: inspected image assets with alpha validation and integration guidance; full visual milestone remains separate.

Append-only after initial handoff. Corrections are new dated entries; never rewrite old outcomes. Claim template and workflow are in AGENTS.md.

## 2026-09-22 | FE-10 / QA-07 / PA-05 | CLAIM

Goal and scope: complete the pre-art milestone by preserving the verified recovery/report checkpoint, componentizing the student UI, establishing route-shaped navigation and complete visual states, and adding browser evidence for advanced modes and dropped-reply recovery.

Owned paths: `apps/web/src/`, `apps/server/src/index.ts`, `tests/`, `docs/`, root status/readme/ignore files.

Dependencies and contract version: API contract v1.0; no production identity, deployment, artwork or JSON-adapter replacement.

Acceptance IDs: INTRO-01..03, MAP-01..03, RESULT-01..03, PROGRESS-01..02, GAME-04..07, RECOVERY-02..04/07, ACCESS-01..02/05..07, DESIGN-01..04 (pre-art structure and evidence).

## 2026-09-22 | FE-10 / QA-07 / PA-05 | HANDOFF

Changes and artifacts: preserved the preceding recovery/report/help work in commit `1b3f184`; split the React UI into reusable screens plus a shared machine editor and model definitions; added route-shaped history, a dedicated level introduction, detailed progress/results, resume banner, refreshable results, teacher empty/table states and centralized design tokens. Added a deterministic development gallery documented in `docs/VISUAL_STATE_GALLERY.md`, covering the complete pre-art state inventory without changing progress. Results now include authoritative best streak and per-skill summaries.

Browser evidence: the primary journey submits a wrong answer, verifies the quantity remains editable, corrects it, completes five orders, refreshes saved results, completes transfer, reviews settings/progress and opens teacher evidence. Separate journeys cover unavailable storage, two-tab takeover, help focus restoration, drop-after-commit/before-reply receipt recovery and advanced-mode/state fixtures.

Commands and observed results: `npm test` passed 46 tests; `npx tsc --noEmit` passed; `npm run build` passed; `npm run test:e2e` passed 6 Chromium journeys; `git diff --check` passed.

Evidence level: integrated fictional-data UI/API plus deterministic visual-regression surface. Ready for original artwork integration, not production or classroom release.

Remaining external/later work: original art generation/integration; production identity/session/CSRF and roster lifecycle; real PostgreSQL migration/rollback/concurrency; retention/deletion; manual screen-reader, representative-device/zoom, load and classroom-network evidence.

## 2026-09-22 | BE-05 / QA-03 | CLAIM

Goal and scope: make the fictional teacher-report/evidence read path class-owner scoped and add a regression proving a teacher from a different fictional class cannot read a student's exact evidence.

Owned paths: `apps/server/src/index.ts`, `tests/integration/journey.test.ts`, `TASK_LOG.md`, `PROJECT_STATUS.md`, `docs/COMPLETION_CHECKLIST.md`, `docs/QA_EVIDENCE.md`.

Dependencies and contract version: API contract v1.0; existing teacher evidence route and fictional identity adapter.

Acceptance IDs: REPORT-02, REPORT-04, SEC-01 (fictional-adapter scope).

## 2026-09-22 | BE-05 / QA-03 | HANDOFF

Changes and artifacts: scoped fictional teacher classes to explicit owner IDs; class/student listing, class reports, and exact order evidence now return 404 outside the teacher's class. Report aggregation counts one submitted order from its first response, recognizes a later accepted correction for that same order, includes explicit zero counts for an empty ISO date window, and returns current activity metadata.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (46 tests), `npm run build`, and `npm run test:e2e` passed. The integration journey verifies a five-order denominator from six response records, empty-window zeros, and second-teacher denial of both report and evidence routes.

Evidence level: integrated fictional-data API and browser journey.

Remaining risks or blockers: roster provisioning/reset/revoke, report pagination and individual drilldowns, database-backed report authorization, production sessions/CSRF, and real PostgreSQL concurrency remain incomplete or NOT RUN.

Next owner / reviewer: BE/QA for local fictional roster lifecycle and recovery fault coverage; school owner and infrastructure for production identity and PostgreSQL verification.

## 2026-09-22 | FE-06 / QA-04 | CLAIM

Goal and scope: make browser draft and pending-command storage degrade safely when device storage is blocked or full, without claiming recoverability that was not saved.

Owned paths: `apps/web/src/main.tsx`, `tests/e2e/student-teacher.spec.ts`, `TASK_LOG.md`, `PROJECT_STATUS.md`, `docs/COMPLETION_CHECKLIST.md`, `docs/QA_EVIDENCE.md`.

Dependencies and contract version: API contract v1.0; existing local draft/pending-command behavior.

Acceptance IDs: RECOVERY-07, RECOVERY-03 (degraded browser-storage behavior).

## 2026-09-22 | FE-06 / QA-04 | HANDOFF

Changes and artifacts: replaced direct browser-storage calls with a failure-tolerant device-storage adapter. If storage is unavailable, the game retains the active in-memory draft, continues an immediate save request, and persistently states that refresh/close cannot recover the draft. It never reports a failed local write as saved recovery state.

Commands/manual checks and observed results: `npx tsc --noEmit` and `npm test` (46 tests) passed. `npm run test:e2e` passed 2 Chromium journeys, including one that forces `Storage.setItem` to throw and then ships a canonical order successfully.

Evidence level: integrated browser and fictional-data API verification.

Remaining risks or blockers: direct network drop-after-commit and true simultaneous-two-tab fault injection remain untested; storage uses localStorage rather than the specified profile-scoped IndexedDB outbox and remains development-only.

Next owner / reviewer: FE/QA recovery fault coverage; BE for durable production persistence and identity lifecycle.

## 2026-09-22 | FE-06 / QA-04 | UPDATE

Changes and artifacts: corrected the Playwright server data path so the configured pre-run cleanup and the API resolve the same root-level fictional E2E store. This prevents successive browser runs from silently inheriting prior attempts. Payload receipts now use deterministic key-sorted JSON hashing, avoiding property-order-only false conflicts.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (46 tests), `npm run build`, and `npm run test:e2e` (2 Playwright Chromium journeys) passed.

Evidence level: integrated fictional-data verification.

## 2026-09-22 | FE-07 / QA-05 | CLAIM

Goal and scope: add a true multi-tab browser lease fault test proving takeover rejects a stale writer while preserving the committed attempt for the new writer.

Owned paths: `tests/e2e/student-teacher.spec.ts`, `TASK_LOG.md`, `PROJECT_STATUS.md`, `docs/COMPLETION_CHECKLIST.md`, `docs/QA_EVIDENCE.md`.

Dependencies and contract version: API contract v1.0; existing lease/takeover endpoint and game UI.

Acceptance IDs: RECOVERY-04, PLAY-02.

## 2026-09-22 | FE-07 / QA-05 | HANDOFF

Changes and artifacts: added a three-page-state Chromium fault journey using two same-context browser tabs. It opens an attempt, performs an explicit writer takeover, verifies that the original tab's shipment is rejected as another-tab editing, and verifies the new writer advances to shipment 2 of 5.

Commands/manual checks and observed results: `npm run test:e2e` passed 3 Playwright Chromium journeys. The multi-tab test exercised the actual UI and fictional API lease endpoint rather than mocking a response.

Evidence level: integrated fictional-data browser verification.

Remaining risks or blockers: deliberate drop-after-commit/before-reply recovery, IndexedDB outbox behavior, actual private-mode/browser variants, and real database restart/rollback remain incomplete or NOT RUN.

Next owner / reviewer: FE/QA recovery drop-reply test; BE for durable production persistence and identity lifecycle.

## 2026-09-22 | FE-08 / QA-06 | HANDOFF

Changes and artifacts: replaced inline Help output with a labelled modal dialog. Its keyboard handler traps Tab within the dialog, Escape closes it, and both close paths restore focus to the Open help trigger. H1-H3 persistence remains server-owned.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (46 tests), and `npm run build` passed. `npm run test:e2e` passed 4 Chromium journeys; the new journey opens the Help dialog, presses Escape, and verifies focus restoration.

Evidence level: integrated fictional-data browser verification.

Remaining risks or blockers: manual screen-reader review, full results/progress detail, real-device reflow, and production identity/persistence remain incomplete or NOT RUN.

## 2026-09-22 | FE-09 | HANDOFF

Changes and artifacts: results now render the authoritative five-shipment count, first-objective fraction, eventually-correct fraction, and this-level efficiency from the server result rather than illustrative values.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (46 tests), and `npm run build` passed.

Evidence level: integrated fictional-data UI/build verification.

Remaining risks or blockers: results still lack the full skill-status, streak, retry/next-level detail and manual assistive-technology review required for complete RESULT coverage.

## 2026-09-21 | PA-04 / GL-04 / BE-04 / FE-05 / QA-02 | CLAIM

Goal and scope: complete all locally verifiable Place Value Factory V1 behavior from the existing integrated prototype, reconcile source against the specification, add browser/integration evidence, and leave only genuine external deployment/classroom prerequisites.

Owned paths: `docs/`, `PROJECT_STATUS.md`, `README.md`, `TASK_LOG.md`, `apps/`, `packages/`, `db/`, `tests/`.

Dependencies and contract version: contract v1.0; preserve accepted mathematical, privacy, accessibility, idempotency and isolation invariants.

Acceptance IDs: all locally executable IDs in the V1 acceptance register; external evidence is explicitly recorded rather than fabricated.

## 2026-09-21 | PA-04 / GL-04 / BE-04 / FE-05 / QA-02 | HANDOFF

Changes and artifacts: added a living acceptance checklist and local QA evidence record; corrected Level 1 configured slot attribution and band generation; added repack source metadata; added server-authoritative optional transfer/third-star resolution; expanded fictional profile/settings and teacher-report data; added an accessible settings/login flow, repack display, transfer result action and responsive/focus CSS; added restart/journey and transfer regression coverage.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (46 tests across unit, API integration, journey/restart and pg-mem repository paths), `npm run build`, and `npm run test:e2e` (Playwright Chromium primary student/teacher journey) passed. A generated gameplay screenshot was visually inspected. The available computer-use runtime had no interactive browser surface, but the repeatable browser suite supplies the recorded browser evidence.

Evidence level: integrated fictional-data API and build verification; browser/device/classroom evidence remains NOT RUN.

Remaining risks or blockers: real PostgreSQL migration/rollback/concurrency and runtime selection; school identity/hosting/retention approval; manual screen-reader, actual simultaneous multi-tab/offline/private-mode, representative-device/reflow and classroom-network/load verification require unavailable tooling or external infrastructure. JSON persistence is development-only.

Next owner / reviewer: QA with a browser-capable environment and disposable PostgreSQL instance; school owner for identity, hosting and retention decisions.

## 2026-09-20 | FE-04b | CLAIM | Frontend / Game UX

Goal and scope: bind the controlled server-side skip/replacement action to an accessible student game control without duplicating eligibility or progression decisions in the browser.

Owned paths: `apps/web/src/main.tsx`, `TASK_LOG.md`.

Dependencies and contract version: contract v1.0; BE-03d skip command and attempt snapshot.

Acceptance IDs: GAME-07, ORDER-05, MASTERY-02.

## 2026-09-20 | BE-03e | CLAIM | Backend / Data

Goal and scope: implement the existing H1/H2/H3 support-event contract in the fictional API and carry server-recorded highest hint into evidence scoring.

Owned paths: `apps/server/src/index.ts`, `tests/integration/idempotency.test.ts`, `TASK_LOG.md`.

Dependencies and contract version: API contract v1.0; engine evidence policy.

Acceptance IDs: HELP-01, MASTERY-02, ORDER-05.

## 2026-09-20 | BE-03e | HANDOFF | Backend / Data

Changes and artifacts: added immutable, idempotent H1/H2/H3 support events to the fictional API; enforces progressive help ordering; returns a relationship prompt, distinct-target example, or server-generated current-order model as appropriate; and uses the recorded highest hint when resolving evidence. Progress now includes skills that have actual evidence even when they are not stage-gate skills.

Commands/manual checks and observed results: `npx prettier --write apps/server/src/index.ts tests/integration/idempotency.test.ts`, `npx tsc --noEmit`, `npm test` (42 tests), and `npm run build` passed.

Evidence level: fictional API integrated with direct command/replay/order/evidence tests. Student Help dialog, browser E2E, and durable PostgreSQL persistence remain NOT RUN.

## 2026-09-20 | FE-04b | HANDOFF | Frontend / Game UX

Changes and artifacts: added a semantic “Skip after two saved tries” control. It sends the BE-03d idempotent command with the current revision and lease, leaves eligibility and replacement generation to the server, and clears local representations only after a replacement snapshot returns.

Commands/manual checks and observed results: `npx prettier --write apps/web/src/main.tsx`, `npx tsc --noEmit`, `npm test` (41 tests), and `npm run build` passed.

Evidence level: fictional API/UI integrated. Browser E2E, assistive-technology, and offline retry checks NOT RUN.

Remaining risks or blockers: the display cannot pre-confirm skip eligibility without a server-owned field; the server rejection message is the authoritative feedback.

## 2026-09-20 | DOC-001 | HANDOFF | Product / Architecture

Goal: create the Codex-ready Place Value Factory V1 implementation baseline from the supplied brief, four images and FrancoBot organizational reference.

Outputs: PDF/Markdown specification; root coordination files; original design PNGs; deterministic math fixture data; README and ZIP.

Scope: documentation and design analysis only. No game application or runtime endpoints created. All application tests are NOT RUN.

Decisions: written math governs screenshot copy; no design chronology inferred from upload order; consistent colour mapping; direct quantity input plus Ship; 30 levels/five orders are recommended baselines; exact-type/minimum combination excluded from V1.

Handoff: PA-01 inspects actual repository, agrees contract schemas and dependency versions; GL-01 begins validator with QA oracle. See PROJECT_STATUS.md and DECISIONS.md for pending owner choices.

## 2026-09-19 | PA-01 / GL-01 / QA-01 / BE-01 / FE-01 | HANDOFF

Implemented: npm TypeScript workspace, shared contracts, deterministic pure validator/minimum/generator, independent dynamic-programming oracle, fixture tests, fictional local auth, server-owned JSON persistence, semantic React map/game/results/teacher report.

Actual results: `npm test` passed 29 tests; `npx tsc --noEmit` passed; `npm run build` passed. Local API flow logged in fictional Ava, committed five canonical shipments, reloaded completion, and teacher report returned persistedEvidence:5.

Evidence: mathematical requirements logic verified; narrow fictional API journey integrated. Browser E2E, PostgreSQL, secure production auth, leases/idempotency, full 30-level progression, accessibility/device testing and classroom evidence remain incomplete.

## 2026-09-19 | PA-01 | CLAIM | Product / Architecture

Goal: audit the handoff-only repository, freeze the initial workspace and contract boundary, and unblock the mathematical engine. Owned paths: root manifests, shared contracts, engine/config boundaries, coordination documents and implementation plan. Dependencies: specification and contract v1.0.

## 2026-09-19 | GL-02 | CLAIM / HANDOFF | Game Logic / Adaptive Learning

Goal and scope: replace Level 1's placeholder fixed target list with frozen configuration-backed difficulty bands; persist the issued band so an order cannot mutate after issuance.

Owned paths: `packages/config/`, `packages/contracts/`, `packages/game-engine/`, `apps/server/`, `apps/web/`, `tests/unit/`.

Changes and observed results: Level 1 retains the specified five-place coverage (ones, tens, hundreds, ones, tens). Easy uses digits 1–3, medium 4–6, hard 7–9; the server derives only the next order's band from mathematical outcomes and never from time. Every active order stores its selected band. `npm test` passed 30 tests; `npx tsc --noEmit` and `npm run build` passed. API verification issued `{target:3, band:'easy', skill:'pv.ones'}` and, after a correct shipment, `{nextTarget:50, nextBand:'medium', nextSkill:'pv.tens'}`.

Evidence level: logic verified and API integrated for Level 1 bands. All later stages, full mastery history, practice scheduling and 30-level progression remain incomplete.

## 2026-09-19 | GL-03 / BE-02 / FE-02 | CLAIM | Progression foundation

Goal: move all 30 baseline levels into immutable configuration, issue level-specific orders from the server, and expose committed unlock state in the map. Owned paths: `packages/config/`, `packages/game-engine/`, `apps/server/`, `apps/web/`, `tests/`. Dependencies: contract v1.0 and the verified Level 1 band work. Acceptance scope: MAP-01, ORDER-01..05, ADAPT-01/04; advanced UI objectives remain separately gated.

## 2026-09-19 | GL-03 / BE-02 / FE-02 | UPDATE | Progression foundation

Changes: all 30 level metadata records are now immutable configuration with zone, stage, mode and primary skill. The server map uses committed completion to expose only the next level; the server issues level-specific deterministic orders and persists every issued order. A generator-wide test validates a whole-crate witness for each of 150 level/slot combinations.

Commands/results: `npm test` passed 31 tests; `npx tsc --noEmit` and `npm run build` passed.

Evidence: configuration and order generation are logic verified; map unlocking is server-integrated. The frontend has not yet implemented second-representation, repack or advanced-objective controls, so Stage 6 is not yet playable through the UI.

## 2026-09-20 | BE-02a | CLAIM | Backend / Data

Timestamp (UTC): 2026-09-20T15:04:20Z

Goal and scope: add contract-aligned command idempotency, optimistic revision checks, and a bounded writer lease to the fictional-data API. This is a development persistence safety slice only; PostgreSQL migrations remain a separate, required production task.

Owned paths: `apps/server/src/index.ts`, `tests/integration/`, `TASK_LOG.md`.

Dependencies and contract version: contract v1.0; existing immutable order generation.

Acceptance IDs: RECOVERY-01, RECOVERY-02, RECOVERY-04, TECH-03 (partial, fictional-data adapter).

Expected outputs: actor-scoped duplicate-command receipts, revision and lease conflict responses, repeatable integration checks, and an honest handoff record.

## 2026-09-20 | BE-02a / FE-02a | UPDATE / HANDOFF | Backend / Data + Frontend / Game UX

Goal and scope: implemented a contract-shaped development safety slice over the existing fictional JSON adapter and connected the active game screen to it.

Owned paths: `apps/server/src/index.ts`, `apps/web/src/main.tsx`, `tests/integration/idempotency.test.ts`, `TASK_LOG.md`, `PROJECT_STATUS.md`.

Changes and artifacts: server-created attempts now carry a revision, lease epoch, writer tab ID, expiry, and actor-scoped response receipts. Shipment commands require `commandId`, `expectedRevision`, `leaseEpoch`, `tabId`, and a matching `Idempotency-Key`; exact retries replay the original response, while altered keys, stale revisions, and second active writers receive typed conflicts. The game UI generates these command fields, exposes a saving state, and retains the editable draft after a failed save. The API server is now constructible for isolated integration tests instead of listening on import.

Commands/manual checks and observed results: `npx tsc --noEmit` passed; `npm test` passed 33 tests (31 mathematical unit tests and 2 command-safety integration tests); `npm run build` passed.

Evidence level: narrow fictional-data flow integrated.

Remaining risks or blockers: JSON read/write is not transactional or multi-process safe; PostgreSQL migrations, database rollback tests, lease heartbeat/takeover routes, persistent browser outbox/retry, CSRF/session hardening, and browser E2E remain NOT RUN. This does not satisfy production persistence requirements.

Next owner / reviewer: BE-02 PostgreSQL persistence and QA recovery review; then FE-02 durable outbox/reconciliation.

## 2026-09-20 | GL-03a | CLAIM | Game Logic / Adaptive Learning

Timestamp (UTC): 2026-09-20T15:16:18Z

Goal and scope: implement pure, deterministic evidence scoring, mastery summaries, adaptive difficulty selection, and bounded scaffolding rules without persistence or UI changes.

Owned paths: `packages/game-engine/src/index.ts`, `tests/unit/`, `TASK_LOG.md`, `PROJECT_STATUS.md`.

Dependencies and contract version: immutable level/order configuration and contract v1.0; no contract-field change proposed.

Acceptance IDs: ADAPT-01..04, ADAPT-06, REWARD-01, EFF-02 (logic portion).

Expected outputs: policy fixtures proving timing parity, sample/diversity gates, score precedence, difficulty selection, and scaffolding exit behavior.

## 2026-09-20 | GL-03a | HANDOFF | Game Logic / Adaptive Learning

Changes and artifacts: added pure evidence score precedence, independent-first classification, rolling 24-hour signature deduplication, weighted 12-record mastery summaries, secure sample/independence/diversity gates, staleness as a scheduling flag, difficulty selection, and three-order per-skill scaffolding with a two-success exit.

Commands/manual checks and observed results: `npx tsc --noEmit` passed; `npm test` passed 37 tests (35 unit and 2 integration).

Evidence level: logic verified.

Remaining risks or blockers: evidence is not yet persisted or applied to issued orders, progression gates and practice scheduling are not wired into the server/UI, and teacher reports do not yet read these summaries.

Next owner / reviewer: BE-03 persists evidence atomically; GL-03b integrates adaptation and gate selection into issued orders.

## 2026-09-20 | BE-03 / GL-03b | CLAIM | Backend / Data + Game Logic / Adaptive Learning

Timestamp (UTC): 2026-09-20T15:19:51Z

Goal and scope: introduce the PostgreSQL schema/repository boundary for durable attempts, orders, responses, receipts, and evidence; apply committed evidence to adaptive issuance in the server where the database adapter is configured.

Owned paths: `apps/server/`, `db/migrations/`, root manifests/lockfile, `tests/integration/`, `TASK_LOG.md`, `PROJECT_STATUS.md`.

Dependencies and contract version: contract v1.0 and GL-03a policy; PostgreSQL service unavailable locally at claim time.

Acceptance IDs: DATA-01..04, ADAPT-01..05, TECH-02 (partial).

Expected outputs: forward migration, parameterized repository, explicit database configuration path, and tests that retain fictional-data evidence limitations honestly.

## 2026-09-20 | BE-03a | HANDOFF | Backend / Data

Changes and artifacts: added a forward PostgreSQL migration for profiles, attempts, immutable orders, responses, actor-scoped command receipts, and per-order skill evidence. Added a parameterized repository that locks the attempt row, checks the receipt before the revision, inserts a response/evidence record, advances the order state, and writes the receipt in one serializable transaction. Added an idempotent migration runner and documented `DATABASE_URL` setup.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (37 tests), and `npm run build` passed. `psql` and Docker are unavailable in this workspace, so `npm run db:migrate --workspace=@place-value-factory/server` is NOT RUN against a database.

Evidence level: schema/repository implementation verified by type-check only; database integration NOT RUN.

Remaining risks or blockers: the active API remains on its fictional JSON adapter until the PostgreSQL repository is fully selected at runtime and exercised against a real database. No migration, rollback, serialization-conflict, or cross-process test evidence exists yet.

Next owner / reviewer: provision a disposable PostgreSQL database, run/apply the migration, switch API persistence behind the repository boundary, and run DATA-01..04 integration tests.

## 2026-09-20 | BE-03 / GL-03b | UPDATE | Backend / Data + Game Logic / Adaptive Learning

Changes and artifacts: added PostgreSQL-compatible integration coverage that applies the real forward migration, persists a validated response with its receipt and evidence in one transaction, safely replays the receipt, and reloads the stored evidence through the mastery summarizer.

Commands/manual checks and observed results: `npx tsc --noEmit` passed; `npm test` passed 38 tests including the new PostgreSQL-compatible repository test.

Evidence level: database-path integration verified against pg-mem; real PostgreSQL server verification remains NOT RUN.

## 2026-09-20 | GL-03b | HANDOFF | Game Logic / Adaptive Learning

Changes and artifacts: active API attempts now record a deterministic evidence event only upon accepted resolution and derive the next issued order's band from the next primary skill's mastery summary. Issued order specs remain immutable, and no elapsed-time field enters the policy.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (38 tests), and `npm run build` passed.

Evidence level: fictional API integrated; PostgreSQL runtime selection and progression/practice gates remain incomplete.

## 2026-09-20 | GL-03c | CLAIM | Game Logic / Adaptive Learning

Goal and scope: add pure stage-gate evaluation and deterministic next-practice skill selection based on persisted-style mastery evidence.

Owned paths: `packages/config/`, `packages/game-engine/`, `tests/unit/`, `TASK_LOG.md`, `PROJECT_STATUS.md`.

Dependencies and contract version: GL-03a evidence policy; contract v1.0 unchanged.

Acceptance IDs: ADAPT-06, MAP-01 (gate logic portion), PROGRESS-01 (policy portion).

## 2026-09-20 | GL-03c | HANDOFF | Game Logic / Adaptive Learning

Changes and artifacts: added stage-specific secure-evidence gates and deterministic practice-target selection that prioritizes unknown, then lower-scoring prerequisites. Fixtures prove a completed-path-like evidence subset does not satisfy a stage gate and that all required secure skills do.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (39 tests), and `npm run build` passed.

Evidence level: logic verified. Server map/practice routes still need to consume these functions.

## 2026-09-20 | GL-03c / BE-03 | UPDATE | Game Logic / Backend

Changes and artifacts: active map and attempt-start decisions now apply the stage-evidence gates. A completed prior level alone cannot unlock the first level of a new stage; the map instead reports that practice of required skills is needed.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (39 tests), and `npm run build` passed.

Evidence level: fictional API integrated. Practice-attempt route/UI remains incomplete.

## 2026-09-20 | BE-03 / FE-03 | HANDOFF | Backend / Data + Frontend / Game UX

Changes and artifacts: added the student progress API, returning per-skill mastery summaries, completed levels, and the deterministic next practice skill. The map fetches and displays that recommendation alongside mastery-gated level availability.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (39 tests), and `npm run build` passed.

Evidence level: fictional API/UI integrated.

Remaining risks or blockers: the recommendation does not yet start a dedicated practice attempt, and PostgreSQL is not the active runtime store.

## 2026-09-20 | GL-03c / BE-03 / FE-03 | UPDATE | Practice flow

Changes and artifacts: practice recommendation now starts a `practice` attempt. The server selects the deterministic focus skill, issues five orders retaining that skill, and adapts only their difficulty band from committed evidence. The map supplies the practice action.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (39 tests), and `npm run build` passed.

Evidence level: fictional API/UI integrated; browser E2E and PostgreSQL runtime persistence NOT RUN.

## 2026-09-20 | FE-02b | UPDATE | Recovery foundation

Changes and artifacts: browser stores a profile/order-scoped draft and one pending shipment before send, removes it only after the server acknowledgement, and restores only a matching active-order draft. No credentials or session token are stored.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (39 tests), and `npm run build` passed.

Evidence level: build-verified client recovery foundation; browser refresh/drop-reply E2E NOT RUN.

## 2026-09-20 | FE-02c | UPDATE | Pending-command reconciliation

Changes and artifacts: matching restored orders now replay one stored pending shipment with its original command ID, revision, lease epoch, tab ID, vectors, and idempotency key. A successful receipt replay replaces the local snapshot; an unavailable connection leaves the pending payload intact.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (39 tests), and `npm run build` passed.

Evidence level: build-verified; browser drop-reply E2E NOT RUN.

## 2026-09-20 | BE-02c / FE-02d | UPDATE | Lease heartbeat

Changes and artifacts: added idempotent lease-heartbeat endpoint and active-tab heartbeat scheduling. Heartbeats renew the writer expiry without incrementing educational revision; stale revision, epoch, and tab ownership remain rejected.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (39 tests), and `npm run build` passed.

Evidence level: fictional API/UI integrated; multi-tab browser E2E NOT RUN.

## 2026-09-20 | BE-02d | UPDATE | Lease takeover

Changes and artifacts: added an explicit idempotent lease-takeover route. The new writer receives a fresh epoch and revision; old-epoch response commands are rejected as `LEASE_LOST`. Added integration coverage for takeover and stale writer rejection.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (40 tests), and `npm run build` passed.

Evidence level: fictional API integration verified; takeover UI and browser two-tab E2E NOT RUN.

## 2026-09-20 | FE-02e | UPDATE | Takeover UI

Changes and artifacts: formatted the game component with project Prettier and added a conditional Take over this attempt control. It appears only when the current snapshot names another writer tab and reconciles the returned takeover snapshot.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (40 tests), and `npm run build` passed.

Evidence level: API/UI integrated; actual two-tab browser E2E NOT RUN.

## 2026-09-20 | BE-02e | UPDATE | Pause/resume state

Changes and artifacts: attempts now carry an explicit active/paused/completed state. Added idempotent pause and resume routes protected by revision and lease checks; paused attempts cannot accept a shipment response.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (40 tests), and `npm run build` passed.

Evidence level: fictional API integrated; pause/resume UI and E2E remain next.

## 2026-09-20 | FE-02f | UPDATE | Pause/resume UI

Changes and artifacts: game UI can pause a mission through the server transition, return to the map, show a saved paused state, and resume the same server-owned order without discarding the local draft.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (40 tests), and `npm run build` passed.

Evidence level: fictional API/UI integrated; browser E2E NOT RUN.

## 2026-09-20 | BE-03d | UPDATE | Skip and replacement orders

Changes and artifacts: added an idempotent skip route that requires two persisted unsuccessful mathematical responses, records zero evidence, and issues a deterministic replacement for the same slot rather than advancing completion.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (40 tests), and `npm run build` passed.

Evidence level: fictional API implementation verified by existing suite; dedicated skip integration/UI remain next.

## 2026-09-20 | BE-03d | CORRECTION | Backend / Data

The preceding skip/replacement entry was logged before final source verification. The route implementation was not present in the committed tree and must be reimplemented with dedicated integration coverage. No skip/replacement feature is claimed by commit `6a8c8c0`.

## 2026-09-20 | BE-03d | HANDOFF | Skip and replacement orders

Changes and artifacts: reimplemented the skip route and added integration coverage for premature rejection, two saved misses, zero-evidence skip, same-slot replacement, and no fabricated shipment progress.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm test` (41 tests), and `npm run build` passed.

Evidence level: fictional API integrated. Student Skip UI and browser E2E remain incomplete.

## 2026-09-20 | FE-04a | CLAIM | Frontend / Game UX

Timestamp (UTC): 2026-09-20T15:29:49Z

Goal and scope: make existing generated restricted, minimum, two-way, and renaming orders playable through semantic controls, including unavailable-machine states and non-drag exchange.

Owned paths: `apps/web/src/main.tsx`, `apps/web/src/styles.css`, `TASK_LOG.md`, `PROJECT_STATUS.md`.

Dependencies and contract version: contract v1.0; existing order flags and validator.

Acceptance IDs: GAME-03, GAME-05, GAME-07, DESIGN-02, DESIGN-03 (partial), ORDER-05 UI binding.

Expected outputs: dynamic objective/restriction copy, disabled controls, accessible exchange, and a second editable representation for two-way orders.

## 2026-09-20 | FE-04a | HANDOFF | Frontend / Game UX

Changes and artifacts: UI objective text now follows the issued order flags; unavailable machines are visibly and semantically disabled; students can exchange one crate for ten adjacent smaller crates through a labelled button; and two-way orders submit two independently editable vectors.

Commands/manual checks and observed results: `npx tsc --noEmit`, `npm run build`, and `npm test` passed (37 tests).

Evidence level: integrated with the fictional API flags; browser E2E and assistive-technology checks NOT RUN.

Remaining risks or blockers: repack source decompositions, undo for Representation B, hint/pause dialogs, keyboard/device verification, and all browser fault recovery remain incomplete.

## 2026-09-22 | FE-05 | CLAIM | Original Art and Visual Experience Integration

Timestamp (UTC): 2026-09-22T16:00:00Z

Goal and scope: integrate the supplied original `art-v1` mascot, zone, prop and effect pack across the live student, teacher and deterministic gallery surfaces; preserve semantic controls and game behavior; add calm/busy/reduced-motion presentation and visual verification.

Owned paths: `apps/web/src/components/`, `apps/web/src/screens/`, `apps/web/src/styles.css`, `apps/web/public/assets/`, `tests/e2e/`, `docs/ASSET_MANIFEST.md`, `docs/VISUAL_STATE_GALLERY.md`, `PROJECT_STATUS.md`, `TASK_LOG.md`.

Dependencies and contract version: existing UI contract v1.0; `docs/ARTWORK_HANDOFF.md`; no API or game-rule change.

Acceptance IDs: DESIGN-01..05, GAME-02 visual layer, A11Y-01 visual review, ART-V1 milestone exit criteria.

Expected outputs: reusable pose/scenery presentation, five live map zone compositions, finished gallery states, responsive/reduced-motion checks, screenshot evidence and a scoped commit.

## 2026-09-22 | FE-05 | HANDOFF | Original Art and Visual Experience Integration

Changes and artifacts: integrated `art-v1` via reusable `FactoryArt`, `Mascot` and busy-scenery components; mapped all six mascot poses to live entry, instruction, help, feedback and result states; added five map-zone building compositions and zone cosmetics; added calm/busy presentation, contained animation and reduced-motion equivalents; expanded the deterministic map fixture to all zones; added asset/gallery/reflow browser checks; captured map, busy gameplay and results evidence in `docs/visual-evidence/`; documented provenance and presentation behavior in the visual records.

Commands/manual checks and observed results: `npm test` passed (46 tests); `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `npm run test:e2e` passed (7 Chromium journeys). Browser evidence includes all gallery fixtures, image dimensions, busy/reduced-state treatment, desktop, 768px tablet and 390px narrow overflow checks; keyboard help-dialog flow and existing recovery/results refresh journeys remained passing.

Evidence level: integrated local fictional-data visual system. The full PNG design references and final browser captures were visually inspected.

Remaining risks or blockers: final owner aesthetic approval plus manual screen-reader, zoom and representative-device review; production identity/data/hosting prerequisites are outside this local art scope. `apps/server/db/local-development.json` contains user/test-session data and is deliberately excluded from this milestone.

Next owner / reviewer: owner visual review of `docs/visual-evidence/art-v1-map.png`, `art-v1-busy-game.png` and `art-v1-results.png`.

## 2026-09-22 | FE-06 | CLAIM | Handoff-Faithful Gameplay and Visual Acceptance

Timestamp (UTC): 2026-09-22T20:25:00Z

Goal and scope: rebuild the game workspace, machines, map rewards and child-facing language against the four original references; maintain deterministic/accessible behavior and capture stable browser evidence.

Owned paths: `apps/web/src/`, `tests/e2e/`, `docs/`, `PROJECT_STATUS.md`, `TASK_LOG.md`.

Dependencies and contract version: UI contract v1.0, `df2b048`, original design PNG references and existing `art-v1` pack; no game or API contract change.

Acceptance IDs: DESIGN-01..05, GAME-02..07 visual usability, MAP-01..03 UI, RESULT-01..03 UI, ACCESS-01..07 local evidence.

## 2026-09-22 | FE-06 | HANDOFF | Handoff-Faithful Gameplay and Visual Acceptance

Changes and artifacts: rebuilt the live game workspace around a compact current-order/guide/monitor/machine/shipping hierarchy; formed each semantic machine with CSS pipe, hopper and crate-state elements; reduced permanent help to a header trigger; kept all order modes and direct inputs intact; translated student-facing skill and result language; hid zone cosmetics until zone completion; added route styling and stable image-ready deterministic screenshot comparisons.

Commands/manual checks and observed results: inspected all four supplied reference PNGs at original size and reviewed regenerated desktop map/calm gameplay/results baselines. `npm test` passed (46 tests), `npx tsc --noEmit`, `npm run build`, `npm run test:e2e` (7 journeys before baseline addition), `npx playwright test -g handoff-faithful --update-snapshots` (1 baseline journey), and `git diff --check` passed. Existing browser journeys exercise keyboard help focus/Escape, correction preservation, results refresh, storage failure, takeover and drop-after-commit recovery.

Evidence level: integrated fictional-data UI with reviewed deterministic browser captures. Manual screen-reader, 200% zoom and physical-device/touch checks are NOT RUN.

Remaining risks or blockers: final owner visual approval; external production identity/data/hosting and classroom-device evidence. Local-development database remains excluded.

## 2026-09-22 | PA/BE/FE-07 | CLAIM | Secure Classroom Pilot Readiness

Timestamp (UTC): 2026-09-22T20:36:00Z

Goal and scope: verify and close visual acceptance defects, real PostgreSQL runtime persistence, secure class/roster lifecycle and fictional teacher–student pilot journey without touching local user data.

Owned paths: `apps/server/`, `apps/web/`, `db/`, `tests/`, `docs/`, `PROJECT_STATUS.md`, `TASK_LOG.md`.

Dependencies and contract version: contract v1.0, current fictional-data adapter, supplied art pack; PostgreSQL credential/service access required for real runtime proof.

Acceptance IDs: DATA-01..04, SEC-01..03, ROSTER-01..02, RECOVERY-01..07, DESIGN-01..05, ACCESS-01..07.

## 2026-09-22 | PA/BE/FE-07 | BLOCKED | Secure Classroom Pilot Readiness

Observed blocker: `DATABASE_URL` is unset. A PostgreSQL socket exists, but `psql` as the workspace user fails because role `owner` does not exist, and `psql -U postgres` fails peer authentication. Docker is unavailable. The active application is still the JSON fictional-development adapter; its PostgreSQL repository is not selected by runtime configuration. This prevents the required real PostgreSQL migration, persistence, rollback and concurrency verification without an authorized disposable database role/URL.

Completed independent verification: re-read repository/design/runtime instructions; inspected the four original design references; verified current source uses real semantic game controls and screened current visual evidence; confirmed the PostgreSQL repository/migration and local roster/access endpoints exist but are not sufficient real-runtime evidence. The previously committed visual acceptance suite remains available; no local-development database change was made or staged.

Smallest required action: provide an authorized disposable PostgreSQL connection string (or a workspace-owned database role/database) suitable for fictional test data, plus confirmation that it may be migrated. No production or school data is requested.
