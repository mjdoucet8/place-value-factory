# Decisions

Version 1.0 | 20 September 2026

Status vocabulary: ACCEPTED REQUIREMENT = explicit owner constraint; RECOMMENDED BASELINE = implementable proposal used by this specification; PENDING OWNER = unresolved external choice. Recommendations are not retroactively labelled owner approval.

## Accepted requirements

A-01 Six-stage path: simple canonical → multi-digit canonical → single-unit renaming → allowed types → forbidden types → advanced puzzles.
A-02 Whole nonnegative crates in 100,000/10,000/1,000/100/10/1; no fractions. Accept all valid ordinary equivalents.
A-03 Mathematics above speed. Separate level, difficulty, mastery and Factory Efficiency; deterministic adaptation, evidence-based reports.
A-04 Bright original factory style, friendly robot, one centered CURRENT ORDER, no separate Orders panel; real semantic controls.
A-05 Future shared platform identity compatibility; no forced FrancoBot integration and no LLM in core mathematics.
A-06 Five development roles, standalone AGENTS/status/log/decisions/contracts files and their complete appendices, PDF plus editable Markdown.
A-07 Privacy, authorization, accessibility and recoverable progress; no public ranks, ads, gambling or punitive loss.

## Recommended baselines

R-01 Thirty levels, five zones, five shipped orders per attempt, unlimited duration; optional untimed transfer order earns third star. Completed main level earns two stars, intentionally supporting correction and help.
R-02 Nineteen separately tracked primary skills; newest 12 observations weighted by 0.9; secure threshold .85 with sample/independence/diversity conditions. Certifications persist; practice fills evidence gaps.
R-03 Efficiency = clamp(100 - 6 corrected shipped slots - 4 capped skips). No time or hint term; busy mode is cosmetic.
R-04 TypeScript/React/Node/PostgreSQL; shared contracts and pure engine. Exact versions selected and locked during foundation. Use existing identity adapter if provided.
R-05 Current-order-only offline play with one pending answer and serialized support events; no new scored orders offline. DB receipts and writer epoch protect duplicates/tabs.
R-06 Six-element bounded quantity vector; targets 0-999,999. Greedy minimum only for power-of-ten subsets with unlimited counts. No exactTypes+minimum or multiple+minimum/exactTypes in V1.
R-07 Canonical layout from game_screen.png, optional busy scenery from game_screen2.png. Revision chronology unknown. Both govern common hierarchy; neither screenshot's level/tier/percentage is a product rule.
R-08 Consistent denomination palette; blue ten-thousands replaces the orange crate mismatch. Add Ship Order, direct quantity entry, accessible exchange, clear/undo and saved-state indicator omitted from images.
R-09 Mockup map has 20 nodes and inconsistent totals/locks; implement 30 nodes/90 stars in five zones, replace denomination locks with skill progress. Level 4 flexible example is not used as a Trainee blueprint.
R-10 Results count real fractions, keep hint/accessibility evidence separate, and never invent mastery percentages from screenshot numbers.
R-11 Preserve minimum examples: 529,521 allowed 10,000/100/1 has minimum 168; 458,123 without 100,000/100 has minimum 68. Invalid 42,000-only-10,000 must be rejected.

## Pending owner / deployment decisions

P-01 Hosting provider, region, school approval and actual production repository. Does not block local fictional-data implementation.
P-02 Existing platform IDs/auth provider; integrate through adapter, do not assume FrancoBot code exists here.
P-03 School-approved retention and deletion/backups; proposed end-of-year+30-day educational data, 30-day logs/backups await review.
P-04 Classroom calibration of mastery gates, five-order pacing and star rewards; use baseline while testing, change by versioned decision with evidence.
P-05 Final approval of original art assets and any deliberate change from calmer reference composition.
P-06 School approval of the separate encrypted deletion ledger, its custodian, retention period and restore reconciliation procedure. The local rehearsal does not set these policies.
P-07 School selection of operational owner, incident escalation, backup recovery objectives and review authority for expiry and promotion.

## Change record template

RC-05; 2026-09-23; RECOMMENDED BASELINE implementation clarification; map sidebar requires server-derived last completed efficiency. Add `lastCompletedEfficiency: number|null` to the v1 map response (additive; existing clients ignore it), derive stars per level from best saved main/transfer result and compute current node from actual eligibility. No scoring policy change. PA/FE/BE/QA roles performed sequentially; integration tests and shared gallery reviewed together. No migration required.

ID; date; status; context; proposal; alternatives; mathematical/product impact; contracts/migrations affected; reviewers; owner approval if changing an accepted requirement; rollout and rollback; superseded ID. Do not delete old decisions.

## Foundation implementation record

F-01; 2026-09-19; RECOMMENDED BASELINE; repository contained only the handoff package. Local stack: Node 22.23.2/npm 10.9.8, TypeScript 5.8.3, React 19.1.1, Vite 7.1.7, Vitest 3.2.7 and tsx 4.20.3, locked in package-lock.json.

F-02; 2026-09-19; RECOMMENDED BASELINE; contract v1.0 uses strict six-element vectors and shared order/validation boundaries. Server recomputes from its stored order; it does not accept client totals.

F-03; 2026-09-19; RECOMMENDED BASELINE; JSON persistence and fictional accounts are development-only. PostgreSQL remains required before real-student use.

