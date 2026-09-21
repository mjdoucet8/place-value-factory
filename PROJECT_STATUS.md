# Project status

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
