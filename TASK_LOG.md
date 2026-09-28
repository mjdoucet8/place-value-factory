# Task log

## 2026-09-26 | RC07-RESUME-2 | CLAIM / UPDATE | PA integration

Re-read the full attached closure brief and current dirty worktree; previous checkpoint supplied audit artifacts (progress), not completion. Current `npm test`: 59 passed, 5 real-database tests skipped outside their harness. Original specification is in the handoff subdirectory; root docs reference is stale.

Owned scopes: main owns shared records/contracts and integration; `math_audit` read-only config/engine/150-slot audit; `runtime_audit` read-only server/persistence/report review; `pg_journey` owns only `tests/integration/rc07-progression-real.test.ts` and `scripts/test-postgres.mjs` for an actual stage/practice/gate/transfer/restart journey. Earlier identically scoped claims have no live workers in this session. Preserve all pre-existing changes and local-development.json. Contract v1.0; acceptance ORDER/VALIDATE/ADAPT/REWARD/EFF plus scoped progression/report/data/recovery. Next: fix concrete audit gaps, verify the disposable database journey, then reconcile acceptance evidence. RC-07 remains incomplete.

## 2026-09-23 | RC-07 | CLAIM | V1 mathematics and progression audit

GL/BE/QA owns `packages/config/src/`, `packages/game-engine/src/`, server issuance/progression in `apps/server/src/`, mathematical fixtures and related tests; PA coordinates status/contract decisions. Acceptance ORDER-01..05, VALIDATE-01..05, ADAPT-01..06, REWARD-01..03, EFF-01..02, MAP/PROGRESS gates. Compare all thirty five-slot blueprints, independent witnesses, varied stored seeds, primary-skill evidence, practice scheduling, stage gates, persistent certifications, stars and reporting against the original V1 specification. Preserve immutable issued specs and existing completed attempts; verify on actual HTTP/PostgreSQL, then continue to reports/operations.

## 2026-09-23 | RC-06 | HANDOFF / REVIEW | IndexedDB response and support recovery

The browser now persists one immutable answer or help command per student attempt in IndexedDB before transmission, retries its key/payload on refresh and online recovery, and removes it only after server acknowledgment. UI distinguishes waiting work from confirmed progress; unavailable IndexedDB falls back to direct send with an explicit warning. Cross-tab stale work is not merged: a conflicting command is checked against the server receipt, then an explicit takeover restores quantities for review before a new command. An expired lease rejects another tab; same-tab resume increments the epoch. Browser fixture server resets only its own newly created `/tmp` store between cases. Observed: `npm test` 49 passed (5 real-DB cases skipped outside harness), `npm run test:postgres` 5 passed plus 2 post-restart passed, `npm run test:e2e` 13 passed, secure pilot Chromium 4 passed; typecheck/build/diff checks passed. The secure pilot tested before-commit, intermediate after-commit and final-result dropped replies, followed by a five-order teacher count and access revocation. Evidence level: integrated fictional-data browser/API/real-PostgreSQL. Remaining local work: full recovery acceptance audit and math/report/operations queue; no classroom approval claimed.

## 2026-09-23 | RC-06 | CLAIM | Durable pending-command reconciliation

FE/BE/QA owns `apps/web/src/outbox.ts`, game orchestration in `apps/web/src/main.tsx`, necessary server lease reconciliation and focused browser/integration tests; PA coordinates contract/status notes. Dependency: secure pilot and RC-05 reviewed UI. Acceptance RECOVERY-01..07 and HELP-01..02. Store one immutable response/support command per active attempt in IndexedDB before transmission, replay the same key and payload after refresh, distinguish pending from committed state, and refuse cross-student or conflicting local replay. Test before-commit and after-commit disconnects, refresh, stale writer and storage failure against actual HTTP/PostgreSQL. Preserve user JSON data and existing receipts.

## 2026-09-23 | RC-05 | HANDOFF / REVIEW | Factory composition and visual gallery

FE/QA edited web screens/components/styles, shared additive map summary response, deterministic fixtures, browser suites and reviewed screenshots. Desktop gameplay has one CURRENT ORDER, a live packing monitor, six machine controls and Ship in one workbench; 1024px landscape uses the same compact row and narrow screens scroll. Map shows five illustrated zones, 30 live nodes, keyboard list, authoritative status and completed-only cosmetics. Results celebration layering and reward copy were corrected. Browser E2E now uses a fresh private fictional store instead of clearing a shared file. `npm test` 48 passed; typecheck/build passed; real PostgreSQL 5+2 restart checks passed; standard Chromium 8 passed; secure-pilot Chromium 4 passed. Reviewed 1366, 1024, 768 and 390 captures; 320 reflow was automated. Native browser zoom, physical devices, manual screen reader and owner aesthetic approval are NOT RUN. Evidence: reviewed files in `docs/visual-evidence/`, baseline PNGs and `docs/QA_EVIDENCE.md`. Remaining local work begins with durable IndexedDB outbox, lease recovery and V1 math/report/operations audit; this handoff is not full release completion.

## 2026-09-23 | RC-04 | UPDATE | Secure local HTTP and browser journey verified

Added database-backed local identities, salted scrypt credentials, random hashed session tokens, idle/absolute expiry, origin/CSRF enforcement, login backoff, class ownership, issuance/reset/revocation and class access control. PIN receipts are encrypted with a separate runtime key and redisplayable for five minutes. Browser transport uses cookies/CSRF and actual principal IDs. Teacher forms manage classes/student access. Real database suite passed five cases plus two post-restart checks. Chromium pilot journey passed actual PostgreSQL class creation, five answers, refreshed results, matching teacher count and revocation with no page errors. Launcher issues found and fixed: space-containing paths, hard-coded Vite CLI port and child-process shutdown ownership. Private temporary credentials are not committed. Inspected screenshots still show visual defects; they are not accepted baselines. Full release remains incomplete.

## 2026-09-23 | RC-05 | CLAIM | Inspected visual acceptance closure

FE/QA owns web screens/components/styles, gallery fixtures/browser tests and visual evidence documents. Four original PNGs reread at full size and secure-pilot screenshots inspected. Fix oversized sticky header, crate/exchange overlap, connected 30-node illustrated route/list and celebration background/layers. Reuse artwork; preserve semantics, mathematics, earned cosmetics and calm/reduced motion. Acceptance GAME/DESIGN/MAP/RESULT/ACCESS; owner aesthetic approval remains pending.

## 2026-09-23 | RC-04 | CLAIM | Secure local identity and classroom lifecycle

BE/PA owns server identity module, forward migration, server authentication/authorization integration, security integration tests, shared API notes and setup records. Baseline: specification section 21 local hashed-credential adapter and existing API v1 routes, not invented school SSO. No external accounts or real users. Complete server-owned expiring sessions, origin/CSRF checks, account throttling, teacher-owned classes, student issuance/reset/revocation and two-teacher isolation. External school provider remains a deployment gate after local adapter verification. Authentication skill's hosted provisioning is not applicable within authorized local-only scope; use maintained Node crypto and database sessions, no new paid service.

## 2026-09-23 | RC-03 | UPDATE | Actual PostgreSQL HTTP journey

Added normalized runtime SQL storage for profiles/settings/access flags, attempts, orders, responses, support events, evidence and command receipts; configured PostgreSQL failures never fall back to JSON. API replies wait for commit. A correctness-first cross-process transaction lock prevents lost updates pending scoped concurrency optimization. New issued IDs are attempt-scoped; persisted legacy IDs remain unchanged. First-response command IDs and active duration are retained, and start receipts replay even after completion. Pilot/production mode refuses the current development identity shortcuts.

Observed: real PostgreSQL tests pass four cases, including the actual HTTP five-order journey, six concurrent identical requests, injected write failure returning 503 with zero partial writes, populated upgrade, ownership and lease races. After a real database restart, both repository and live HTTP results/report checks pass. `npm test`: 47 passed, four dedicated PostgreSQL cases skipped outside harness; type checking passed. Full security/roster and browser verification still pending; no release completion claimed. Next: secure adapter and lifecycle, then scoped runtime load/operations and remaining V1 queue.

## 2026-09-23 | RC-02 | HANDOFF / REVIEW | Repository integrity verified

Composite attempt/order/evidence ownership now rejects mismatched students at the database boundary. A populated migration-001 schema upgrades with order ownership backfilled and evidence unchanged. Expired or foreign response writers are rejected. Explicit transactional heartbeat, same-tab resume after expiry, and takeover use actor-scoped receipts; six concurrent identical takeovers cause one transition and five replays. Heartbeat preserves game revision; reacquisition/takeover advance epochs. Real PostgreSQL tests passed (three cases before restart, durable-response case after restart); existing 46 unit/integration tests and type checking passed. This is repository-level evidence only, not runtime/security completion. Next: RC-03 actual runtime persistence, starting with collision-free issued order identity and explicit evidence ownership.

## 2026-09-23 | RC-03 | CLAIM | Runtime persistence prerequisites and integration

BE/PA editor owns `apps/server/src/`, database migrations, integration tests and coordinated records. Dependencies: verified RC-01/02 PostgreSQL harness and repository; API v1.0 opaque order IDs unchanged. Acceptance: DATA-01..04, SEC-01, RECOVERY-01..07. Audit found deterministic generator IDs reused across attempts and students: assign runtime-issued order IDs without changing mathematical generation, retain exact evidence-to-order links, then persist normalized runtime entities transactionally. Preserve existing issued orders and the user's development JSON file. Runtime security remains incomplete until authenticated identity/session work is verified.