F-04; 2026-09-21; RECOMMENDED BASELINE; upgraded the Vite development/build dependency to 7.3.6 after an audit reported high-severity development-server advisories. `npm audit --omit=dev --audit-level=high` then reported no production vulnerabilities. This does not change the selected architecture or permit production use of the JSON adapter.

RC07-CERT; 2026-09-26; RECOMMENDED BASELINE implementation clarification, locally verified in RC-07. The V1 text requires six persistent certifications, calls Trainee onboarding, assigns subsequent tier labels at preceding-stage gates, and explicitly reserves Factory Master for level 30 plus Stage 6 evidence. Persist six stage gate certificate IDs separately from the display tier. Stages 1–4 advance displayed tier to Packer/Converter/Specialist/Supervisor; Stage 5 records its certificate and opens Stage 6 while retaining Supervisor; Stage 6 awards Factory Master only after all Stage 6 levels and evidence. No new invented tier or early Factory Master. Gate checks require all stage path levels, so an instructional override does not fabricate completion. Existing saved orders/responses remain immutable. PA is the sole shared-contract editor; BE implements forward migration 008; QA verifies actual HTTP/PG journeys and durable awards. This interprets conflicting baseline wording while preserving the explicit Factory Master condition; it does not claim a new owner-approved product rule.

PILOT-OPS; 2026-09-26; RECOMMENDED BASELINE; deletion-after-restore cannot rely solely on an audit row inside the backed-up database. Write an encrypted, fsynced deletion intent to a separate private ledger before the database deletion. An empty-target restore authenticates the ledger and replays those requests before success. A no-ledger restore requires explicit zero-request confirmation. Actual ledger custody, retention and release authorization remain P-06/P-07.

PILOT-PERF; 2026-09-26; RECOMMENDED BASELINE under measurement; the first 90-student historical run showed high global advisory-lock contention and p95 API misses. Student mutations now take a shared global gate plus an exclusive per-student advisory lock; teacher/operations mutations retain the exclusive global gate, preserving revocation ordering. Reporting and load reconstruction use authorized student scope. This is a server implementation choice, not a mathematical or contract change; real PostgreSQL duplicate/revocation/restart tests and a sustained workload must pass before the checkpoint closes.

PILOT-REPORT-PERF; 2026-09-26; PROPOSED, NOT ACCEPTED; a three-process 90-student historical load with overlapping full-year class reports keeps student API phases below 500 ms p95 but full-detail class reports at 1,042 ms p95. First optimize the v1 read model and payload without changing any field or authorization rule. If that cannot meet the target, propose an additive v2 class-summary request returning the existing class/date metadata, pagination cursor and per-student counts, skills, trends and flags without `evidence[]`; keep the v1 full-detail response and individual report/evidence drilldown available. FE would request summary for the roster and fetch exact stored evidence on selection; BE would preserve v1 compatibility and avoid a data migration; QA would verify both contracts, class isolation, date windows, recovery and the unchanged 90-student workload. Owner must decide whether such a versioned interaction and its distinct latency target are acceptable before a product contract is changed. No target is relaxed by this proposal; PERF-01 stays open.

RC07-REPORT; 2026-09-26; RECOMMENDED BASELINE implementation clarification. Shared report reconstruction uses each order's immutable first response timestamp as its date assignment; later correction is included in that order's outcome. Date-only boundaries are class-local, start inclusive/end exclusive. No denominator yields null accuracy and “No evidence”; unresolved submissions stay pending. Main/practice default excludes transfer, with explicit includeTransfer opt-in. Additive detail fields expose exact first/final responses, supports, trends and deterministic candidate pattern counts. Existing count fields and evidence target/vector fields remain compatible.

RC07-PRACTICE; 2026-09-26; RECOMMENDED BASELINE implementation clarification. A practice attempt retains the requested path context level; each of its fixed focus/focus/review/focus/stretch slots selects the most recently available blueprint for its own primary skill. The schedule is stored with the attempt and survives restart. After level 30, practice targets missing Stage 6 evidence for Factory Master. This keeps prerequisite coverage and does not grant mastery from timing, hints or seeded state. Additive migration 008; no accepted product change.

V1-OPS; 2026-09-26; RECOMMENDED BASELINE implementation clarification. Archive is a teacher-owned idempotent class mutation, one-way for V1, which revokes student sessions and blocks student login/writes while retaining authorized teacher evidence. Deletion and retention are guarded command-line operations with explicit class/student or archived-class target, preview and database-name confirmation; no school retention value is assumed. Migration 009 stores archive time and hashed, count-only operational audit. Existing old roster PIN receipts cannot identify their student, so deletion removes that teacher's roster receipts to prevent retained encrypted credentials; this may invalidate replay of unrelated roster commands and is documented. Backup/restore uses a new private archive and a separate empty database. Rollback is a separately rehearsed restore, never a destructive schema down-migration. PA owns the additive contract wording; BE implements identity/operations and QA checks disposable PostgreSQL restore/deletion. School policy and hosting approval remain pending.

V1-OPS-ENCRYPTION; 2026-09-26; RECOMMENDED BASELINE implementation clarification. Backup archives stream through AES-256-GCM with a separately supplied random 32-byte key and are authenticated before restore opens the selected empty target. No plaintext intermediate file is written. Migration 010 records a `backup_expiry_at` marker for each student deletion using an explicitly configured positive backup retention period; the application does not assume school policy approval or delete existing archives automatically. QA tests wrong-key rejection with an unchanged target and reports/immutable data after a separate-database restore. This adds operational safeguards without changing game contracts.
