# Task log

Append-only after initial handoff. Corrections are new dated entries; never rewrite old outcomes. Claim template and workflow are in AGENTS.md.

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