## 2026-09-23 | RC-02 | CLAIM | Database ownership and lease integrity

Owns `db/migrations/002_ownership_integrity.sql`, `apps/server/src/postgres.ts`, real database tests and acceptance records. Dependencies: RC-01 isolated PostgreSQL harness; API v1.0 unchanged. Acceptance: DATA-02, RECOVERY-04, SEC-01. Add composite ownership constraints with prior-schema upgrade coverage; reject expired/foreign writers and verify explicit lease transitions before runtime integration. Existing user JSON data excluded.

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

## 2026-09-26 | RC07-AUDIT | CLAIM | PA integration
Goal: finish the full RC-07 brief against authoritative specification and preserve all existing dirty work, especially local-development.json.
Owned paths: shared documentation and integration coordination; delegated scopes recorded below. Contract v1.0.
Acceptance: ORDER/VALIDATE/ADAPT/REWARD/EFF and mathematical progression/report/recovery portions.
Starting evidence: brief and current records inspected; canonical specification located in Place_Value_Factory_Codex_Handoff/Math_Factory/docs/ (root docs reference is stale). Prior baseline remains unverified in this continuation.
Delegation: RC07-BLUEPRINT owns new docs/RC07_BLUEPRINT_LEDGER.md only; RC07-ENGINE read-only engine audit; RC07-SERVER read-only server/persistence/report audit. No overlapping writes. Main owns log/status/contracts and subsequent integration.
Next: build independent 150-slot ledger, identify concrete gaps, implement and verify in dependency order. No completion claim.
RC07-JOURNEY additional QA claim: worker owns tests/integration/rc07-progression-real.test.ts and scripts/test-postgres.mjs only; add real HTTP stage/practice/gate/restricted/transfer/restart evidence using disposable harness, no fabricated progression. Dependencies existing engine/server contract v1; failures are evidence for integration fixes.

## 2026-09-26 | RC07-CONTINUE | UPDATE | PA integration
Current worktree revalidated against the full attached RC-07 brief; earlier turn produced the blueprint ledger and audit claims (progress), but completion is unproven. Canonical specification remains under `Place_Value_Factory_Codex_Handoff/Math_Factory/docs/`.
Active bounded scopes: `engine_audit` (Luna explorer), read-only engine/config/math audit; `server_audit` (Sol reviewer), read-only server/persistence/progression/report review; `pg_journey` (Luna worker), only `tests/integration/rc07-progression-real.test.ts` and `scripts/test-postgres.mjs`, actual HTTP stage/practice/transfer/restart journey. Main owns shared records/contracts and integration. Preserve all dirty files, particularly local-development.json. No completion claim; next action is close review findings and run the real harness.
RC07-GL CLAIM: `engine_fix` owns packages/game-engine/src/index.ts, packages/config/src/index.ts, tests/unit/math.test.ts, tests/unit/rc07-blueprints.test.ts. Scope deterministic validated generation/fallback, independent 150-slot evidence, practice scheduler helpers, mastery/scaffold; dependencies v1 written rules. Main owns server consumers and contract integration; explorer remains read-only.
RC07-BE CLAIM: `server_fix` owns apps/server/src/index.ts, apps/server/src/runtime-store.ts, db/migrations/008_rc07_integrity.sql, tests/integration/rc07-integrity.test.ts. Scope authoritative progression, six stage certifications, practice/scaffolding consumers, transfer/replay/recovery and durable issuance. `server_audit` completed read-only review; implementation assigned from its findings. Main owns new apps/server/src/reporting.ts and tests/unit/reporting.test.ts for exact report reconstruction, time windows, pending/no-evidence and transfer separation, plus shared contracts. No write overlap.

## 2026-09-26 | RC-07 | HANDOFF / REVIEW / DONE | PA, GL, BE, FE, QA sequential integration

Timestamp (UTC): 2026-09-26T19:08:14Z
Goal and scope: complete verified six-stage progression and trustworthy teacher evidence for the local fictional-data RC-07 checkpoint.
Owned paths: game engine/config, server persistence/report routes, contracts, teacher screens, forward migrations 005–008, scoped tests, and evidence documentation. No parallel agents or active overlapping writers in this continuation.
Dependencies and contract version: additive v1.0; no accepted mathematical rule changed. Migrations are forward-only and historical issued specs remain stored.
Acceptance IDs: ORDER-01..05, VALIDATE-01..05, ADAPT-01..06, REWARD-01..03, REPORT-01..04, scoped DATA/SEC/RECOVERY, six stage gates and Factory Master.
Changes and artifacts: resolved attempt status/type mismatch and the secure-skill practice fixture; verified 150 slots across bands and a validated fallback inventory; persisted fixed practice schedules and issued order snapshots; corrected late-stage practice range and Stage 6 after-level-30 selection; connected one report reconstruction module to authorized class/student routes and the teacher question/first/final-answer view. Removed the unused alternate report module after comparison. Added real PostgreSQL progression through all 30 levels with earned evidence, nonminimal restricted acceptance, advanced correction, Stage 6 remediation, certification/reward and restart checks. Class-local reporting, transfer exclusion, no-evidence, pending/correction and cross-class authorization have focused fixtures and HTTP checks.
Commands/manual checks and observed results: `npm test` 69 passed, 6 dedicated-PostgreSQL cases skipped by design; `npx tsc --noEmit` passed; `npm run build` passed; `npm run test:postgres` passed 6 initial real-DB cases and 3 restart-phase cases (2 restart-inapplicable skipped); `npm run test:e2e` 13 passed; isolated secure-pilot Playwright suite 4 passed, then focused classroom rerun 1 passed after question drilldown; `git diff --check` passed. Inspected the teacher evidence browser capture. The pilot and PostgreSQL processes were stopped after verification.
Evidence level: integrated local fictional-data checkpoint. Classroom device/network/assistive-technology and school deployment are NOT RUN.
Remaining risks or blockers: full V1 operations work (guarded backup/restore, retention/deletion, class archive), session/network hardening, measured 90-student/30-concurrent load, remaining local accessibility/recovery audit, and external owner/school/device approval. No RC-07 milestone-blocking defect observed in the verified scope.
Next owner / reviewer: PA checkpoint commit; later V1 release-candidate owners for operations, load and external gates.

## 2026-09-26 | RC-07 | FINAL VERIFICATION UPDATE | PA integration

Timestamp (UTC): 2026-09-26T19:22:00Z
Additional closeout: place-value practice now validates its fallback inventory and relaxes recent-signature avoidance only after 100 candidates. Issued orders store attempt/slot/replacement/role/seed/version and forbidden/skill metadata; the restart journey compares an unanswered replay order with the immutable PostgreSQL spec and confirms the public snapshot omits the seed. Skip and subsequent practice issuance follow the saved per-slot schedule. The final post-change runs passed: `npm test` 69 passed (6 real-DB cases deliberately skipped by that command), `npm run test:postgres` 6 initial cases plus 3 restart-phase cases passed (2 restart-inapplicable skipped), `npm run test:e2e` 13 passed, isolated secure-pilot Playwright 4 passed, `npx tsc --noEmit` and `npm run build` passed. `git diff --check` passed before final staging; no classroom-device or school-network claim.

## 2026-09-26 | V1-OPS-01 | CLAIM | BE / PA

Timestamp (UTC): 2026-09-26. Goal: reconcile RC-07 against the original specification, then implement guarded PostgreSQL backup/restore, configurable fictional-data retention/deletion, class archive, and related evidence. Owned paths: `docs/V1_CURRENT_ACCEPTANCE.md`, new operations scripts/module, forward migration 009, `apps/server/src/identity.ts`, focused operations tests, operations guidance. Dependencies: RC-07 checkpoint `1a7c449`, contract v1; existing dirty documentation/test work remains owned by prior work and will be preserved. Acceptance: OPS-01..02, SEC-01..03 scoped to operations, DATA-01..04 restore. Expected outputs: executable guarded operations and a disposable restore/deletion demonstration. No parallel workers.

## 2026-09-26 | V1-OPS-01 | HANDOFF | BE / QA

Implemented teacher-owned class archive, hashed operations audit, guarded backup/restore into a distinct empty database, explicit-target deletion, archived-class retention with configured positive days, and expired-secret/session cleanup. Disposable PostgreSQL test completed five orders, restored immutable questions/answers, evidence, certification and attempt award fields to a separate database, archived/revoked access, deleted one student's dependent records, retained a second class, and removed expired secret ciphertext. `npm run test:postgres` passed seven initial tests and three restart-phase tests (two restart-inapplicable skipped); `npx tsc --noEmit` and `git diff --check` passed. Restore comparison currently covers SQL records and counts, not a fresh HTTP report on the target; this remains part of final acceptance. School retention values and backup expiry remain external policy decisions. Operations scripts cannot run without explicit connection settings/targets. The uncommitted local-development database remains untouched.

## 2026-09-26 | V1-SEC-01 | CLAIM | BE / QA

Goal: finish local session/network hardening and fail-safe configuration checks before classroom load. Owned paths: `apps/server/src/identity.ts`, `apps/server/src/index.ts`, `tests/integration/security-real.test.ts`, security guidance. Dependencies: operations archive and cleanup behavior, secure local identity boundary. Acceptance: SEC-01..03 and LOGIN-01..03 local scope. Expected output: bounded network failure ceiling that accommodates shared school IPs, expired/revoked session verification, and focused real PostgreSQL tests.

## 2026-09-26 | V1-SEC-01 | HANDOFF | BE / QA

Added a 300-failed-login/10-minute ceiling keyed by a hash of the server-observed network address, while retaining five-failure per-account throttling. Successful logins do not consume the shared ceiling; a new window resets it. The secure PostgreSQL test seeds the ceiling at its boundary and verifies a valid login is rejected until the window expires. Archive and PIN/session cleanup tests cover revocation and expiry. `npx tsc --noEmit` passed; the focused security test passed before the ceiling was raised from 120 to 300, and the final boundary rerun remains pending. School reverse-proxy deployment configuration and real network behavior remain external checks.

## 2026-09-26 | V1-PERF-01 | CLAIM | BE / QA

Goal: measure and resolve local 90-student/30-concurrent workload limitations using a private disposable PostgreSQL cluster. Owned paths: `tests/integration/load-real.test.ts`, `scripts/test-postgres.mjs`, `package.json`, performance records, and targeted server/store changes if measurements warrant. Dependencies: secure identity and operations checkpoint. Acceptance: PERF-01 local API scope, exact-once/isolation under load. Expected output: repeatable starts, answers, retries, teacher reports with p95/throughput/errors/contention evidence.

## 2026-09-26 | V1-PERF-01 | HANDOFF | BE / QA

The first measured run missed the 500 ms API target (start p95 1,641 ms; answer p95 2,552 ms; 2,792 advisory-lock wait samples). The runtime now writes only changed profiles/attempts and serves GETs from repeatable-read snapshots without the mutation lock; snapshot serialization retries are bounded. A subsequent overlapping-report load run passed: 90 fictional students, 30 concurrent, start p95 343 ms, answer p95 446 ms, retry p95 402 ms, report p95 65 ms, 88 req/s, zero errors, 609 lock-wait samples across 34 polls. The test verifies exactly 30 answers/receipts, retry body equality and three class-local final reports. See `docs/qa/CLASSROOM_LOAD_2026-09-26.md`. This is local API evidence only; browser input-to-display, Chromebook and school network remain unverified. Global mutation locking remains in place because the measured API target now passes and exactly-once behavior is preserved.

## 2026-09-26 | V1-RECOVERY-ACCESS-01 | CLAIM | QA / FE

Goal: audit remaining local recovery and accessibility criteria, add missing executable checks and fix defects. Owned paths: browser and integration tests, frontend screens/styles as needed, QA evidence docs. Dependencies: operations/security/performance changes above. Acceptance: RECOVERY-01..07 and ACCESS-01..07 local scope. External device/assistive-technology/network trials remain separate. Expected output: fault matrix, keyboard/focus/reflow/zoom/contrast/reduced-motion evidence, regression tests for defects.

## 2026-09-26 | V1-OPS-01 | UPDATE | BE / QA

Closed the restore/report and backup-expiry gaps after initial handoff. Backup archives now stream through AES-256-GCM under an explicit private key, authenticate before restore writes, and are tested with a wrong key against an unchanged empty target. Migration 010 records configured `backup_expiry_at` when deleting a student. The operations test starts the restored API and verifies the exact five-order teacher report, immutable SQL rows and certification state. No approved school duration is assumed; deletion execution requires both explicit target/database confirmation and a positive configured backup retention period. Latest `npm run test:postgres` rerun is in progress.

## 2026-09-26 | V1-LOCAL-01 | HANDOFF / REVIEW / DONE | PA / QA

Timestamp (UTC): 2026-09-26T20:26:31Z. Scope: final local V1 release-candidate integration and acceptance audit; contract v1. Owned paths: the V1 operations, security, runtime, frontend and test files named in the V1 claims above; shared docs and root test configuration coordinated by PA. Local evidence: `npm test` 71 passed with 8 dedicated PostgreSQL/load cases skipped in that command; `npm run test:postgres` 7 initial and 3 restart-phase cases passed with 2 restart-inapplicable skips; `npm run test:load` passed (90 fictional students, 30 concurrent, p95 start/answer/retry/report 343/450/405/67 ms, 87 req/s, zero errors); `npm run test:e2e` 19 passed; secure pilot Playwright 4 passed; `npx tsc --noEmit`, `npm run build` and production dependency audit passed (zero high-or-above vulnerabilities). Operations exercised encrypted backup, wrong-key rejection, separate-database restore with API report, archive, guarded deletion/retention, backup expiry and audit-retention preview/execute. Browser evidence covers queued revocation, keyboard shipment/focus/labels, sampled contrast, 200% zoom and 320–1366px widths; input-to-display p95 was 5.1 ms. Evidence level: integrated local fictional-data candidate. Contract impact: additive archive route and operational schema documented in `API_CONTRACTS.md`; migrations 009–010 forward-only. Review: no locally actionable V1 gap identified after the matrix audit. External gates: owner aesthetic approval, school identity/hosting/privacy/retention and backup policy, representative physical devices, manual assistive-technology and school-network trials; no classroom readiness or WCAG claim. Checkpoint: commit recorded by the following Git commit; pre-existing local database and private material excluded.

## 2026-09-26 | RC-07 | RUNTIME REVALIDATION | PA

Timestamp (UTC): 2026-09-26T20:01:58Z. Reviewed the committed RC-07 checkpoint after the cross-layer audit and closed remaining local runtime gaps: reconstructed per-skill scaffold state from committed student evidence and applied it to initial and subsequent issued orders; rejected malformed/extra answer fields before recording history; retained best stars across attempts; normalized transferred seeds; and added exact Level 9 slot and all-blueprint attribution assertions. The scaffold's two-order recovery counter now survives continued low evidence.

Verification: `npm test` 71 passed, 8 cases skipped outside the real-PostgreSQL harness; `npx tsc --noEmit` passed; `npm run build` passed; `npm run test:postgres` passed 7 initial tests and 3 restart-phase tests (2 restart-inapplicable skips); `npm run test:e2e` 13 passed; isolated secure-pilot Playwright 4 passed. `git diff --check` to be recorded after scoped staging. Local fictional-data evidence only; external school/device/accessibility gates remain.

Review contributions: `math_audit` identified blueprint assertion gaps; `runtime_audit` audited the answer/progression/results/transfer paths; `pg_journey` supplied the real-PostgreSQL progression journey, which passed; `report_core` supplied report reconstruction and focused tests. PA integrated/fixed runtime findings and reconciled the acceptance and QA evidence. Handoff: PA integration; QA should rerun cross-layer acceptance after merge.

## 2026-09-26 | PILOT-READY-01 | CLAIM | PA / FE / BE / QA

Timestamp (UTC): 2026-09-26. Goal: complete the locally achievable pilot-readiness milestone from the new brief. Baseline: committed `4495ae8` on `f410558`, contract v1; one main agent. Owned paths: new pilot/load/operations/visual tests and documentation, targeted `apps/web/`, `apps/server/`, `scripts/`, `db/` fixes only as evidence requires, shared status/decision/README files under PA coordination. Dependencies: preserve unrelated `TASK_LOG.md` line, `apps/server/src/index.ts` formatting, `apps/server/db/local-development.json`, and `.codex/` private configuration; no external deployment or real data. Acceptance: ACCESS-01..07, PERF-01, OPS-01..02, RECOVERY-01..07, SEC-01..03, plus pilot journey and deployment decision package. Expected outputs: complete local visual review, sustained historical load, backup-expiry/deletion-after-restore rehearsal, repeatable fictional pilot, external review package, final integrated verification and checkpoint commit.

## 2026-09-26 | PILOT-READY-01 | HANDOFF / REVIEW | PA / FE / BE / QA

Timestamp (UTC): 2026-09-26T22:23:49Z. Scope: the user-requested pilot-readiness milestone, contract v1, single main agent. Owned outputs: visual/accessibility fixes and review images; scoped PostgreSQL read/write performance changes and historical load fixture; encrypted deletion ledger, guarded backup inventory/expiry and restore replay; fictional pilot extension; deployment preflight, guides and current acceptance records. The existing development database, private `.codex/` configuration, one unrelated RC-07 task-log sentence and preexisting server formatting were preserved outside this checkpoint. No external deployment or real data was used.

Verification: `npm test` 72 passed and 9 dedicated PostgreSQL/load cases skipped by that command; `npx tsc --noEmit` and `npm run build` passed; `npm run test:postgres` 7 initial plus 3 post-restart passed (2 restart-inapplicable skips); `npm run test:load` passed with final p95 start/answer/retry/report 186/161/86/158 ms, 250 req/s and zero errors; `npm run test:e2e` 21 passed and the native-zoom check skipped because automated Chrome did not change zoom; fresh secure pilot Playwright 4 passed and the added Level 2 assertion passed on rerun; `npm audit --omit=dev --audit-level=high` found zero vulnerabilities; `git diff --check` passed. PostgreSQL operations test rehearsed wrong-key restore rejection, encrypted older-backup restore, deletion-ledger replay, exact archive expiry, archive and class isolation. Browser evidence covers 24 gallery states plus login/teacher, keyboard-only five-order play, reduced motion, CSS zoom, narrow reflow and input-to-display p95 5.5 ms.

**Unpassed local gate:** `npm run test:sustained` deliberately exits nonzero. The retained three-API-process, 90-student/30-concurrent run with ten synthetic historical five-order attempts plus two API-earned attempts per learner completed 29 timed rounds in 94.8 seconds at 221 req/s, zero request errors and zero observed advisory waits. P95 profile/start/answer/retry/report was 195/486/205/210/**1,042** ms against 500 ms. Final 3,690 attempts, 18,450 answers, 16,740 receipts, teacher rosters/totals and unchanged two-star rewards reconciled; database grew to 90 MB, combined client/API-worker RSS peaked at 1.35 GB excluding PostgreSQL. Profiling and failed one-/three-/six-worker, JSON-aggregation and gzip variants are recorded in `docs/qa/CLASSROOM_LOAD_2026-09-26.md`. Seeded history did not replace earned mastery tests. Evidence level: integrated local fictional-data checkpoint, **not pilot-readiness completion or classroom tested**. PERF-01 remains open. A v1-preserving reporting read-model/payload optimization is next; the additive v2 summary/drilldown idea in `DECISIONS.md` requires an owner decision before any contract change. External gates remain owner art approval; school identity, hosting, privacy, retention and custody; and physical-device, native-zoom, assistive-technology and school-network trials. Checkpoint commit: the commit containing this entry; retained local worktree changes are listed in `docs/PILOT_READINESS_BASELINE.md`.

## 2026-09-26 | PILOT-READY-01 | UPDATE | BE / QA

Timestamp (UTC): 2026-09-26T22:28:15Z. Continuing the existing PERF-01 claim after checkpoint `cfabd61`. Scope: preserve the v1 full-detail class report and unchanged 90-student historical workload while isolating header, transfer and parse latency; then implement a measured report-path fix. Owned paths: `apps/server/src/reporting.ts`, `apps/server/src/runtime-store.ts`, `apps/server/src/index.ts` semantic edits only, `tests/integration/sustained-load-real.test.ts`, and current performance evidence/docs. Dependencies: contract v1, the preexisting unstaged server formatting and task-log sentence, private development files. No contract change or owner approval assumed; QA reruns isolation, restart, receipts and report parity after any edit.

## 2026-09-26 | PILOT-READY-01 / PERF-01 | HANDOFF / REVIEW | BE / QA / PA

Timestamp (UTC): 2026-09-26T22:50:29Z. The owner narrowed work to one time-boxed report optimization and the unchanged sustained workload, with a stop if p95 still missed. The report-only store joined orders, responses and unique evidence in one scoped read without a database sort. Report assembly precomputed support/evidence lookups and classified misconception flags once per response. The v1 class report body, date range, pagination and student isolation were preserved. Client-side header/body/parse metrics remain in the sustained test; temporary server timing was removed after diagnosis. No contract or migration change.

Verification: `npx tsc --noEmit`, 17 focused unit/journey/idempotency tests, `npm run test:postgres` (7 initial plus 3 post-restart passed; 2 restart-inapplicable skips), and `git diff --check` passed. Two unchanged full sustained runs failed the 500 ms gate: the best report p95 was **833 ms** (start 481 ms, 30 rounds, 237 req/s); the final single-pass calculation run yielded report **842 ms** and start **510 ms** (28 rounds, 216 req/s). Both had zero request errors and observed advisory waits, exact final attempts/answers/receipts, class-local teacher totals and unchanged rewards. Final report breakdown: headers 639, body transfer 172 and client parse 90 ms p95 for 11.4 MB p95 bodies; temporary route timing: data load 370, report build 90 ms p95. See `docs/qa/CLASSROOM_LOAD_2026-09-26.md`. Evidence level: integrated local fictional-data diagnostic, **PERF-01 open**. Stop performance experiments per owner instruction. Next decision: continue v1-preserving report-path engineering, or decide on the pending versioned summary/drilldown proposal; either requires the unchanged full workload to pass before the gate closes. Preexisting server formatting, task-log sentence, development database and private `.codex/` files remain excluded from the checkpoint.

## 2026-09-26 | PERF-REPORT-V2-01 | CLAIM | PA / BE / FE / QA

Goal: close PERF-01 under the owner's authorized summary/drilldown reporting workflow, retaining legacy v1 and its failing benchmark honestly. Single main thread; PA is sole contract editor, performing affected-role review sequentially. Owned paths: `apps/server/src/reporting.ts`, new reporting modules, semantic changes in `apps/server/src/index.ts`, measured scoped-read changes in `runtime-store.ts`, `apps/web/src/screens/TeacherScreen.tsx`, `TeacherWorkspace.tsx`, `apps/web/src/api.ts`, teacher CSS, `packages/contracts/src/`, report fixtures/tests, sustained and browser test harnesses, `scripts/test-postgres.mjs`, root manifest and relevant documentation. Dependencies: cfabd61/1980ef4, v1 remains compatible. Preserve preexisting server formatting, RC-07 log sentence, development JSON and `.codex/`. Acceptance: REPORT-01..04, PERF-01, SEC/DATA/recovery/exactly-once regression; complete paginated parity, refresh/isolation/deletion/restore, 90-student/30-concurrent/3-worker/90-second history load and browser evidence. Output: additive v2 summary/detail contract and integrated teacher UI, reproducible measurements, local checkpoint.

## 2026-09-26 | PERF-REPORT-V2-01 | UPDATE | BE / FE / QA

Implemented additive summaries and revision-bound evidence pages from authoritative rows, compact summary SQL projection, on-demand teacher evidence with Previous/Next and explicit refresh, schema/filter checks, session-cookie compatibility, cancellation and guarded stale-view handling. Initial 93.1-second API workload passed p95 profile/start/answer/retry/summary/detail 199/354/195/213/439/152 ms; 30 rounds, 18,900 final answers, 237 req/s, zero errors/advisory waits and all final v2 pages equal v1. 28 optimistic-refresh conflicts were explicitly counted. PostgreSQL suite passed 9 initial tests plus 3 restart-phase tests (2 restart skips); browser suite passed 21 with native zoom unverified/skipped. Additional real-browser sustained timing, extended pagination browser tests and final regression remain in progress; this is progress evidence, not DONE.

## 2026-09-26 | PERF-REPORT-V2-01 | UPDATE | PA / BE / QA

The expanded actual-browser workload exposed class-summary p95 596 ms, despite the initial API-only pass. Batching the same response objects as positional JSON worsened class-summary p95 to 815 ms and was rejected. Counts, full parity, cross-worker receipts and rewards still reconciled with zero unexpected errors. The implementation now reads per-order facts directly, fetches missed-objective vectors only for candidate classification, and uses one summary reducer for v1 and v2. No persisted cache, migration, history truncation or lock change. JSON/PG golden parity plus the 9 initial/3 restart-phase PostgreSQL checks pass. The complete sustained run is in progress. UI was compacted to a class table and selected evidence; keyboard/35-record paging and narrow layout pass. Regular suite passed 74 tests/9 harness skips after a CPU-contention-only oracle timeout during concurrent suites; no timeout assertion was relaxed.

## 2026-09-26 | PERF-REPORT-V2-01 | UPDATE | BE / PA

Fact-query profiling: isolated final-history summary read/build was 152/35 ms warm; three concurrent same-worker reports reached 500 ms, with row aggregation and parsing dominant. The complete browser workload still missed class-summary p95 at 608 ms (starts 427 ms, details 142 ms). Scope extends to forward migration `db/migrations/011_report_order_facts.sql`, maintained per-order response facts and explicit transactional rebuild. The owner explicitly authorized necessary migrations and derived summaries subject to parity/invalidation proof. Required checks now include migration backfill, trigger rollback/exactly-once, correction/delete, rebuild and encrypted restore parity. Original responses and immutable questions remain authoritative. No production services or existing development data are changed.

## 2026-09-27 | PERF-REPORT-V2-01 | UPDATE | QA / BE

Transactional facts passed scripted class-summary/start/detail p95 390/360/190 ms in the final-candidate 30-round, 92.1-second run (239 req/s; 18,900 answers; no unexpected errors or advisory waits). Adding direct browser request timing exposed class-summary p95 709 ms despite student-summary/detail p95 135/124 ms; the stricter complete-workflow assertion fails and PERF-01 remains open. Complete final evidence traversal, reward/retry/count parity and 1,500 browser-rendered evidence records passed. Browser timing setup initially failed because an injected callback referenced the Node clock import; using window.performance fixed instrumentation. Investigating browser/server latency breakdown before further changes; no thresholds or workload were reduced.

## 2026-09-27 | PERF-REPORT-V2-01 | UPDATE | BE / QA

Combined identity-directory and facts/evidence reads passed full PostgreSQL parity/restart but still missed browser summary p95 (564 ms, then 651 ms in a diagnostic repeat). Instrumentation measured 211 ms p95 before report processing, only 0.1 ms connection checkout, and 278/66 ms read/build; no pool-size or lock change was justified. Isolated JSON aggregation was slower (92–99 ms versus warm row reads 58–66 ms) and was rejected. Audit found GET profile reconstructing historical questions, answers, supports and receipts that its public response never uses. Scope now includes a read-only profile projection retaining all attempt progress/settings/mastery evidence and omitting unused last-result efficiency calculation for that route only. Projection/full-read parity, full 30-level progression, security, operations, 9 initial and 3 restart-phase PostgreSQL cases, and typecheck pass; complete workload revalidation follows.

## 2026-09-27 | PERF-REPORT-V2-01 | UPDATE | BE / QA / PA

Profile projection retained correctness, but browser summary still missed at 716 ms in a run with 132 ms p95 database connection checkout on the browser's worker. The three workers use the existing hash-based actor distribution, so a 30-student wave can fill one worker's 15-connection pool even when another has headroom. Scope extends to shared default pool sizing and `tests/integration/fixtures/sustained-api.ts`: 25 connections per API worker (75 maximum for three workers), without changing worker count, cohort, actor distribution, history, 30-user concurrency, duration or assertions. Actual application startup and the fixture use the same constant. This is a measured resource-capacity adjustment; no advisory-lock change. Final resource/performance evidence must use this configuration and report the earlier 15-connection trial failures honestly.

## 2026-09-27 | PERF-REPORT-V2-01 | UPDATE | BE / QA

The pool increase was rejected (browser summary p95 809 ms with checkout 0.1 ms), restoring all original pool sizes. An isolated same-session test reproduced roughly 200 ms pre-report retry when two GETs refreshed a stale activity timestamp while one held a long read transaction. GET/HEAD now refresh the activity timestamp in a short conditional autocommit statement after their authorized snapshot commits; mutation transactions, expiry checks, revocation and advisory locks remain unchanged. Scope includes `apps/server/src/identity.ts`, the API transaction completion hook and `tests/integration/security-real.test.ts`. The controlled held-read regression authenticates a second read before releasing the first snapshot, then verifies activity refresh. All 9 initial/3 restart-phase PostgreSQL tests pass, including security/expiry/revocation, complete progression, parity and operations. Full sustained browser/API revalidation is running.

## 2026-09-27 | PERF-REPORT-V2-01 | UPDATE | BE / QA / PA

Read-heartbeat and batched transaction setup still missed complete-workflow latency (610 then 594 ms browser class summary; the latter scripted class summary was 575 ms). Isolated positional JSON was slower than native rows (warm 99–112 versus 64–77 ms), so no JSON transport variant is retained. Summary reads now group facts into exact student/skill counts and representative IDs rather than transferring each order fact to JavaScript; all eligible mastery evidence is retained and all evidence remains accessible in detail. Query/cursor counts include ineligible records. Scope includes the shared reporting reducer and `tests/integration/rc07-progression-real.test.ts`, extended to compare complete v2 summaries and every evidence page with v1 across the earned 30-level/advanced-correction/restricted-representation journey and restart. Typecheck and all 9 initial/3 restart-phase PostgreSQL tests pass. Complete workload remains the final performance criterion.


## 2026-09-27 00:55:56 UTC | PERF-REPORT-V2-01 | HANDOFF | PA / QA

Paused under the owner's explicit weekly Codex usage guard: account quota could not be checked, so no further coding/testing started. No estimate or usage reset. Owned handoff paths: `docs/qa/REPORTING_V2_PAUSED_HANDOFF.md`, `PROJECT_STATUS.md`, `TASK_LOG.md`, `PROMPT_RESULTS.md`; dependencies/contracts unchanged. Existing benchmark completed with exit 1: actual-browser class summary p95 566 ms versus 500 ms target; scripted class 467 ms, all final counts/parity/rewards reconciled, zero unexpected errors/advisory waits. Its disposable database stopped normally. Latest typecheck and PostgreSQL 9+3 checks passed before this prompt. Evidence: integrated fictional data; PERF-01 OPEN, final regression/documentation/scoped commit outstanding. No DONE. Next owner: owner resumes after verifiable usage, then PA/BE review remaining browser summary latency. Full resumable state and preservation boundaries are in the handoff.


## 2026-09-27T10:53:31.524558+00:00 | PERF-REPORT-V2-02 | CLAIM | PA / BE / QA

Owner resumed work in the actual repository, preserving all existing changes. Weekly usage verified at 75%, below the saved 80% guard. Single main agent. Scope: inspect retained browser/server timings and summary query plan, then make only an evidence-supported report-read optimization if warranted. Owned paths: apps/server/src/runtime-store.ts, focused reporting tests if needed, docs/qa reporting evidence, TASK_LOG.md, PROJECT_STATUS.md and PROMPT_RESULTS.md. Contracts, workload and 500 ms target remain unchanged. Preserve all existing uncommitted work, development JSON and private .codex files. No staging, reset or deployment.


## 2026-09-27 | PERF-REPORT-V2-02 | UPDATE | PA

Owner explicitly changed the weekly usage stop threshold from 80% to 90%. Updated the active status and resumable handoff; historical prompt records are preserved. Continue verification before work, between major steps and approximately every five minutes, stopping if usage cannot be checked. No reset authorized or redeemed.


## 2026-09-27 | PERF-REPORT-V2-02 | HANDOFF | PA / BE / QA

Completed the bounded resumed query diagnosis. Retained benchmark confirms SQL/read work dominates remaining class-summary latency. Isolated current-query EXPLAIN: 106 ms cold, 87 ms warm; narrower materialized order projection returned equivalent normalized data but showed no speed gain in eight alternating comparisons, so rejected without source edits. Evidence: docs/qa/REPORTING_V2_RESUME_DIAGNOSTIC.md. No acceptance workload or broad regressions rerun; prior 566 ms browser p95 remains latest full-load result, PERF-01 OPEN. Weekly usage verified at 76%, new owner threshold 90%. No staging, commit, reset or changes to existing development records. Next step: measured summary serialization/aggregation optimization followed by unchanged parity and workload verification.


## 2026-09-27 | PERF-REPORT-V2-03 | CLAIM | PA / BE / QA

Owner requested continued work toward PERF-01. Weekly usage 76%, guard 90%. Single main agent; preserve all existing changes. Scope: measure and reduce summary transport/serialization costs, retain only an improvement supported by complete parity and unchanged historical workload. Owned paths: apps/server/src/runtime-store.ts, focused report tests if needed, docs/qa reporting evidence, status/task/prompt records. No contract, educational rule, workload or threshold changes; no staging, commit or deployment.


## 2026-09-27 | PERF-REPORT-V2-03 | UPDATE | GL / BE / QA

Scope extends to packages/game-engine/src/index.ts eligibleEvidence and tests/unit/evidence-selection.test.ts. Retain the exact existing 24-hour signature deduplication, stable timestamp tie order and newest-12 selection. Parse each timestamp once and stop after 12 accepted records; no educational rule change. This shared calculation runs on concurrent student paths as well as reports. Verify frozen-original differential parity and existing math/progression/report suites before the unchanged load test.


## 2026-09-27 | PERF-REPORT-V2-03 | HANDOFF / REVIEW / DONE | GL / BE / QA / PA

Bounded target completed: unchanged approved v2 historical workload passes with browser class-summary p95 475 ms (<500), scripted class 430 ms, all API phases below target, zero unexpected errors/advisory waits, reconciled 3,510 attempts/17,550 answers/15,660 receipts and unchanged parity/rewards. Only retained application edit is eligibleEvidence timestamp precomputation and early exit after the same 12 accepted records. Frozen-original differential checks, typecheck, npm test 76 passed/9 harness skips, PostgreSQL 9 initial+3 restart passed/2 restart skips, E2E 22 passed/1 native-zoom skip and build passed. Full usable-summary interaction measured separately at 717 ms p95. Evidence: docs/qa/REPORTING_V2_PASS_2026-09-27.md and JSON. Added current-acceptance/status records; older failures retained. DONE applies only to this approved local v2 request-performance target, not full release/classroom readiness or legacy v1 performance. Existing work preserved; no staging, commit, reset or deployment. Final `git diff --check` passed after documentation save.


## 2026-09-27 | ART-CRATES-01 | CLAIM | FE / QA

Owner authorized starting the reference-faithful machine/crate treatment. Single main agent; owns new MachineArtwork.tsx, MachineEditor.tsx, scoped styles.css additions, visual evidence and task/prompt records. Preserve all existing changes. Original full gameplay PNG inspected. Build dimensional SVG crates/hoppers with exact count labels and retain quantity/exchange behavior. No mathematical, API or data changes. Usage guard 90%; initial usage 81%.


## 2026-09-27 | ART-CRATES-01 | HANDOFF | FE / QA

Implemented first-pass reference-inspired SVG equipment in MachineArtwork.tsx and integrated all six denominations through MachineEditor.tsx with scoped styles.css rules. Crates have open tops, slats, rims, side faces, corner nails, denomination plates and shadows; hoppers have bevelled paint, pipes, nozzles and roller receiving platforms. Empty quantity shows receiving bay; positive quantity shows at most three representative crates with exact HTML count. Closed-machine treatment and original quantity/exchange logic retained. Original programmatic vector art, informed by supplied game_screen.png; no new external assets. Typecheck and build passed. Server-rendered component check verified six SVGs, unique gradient/control IDs, exact count labels and retained exchange controls; git diff whitespace check passed. Live visual/browser interaction verification blocked by unavailable browser security-policy check; no alternate browser access attempted. No screenshot baselines updated and no visual acceptance claim. Preview Vite remains at port 5181. Next: owner visual review and desktop/narrow browser verification when available; larger scene composition remains future work.


## 2026-09-27 | ART-SCENE-02 | CLAIM | FE

Owner requests closer fidelity to original reference. Single main agent; scope: original generated decorative factory backdrop, scoped game composition styles and art provenance. Preserve live controls, mathematics, current component changes and other work. Reference inspected earlier in session. Usage 84%, guard 90%. Browser inspection remains unavailable unless security policy check recovers.


## 2026-09-27 | ART-SCENE-02 | HANDOFF | FE

Integrated new reference-guided background plus scoped composition styling and moved RepresentationMonitor into a lower factory-console alongside the existing controls. Retained original assets and all prior changes. Exact generated-asset provenance/prompt in docs/ART_SCENE_V2.md. Typecheck/build/static React screen checks and git diff --check passed. Live browser rendering still blocked by unavailable admin-policy verification; no workaround or visual approval claim. Usage 85%, guard 90%. No deployment/commit/reset. Next: owner visual review and live desktop/mobile verification when browser policy is available.


## 2026-09-27 | ART-BELT-03 | CLAIM | FE

Owner requests one continuous belt and a crate beneath each denomination with the number entry on the crate. Own MachineArtwork.tsx, MachineEditor.tsx, scoped CSS and task/prompt records. Preserve quantity handlers and all prior work. Usage 86%, guard 90%.


## 2026-09-27 | ART-BELT-03 | HANDOFF | FE

Replaced per-machine roller SVGs with one full-width slatted conveyor and roller fascia. Added persistent open crate shells below each denomination; original native quantity inputs and plus/minus handlers now overlay the crate fronts. Exact count captions and exchange actions retained. Narrow layouts use a labelled keyboard-focusable horizontal scroll region to preserve a continuous production line and usable input sizes. Typecheck/build passed; static React checks confirm six editable crate shells, six quantity IDs, unique SVG IDs, exact 42/999999 values and one line. Diff check passed. Browser visual/interaction QA remains unavailable from the prior security-policy blocker; no bypass or screenshot-baseline changes. Current usage verified 86%, threshold 90%. Existing work preserved.


## 2026-09-27 | ART-BUTTONS-04 | CLAIM / HANDOFF | FE

Owner reports plus/minus circles touching the quantity-field frame. Scoped CSS fix: 44×34 px rounded rectangles (8 px radius), lowered from top 96 to 104 px; number field ends at 95 px, leaving 9 px clearance before its shadow/focus outline. Handlers unchanged; existing work preserved. Source geometry checked; browser visual QA still unavailable. Usage 87%, guard 90%.


## 2026-09-27 | ART-LABELS-05 | BLOCKED | FE

Owner requests centered place-value names. Usage verified at 91%; stop threshold 90%. No implementation begun. Pending scope: apps/web/src/styles.css illustrated-machine h2 rules; ensure centered content and long-label wrapping without changing machine alignment. Resume only within the owner usage guard or upon explicit owner change. No reset redeemed.

## 2026-09-27 | ART-LABELS-05 | RESUMED / HANDOFF | FE

Owner explicitly authorized continuing after switching to Sol. Centered each place-value heading horizontally and vertically with a fixed 34 px flex box, centered wrapping and full-width alignment. Long labels retain wrapping and all machine geometry remains unchanged. Build and whitespace verification follow. No reset redeemed.

## 2026-09-27 | ART-CRATE-INPUT-06 | CLAIM / HANDOFF | FE

Owner supplied a preview screenshot showing that the quantity plates covered too much of each crate front. Reduced the input from 65% × 44 px to 49% × 34 px, recentered it on the front panel and reduced its numeral size from 1.5 rem to 1.2 rem. Native number entry, focus treatment and crate controls are unchanged. Build and whitespace verification follow.

## 2026-09-27 | ART-CRATE-INPUT-07 | HANDOFF | FE

Aligned the input to the crate's asymmetric front face rather than the full SVG canvas: left 17%, width 50%, top 54 px and height 32 px. This centers the field on the visible front panel and keeps its bottom edge well above the lower crate rim. Reduced numeral size slightly to 1.15 rem. Interaction behavior unchanged; build and whitespace verification follow.

## 2026-09-27 | ART-CRATE-INPUT-08 | HANDOFF | FE

Reduced quantity-field height from 32 px to 28 px and adjusted its top to 56 px, preserving its center while creating more clearance from the crate frame. Numeral size is 1.05 rem. No behavior change; build and whitespace verification follow.

## 2026-09-27 | ART-CRATE-INPUT-09 | HANDOFF | FE

Set quantity fields to 24 px high and top 64 px, centering them within the clear crate-front panel between its upper and lower rails. Numerals reduced to 1 rem. Width and horizontal alignment remain unchanged. Build and whitespace verification follow.

## 2026-09-27 | ART-CRATE-INPUT-10 | FIX / HANDOFF | FE

Owner screenshot showed the field still rendered at roughly 48 px and overlapped the buttons. Root cause: the global `input, button { min-height: 48px; }` rule overrode the requested height. Added scoped 24 px minimum and maximum heights and moved the field from top 64 px to 58 px. The rendered field can now be 24 px and sits above the controls. Build and whitespace verification follow.

## 2026-09-27 | MVP-RC-01 | CLAIM | PA / FE / BE / QA

Owner authorized the four-step path to a deployed functional MVP with minimal interruption. Scope: run the isolated secure PostgreSQL teacher-to-student pilot with the current factory UI; repair blocking regressions; verify and freeze an evidence-backed local release candidate; then prepare and attempt a private staging deployment without real student data. Owned paths are the current application, focused tests, deployment configuration/docs, and status/task/prompt records. Preserve every existing change and use only fictional identities. Production identity, provider credentials, region and school-policy approvals remain external dependencies; record any hard blocker precisely rather than weakening fail-closed startup.

## 2026-09-27 | MVP-RC-01 | HANDOFF / REVIEW | PA / FE / BE / QA

Fresh isolated secure pilot passed all four journeys, including provisioning, five orders, recovery, evidence, practice, revocation and archive. Full browser regression initially found a 3.62:1 Ship gradient and translucent artwork-label backing; both were corrected, focused contrast audit then passed all 26 states, and the intentional calm baseline was refreshed. Final evidence: typecheck/build pass; 77 regular tests pass with 9 harness skips; PostgreSQL 9 initial plus 3 restart pass with 2 restart skips; Chromium 22 pass with 1 native-zoom environment skip; secure pilot 4 pass; diff check pass. Added a one-container fictional staging runtime, health route, forward migration/one-teacher seed, staging validator and focused tests. External upload is BLOCKED only at the provider boundary: saved GitHub CLI credential is invalid and no hosting/container CLI is connected. Production school identity remains deliberately blocked. Evidence: docs/qa/MVP_RC_2026-09-27.md. Existing development JSON and private .codex configuration remain excluded from the release checkpoint.

## 2026-09-27 | MVP-PREVIEW-02 | FIX / HANDOFF | FE / BE

Owner reported an empty JSON response during student login at the restored local preview. The web-only Vite preview had no API process behind its `/api` proxy. Started the existing development API on 127.0.0.1:3101 without resetting data and verified the complete login request through 127.0.0.1:5181 returns HTTP 200 with the fictional `student-ava` principal and CSRF token. No source, database or credential change.

## 2026-09-27 | MVP-TAB-03 | CLAIM | FE / QA

Owner requests a quantity-first keyboard sequence: Tab from one enabled crate number field must move directly to the next enabled crate number field instead of an enabled trade action. Preserve mouse/touch access and accessible names for trade and plus/minus controls. Own MachineEditor.tsx, the focused keyboard browser assertion and task/prompt records.

## 2026-09-27 | MVP-TAB-03 | HANDOFF / DONE | FE / QA

Moved the trade-action row after the six machine cards in document order, preserving click and keyboard behavior, enabled/disabled state and accessible button semantics. Tab now visits every enabled quantity field before reaching enabled trade actions; plus/minus controls remain outside sequential focus. Strengthened the browser test by enabling the first trade action, pressing Tab from its quantity field and asserting focus moves to the next enabled quantity field; Shift+Tab returns to the prior field. Focused keyboard test, typecheck and build passed; the final calm composition was inspected and its intentional 2% baseline change refreshed. No mathematics or representation behavior changed.

## 2026-09-27 | MVP-STAGING-04 | UPDATE | PA

Owner explicitly approved pushing the verified release candidate through d1118ef to the configured `origin/main`. Push succeeded (`34ed352..d1118ef`), and an independent remote-head read confirmed `refs/heads/main` at `d1118ef92c4204a737dd573b1bb4cc918e2f8485`. No tracked development data or private `.codex` files were included. The repository has no checked-in GitHub deployment workflow; hosting service and PostgreSQL connection remain the next external staging step.

## 2026-09-27 | MVP-VERCEL-05 | CLAIM | PA / BE / QA

Owner authorized deployment-preparation step 1 for Vercel container hosting with Supabase PostgreSQL. Scope: add Vercel's container entrypoint/configuration, keep migrations and fictional-teacher provisioning as one-time administrative actions outside autoscaling container boot, accept Marketplace PostgreSQL environment names, bound runtime pool size for stateless scaling, and document the exact handoff. Preserve production's school-identity block and fictional-only staging guard. No provider project, database, secrets or paid resource will be created in this task.

## 2026-09-27 | MVP-VERCEL-05 | HANDOFF / DONE | PA / BE / QA

Added Dockerfile.vercel, Fluid vercel.json and .vercelignore. Container boot starts only the guarded fictional-staging HTTP service; migration and one-teacher provisioning remain a one-time administrative action. Runtime accepts DATABASE_URL or Marketplace POSTGRES_URL, while migration/seed prefer PVF_MIGRATION_DATABASE_URL or POSTGRES_URL_NON_POOLING. Added validated PVF_DATABASE_POOL_MAX with staging default 1. The complete regular suite exposed and then verified a fix for an empty DATABASE_URL masking POSTGRES_URL. Final evidence: typecheck pass, production web build pass, Vercel structure check pass, 78 regular tests pass with 9 dedicated-harness skips, diff check pass. Handoff: docs/qa/VERCEL_SUPABASE_PREP_2026-09-27.md and docs/DEPLOYMENT_READINESS.md. No external resource or secret created; owner account linking is next.

## 2026-09-27 | MVP-DEPLOY-06 | HANDOFF / DONE | PA / BE / QA

Owner authorized account linking, Supabase provisioning and deployment. Created Vercel project `rostersports/math-factory`, connected GitHub `mjdoucet8/place-value-factory`, accepted the owner-completed Supabase Marketplace terms, provisioned `supabase-charcoal-feather`, pulled environment keys without logging values, restricted local secret files to mode 0600, applied all forward migrations and provisioned one fictional teacher. Added guarded runtime variables and a fresh private receipt key in Vercel; the teacher password is not a runtime variable. The initial generic static preset build failed before release; switched the project to the Container preset with Fluid compute and reset build/output overrides. Final production container is Ready at `https://math-factory-one.vercel.app`. Live checks pass for health, teacher login, fictional class/student access issuance, student login and all 30 map levels; temporary test classes were archived. Durable private credentials: `/home/owner/.config/math-factory/staging-credentials.json`. Evidence: `docs/qa/VERCEL_SUPABASE_DEPLOYMENT_2026-09-27.md`. This is fictional staging only; production school identity and governance remain open.

## 2026-09-27 | MVP-STUDENT-07 | HANDOFF / DONE | QA

Created a persistent fictional `Demo Learner` login in the live `Fictional MVP Demo Class`. Verified the issued class code, username and PIN by starting a student session against the production deployment and loading all 30 factory levels. The class remains enabled for repeat owner testing.

## 2026-09-27 | MVP-MAP-08 | HANDOFF / DONE | FE / QA

Removed the student map's `Practice a skill` recommendation panel, its map-only callback and obsolete styling. Kept the existing practice action in Factory Progress and updated the pilot journey accordingly. TypeScript, production build, diff check and 78 regular tests pass. Deployed production `dpl_FQDvpc2MCG42ZFGQhBqZvvXyXHVs` to the stable alias and confirmed its shipped bundle contains none of the removed panel copy. The owner's pre-existing local development data remains untouched.

## 2026-09-27 | MVP-MAP-09 | HANDOFF / DONE | FE / QA

Moved the Shipping Station artwork and heading 78px left and 28px up in the desktop factory-world layout so the building clears the vertical path and sits above its bend. The level nodes remain aligned with the route, and the narrow single-column layout resets the offset. TypeScript, production build and diff checks pass. Production deployment `dpl_CKSkLg1qyeq361R2CZ9SHB6xZgDc` is Ready at the stable alias; `/api/healthz` returns `{ "status": "ok" }`. Existing local development data remains untouched.

## 2026-09-27 | MVP-FLOW-10 | HANDOFF / DONE | FE / QA

Removed the pre-mission LevelIntro screen from the application, routes, gallery, fixtures and styles. Level selection and replay now start the attempt directly; legacy level URLs also start the requested unlocked level. Added concise How to play copy beside the current order and retained a stacked narrow-screen layout. Updated accessibility, end-to-end and pilot journeys, and refreshed only the intentionally changed map and calm visual baselines after inspection. Final evidence: TypeScript pass, production build pass, 78 regular tests pass, 22 browser tests pass with one environment-specific zoom test skipped, diff check pass. Production deployment `dpl_6b1Gcc8uHsqPdcdgnWBTkMbJxYMo` is Ready at the stable alias; the live bundle contains the new instructions and none of the removed intro copy, and `/api/healthz` is healthy. Existing local development data remains untouched.

## 2026-09-27 | MVP-PAUSE-11 | HANDOFF / DONE | FE / QA

Removed the paused-state device-storage explanation and rebuilt the screen around a horizontally and vertically centered action card. The heading, mascot and Resume/Map controls share one center axis; the responsive lower scene uses the existing factory stage plus pipes, conveyor and shipment artwork to eliminate the unused blank area. Added and inspected a dedicated paused visual baseline. Final evidence: TypeScript pass, production build pass, 78 regular tests pass, 22 browser tests pass with one environment-specific zoom test skipped, visual audit reports no low-contrast or image-backed text, diff check pass. Production deployment `dpl_5JW2GJpYYzXLuH7SiYYkRdxWrzWg` is Ready at the stable alias; the live bundle contains the artwork and excludes the removed sentence, and `/api/healthz` is healthy. Existing local development data remains untouched.

## 2026-09-27 | MVP-RESUME-12 | HANDOFF / DONE | FE / QA

Fixed Resume mission after a page reload changes the browser tab identity. The client now claims a paused attempt through the existing authenticated takeover endpoint when its saved writer tab differs, then resumes with the returned revision and lease epoch. Resume prevents duplicate clicks and renders any API failure on the paused card. Added a browser regression that starts, pauses, reloads and resumes. Final evidence: TypeScript pass, production build pass, 78 regular tests pass, 23 browser tests pass with one environment-specific zoom test skipped, visual audit clean, diff check pass. Production deployment `dpl_657TxBkfH5Cf7KptwGCq427xkMyU` is Ready at the stable alias. A live Supabase smoke test confirmed `paused` to `active` with a new tab identity; its temporary fictional class was archived. Existing local development data remains untouched.

## 2026-09-27 | MVP-NUMBER-13 | HANDOFF / DONE | FE / QA

Centralized visible number formatting with ordinary spaces between three-digit groups and applied it to student gameplay, crate and machine values, map, progress, results, and teacher reporting. Numeric test parsers now accept the displayed spaces, and the calm visual baseline records the intended `420 000`, `100 000`, and `10 000` labels. Final evidence: TypeScript pass, production build pass, 79 regular tests pass, 23 browser tests pass with one environment-specific zoom test skipped, visual audit clean, and diff check pass. Production deployment `dpl_4pzybvDNnvhMu3u85KW7fR3huYQY` is Ready at `https://math-factory-one.vercel.app`; the served bundle contains the shared formatter and `/api/healthz` returns `{ "status": "ok" }`. Existing local development data remains untouched.

## 2026-09-27 | MVP-SHIP-14 | CLAIM | FE / QA

Add a short accepted-shipment transition in which the current crate row travels off the conveyor and the next order's crates enter behind it. Own the gameplay transition state, crate/conveyor animation styles, focused browser coverage, and task/prompt records. Preserve failed-order behavior, input locking, reduced-motion support, and all existing local data.

## 2026-09-27 | MVP-SHIP-14 | HANDOFF / DONE | FE / QA

Accepted shipments now run a two-part transition: the six current crate controls travel off the right edge with a light stagger while the conveyor rollers move, then the next order and empty crate row enter from the left. Incorrect submissions do not animate. Controls remain locked through the transition, the final order departs before results, and the existing Reduce motion setting removes both animation and wait time. The keyboard shipment regression now asserts departing, arriving, and settled states; the full student journey waits for settled controls. Final evidence: TypeScript pass, production build pass, 79 regular tests pass, 23 browser tests pass with one environment-specific zoom test skipped, visual audit clean, and diff check pass. Production deployment `dpl_8QqbsCEcVJJbQyRNCaHeuodvSCR8` is Ready at `https://math-factory-one.vercel.app`; the live stylesheet contains all three shipment animations and `/api/healthz` is healthy. Existing local development data remains untouched.

## 2026-09-27 | MVP-ALERT-15 | CLAIM | FE / QA

Add a brief factory emergency alert for incorrect shipments using red warning lights, a pulsing production frame, and assertive written feedback. Own gameplay alert state, incorrect fixture presentation, alert styles, focused browser assertions, and task/prompt records. Preserve the student's entered crates, accepted-shipment animation, and reduced-motion behavior.

## 2026-09-27 | MVP-ALERT-15 | HANDOFF / DONE | FE / QA

Incorrect shipments now trigger a 1.9-second factory shutdown treatment: paired red beacons flash above the production area, the screen receives an inset red pulse, and the correction panel switches to a high-contrast red alert announced assertively by assistive technology. The submitted crate values remain in place for correction. The deterministic incorrect fixture exposes the state for review. Reduce motion retains the red beacons and panel while suppressing all flashing. The rendered alert was inspected at full resolution. Final evidence: TypeScript pass, production build pass, 79 regular tests pass, 23 browser tests pass with one environment-specific zoom test skipped, visual audit clean, and diff check pass. Production deployment `dpl_BD9VrZryc7F7rkmRXHFaePrF69oi` is Ready at `https://math-factory-one.vercel.app`; the live stylesheet contains both emergency animations and `/api/healthz` is healthy. Existing local development data remains untouched.

## 2026-09-28 | MVP-MAP-16 | CLAIM | FE / QA

Reduce the vertical height above the factory route. Combine the current-level summary, centered guide message, and map-view buttons into one responsive row; turn the saved-mission panel into a compact horizontal strip; tighten map-only header spacing. Own MapScreen, map-specific styles, visual baselines, browser checks, and task/prompt records. Preserve responsive stacking and all map functionality.

## 2026-09-28 | MVP-MAP-16 | HANDOFF / DONE | FE / QA

Rebuilt the map's upper controls as one three-column desktop row: current level at left, centered mascot guidance, and map presentation buttons at right. Tightened the map-only page header and converted the active-attempt card into a full-width horizontal strip with its heading, shipment position, and resume action on one line. At intermediate widths the guidance moves to a compact second row; mobile uses a clean single-column stack without horizontal overflow. The desktop route now begins about 200 pixels higher than the owner's reference layout, and the resume strip measures 68 pixels high. Desktop and 390px mobile renders were inspected. Added browser geometry checks for the requested element order and sub-80px resume height, and refreshed only the intentional map baseline. Final evidence: TypeScript pass, production build pass, 79 regular tests pass, 23 browser tests pass with one environment-specific zoom test skipped, visual audit clean, and diff check pass. Production deployment `dpl_BT47JADf3w8YvyM1QeXfpDUu2m9y` is Ready at `https://math-factory-one.vercel.app`; the live stylesheet contains the compact grid and resume-strip rules, and `/api/healthz` is healthy. Existing local development data remains untouched.

## 2026-09-28 | MVP-COPY-17 | CLAIM | FE / QA

Remove the redundant “This tab now controls the saved attempt.” message after a successful ordinary takeover. Keep takeover behavior, pending-conflict guidance, errors, paused resume behavior, and multi-tab protection unchanged. Own the client copy branch, focused browser assertion, and task/prompt records.

## 2026-09-28 | MVP-COPY-17 | HANDOFF / DONE | FE / QA

Removed the generic successful-takeover notice. An ordinary takeover now quietly clears the notice and enables the new controlling tab; the special pending-conflict path still restores unsent crates and explains the required next action, and errors still surface normally. Updated the two-tab browser regression to assert that the copy and takeover action disappear after control transfers. Final evidence: TypeScript pass, production build pass, 79 regular tests pass, 23 browser tests pass with one environment-specific zoom test skipped, visual audit clean, and diff check pass. Production deployment `dpl_A6H4UpcHoR9LmJZS4KsZaS6j7nKr` is Ready at `https://math-factory-one.vercel.app`; the live bundle excludes the removed sentence, retains pending-conflict guidance, and `/api/healthz` is healthy. Existing local development data remains untouched.

## 2026-09-28 | MVP-NEXT-18 | CLAIM | FE / QA

Fix the results-screen next-mission action so it refreshes progression before starting the newly unlocked level. Add clear zone-boundary guidance after Levels 4, 9, 15, and 21, including an unlocked-station message and map exploration action when the next zone opens, plus accurate practice guidance when its skill gate remains closed. Own results routing/UI, result fixture, focused browser coverage, and task/prompt records. Preserve adaptive stage gates and existing progress.

## 2026-09-28 | MVP-NEXT-18 | HANDOFF / DONE | FE / QA

Fixed the next-mission action's stale profile revision by reloading map progression and using the returned revision and level state before creating the next attempt. Extended the keyboard journey to complete a level, activate Play next mission, and verify the following level opens. Added explicit station-boundary result guidance after Levels 4, 9, 15, and 21. A genuinely unlocked next zone announces “Packing Station unlocked!” (or the corresponding station), explains that its missions are on the map, replaces direct continuation with an Explore Station action, and retains optional transfer/replay/progress controls. If mastery evidence has not opened the next zone, the panel says the current station is complete and directs the student to remaining practice; adaptive gates were not weakened. Added and inspected a deterministic Packing Station result fixture, included it in visual/contrast auditing, and normalized fixture-selector focus before visual baselines. Final evidence: TypeScript pass, production build pass, 79 regular tests pass, 23 browser tests pass with one environment-specific zoom test skipped, visual audit clean, and diff check pass. Production deployment `dpl_8s44vBmfNtZnXsgSTNhKvZyY47GA` is Ready at `https://math-factory-one.vercel.app`; the live bundle contains the refreshed next-mission flow and station guidance, and `/api/healthz` is healthy. Existing local development data remains untouched.

## 2026-09-28 | MVP-UNLOCK-19 | CLAIM | FE / BE / QA

Make Level 4 completion open the Packing Station directly. Change the boundary result to “Shipping Station Complete,” make “Unlock Packing Station” the primary action, return to the refreshed map on activation, and animate Packing Station from grey to colour. Own the Stage 2 access rule, results/map transition state, reveal animation, focused regression coverage, and task/prompt records. Preserve later adaptive station gates, reduced-motion behavior, and existing local data.

## 2026-09-28 | MVP-UNLOCK-19 | HANDOFF / DONE | FE / BE / QA

Level 4 completion now opens Level 5 and the Packing Station immediately at the map, results, and attempt-start authorization layers; later station mastery gates remain unchanged. The boundary result reads “Shipping Station Complete!” and presents “Unlock Packing Station” as its first primary action, with the optional extra challenge moved to a secondary action. Activating it reloads progression, returns to the factory map, and animates Packing Station from grayscale to full colour with a brief glow and “Packing Station unlocked!” badge. Reduce motion retains the final coloured state and badge without movement. Added deterministic click-through and map-reveal fixtures, browser assertions for the transition and animation, and an API regression proving a fictional student with Levels 1–4 complete can see and start Level 5 without gate evidence. The result and both animation stages were visually inspected. Final evidence: TypeScript pass, production build pass, 80 regular tests pass with 9 dedicated-harness skips, 23 browser tests pass with one environment-specific zoom test skipped, visual audit clean across the new map-unlock state, and diff check pass. Production deployment `dpl_FVEA3dGMbScuJXdpQiJ8mXvmr5bf` is Ready at `https://math-factory-one.vercel.app`; health is OK and the served bundles contain the new copy and reveal styles. Existing local development data remains untouched.

## 2026-09-28 | MVP-MOTION-20 | CLAIM | FE / QA

Remove the slight game-scene/background resize during accepted-shipment conveyor animation. Measure the departing, arriving, and settled layouts; stabilize production-line overflow and scene geometry; add a browser regression for a stationary background; and preserve responsive horizontal crate access, shipment motion, reduced-motion behavior, and existing local data.

## 2026-09-28 | MVP-MOTION-20 | HANDOFF / DONE | FE / QA

Removed the factory-background resize during accepted shipments. The accepted-shipment message had added roughly 170 pixels to the document while crates departed, causing the cover-sized background artwork to rescale. It is now a compact, fixed toast during the transition and clears when the arriving crates settle, so it does not participate in page layout. The moving crate row is paint-contained so transformed crates cannot enlarge its overflow bounds. Extended the keyboard shipment regression to compare game-screen, document, conveyor height, and conveyor scroll width across idle, departing, arriving, and settled phases and to verify the toast clears; every measurement remains identical. The updated departure frame was visually inspected. Final evidence: TypeScript pass, production build pass, 80 regular tests pass with 9 dedicated-harness skips, 23 browser tests pass with one environment-specific zoom test skipped, visual audit clean, and diff check pass. Production deployment `dpl_5qCZ6MdDV6bzAMC3DDP3Sj5vS1J5` is Ready at `https://math-factory-one.vercel.app`; health is OK and the served bundles contain the paint containment and accepted-toast styles. Existing local development data remains untouched.

## 2026-09-28 | MVP-COPY-21 | CLAIM | FE / QA

Remove the redundant “Saved — shipment accepted.” message from successful conveyor transitions. Keep the crate departure/arrival animation, stable scene geometry, incorrect-answer feedback, recovery notices, and existing local data unchanged. Own the success-notice branch, obsolete toast styles, focused browser assertion, and task/prompt records.

## 2026-09-28 | MVP-COPY-21 | HANDOFF / DONE | FE / QA

Removed “Saved — shipment accepted.” from successful shipments and deleted its obsolete fixed-toast styling and deterministic fixture. Correct submissions now communicate success solely through the crate departure, conveyor movement, new order, and arriving crates. Incorrect-answer alerts, storage warnings, offline recovery, and conflict notices remain unchanged. The keyboard shipment regression asserts the removed copy is absent during departure, arrival, and settled phases while scene geometry stays fixed; the storage-degraded path now verifies forward progress without the message. Final evidence: TypeScript pass, production build pass, 80 regular tests pass with 9 dedicated-harness skips, and all 23 browser scenarios pass across the full run and focused affected-scenario reruns; diff check pass. Production deployment `dpl_2hSwmrLmpahN9diZkjKbqYWAeKDs` is Ready at `https://math-factory-one.vercel.app`; health is OK and the served JS/CSS contain neither the removed sentence nor its toast class. Existing local development data remains untouched.
