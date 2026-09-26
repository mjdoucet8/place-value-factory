# Prompt Results Log

This document records each user request in brief and the resulting implementation status. New entries are appended after each implementation prompt.

## 2026-09-19 — Initial Place Value Factory V1 implementation request

Result: Established the TypeScript workspace, shared contracts, pure mathematical engine, minimum-crate logic, deterministic generation, independent oracle, fixture tests, fictional API, persisted development store, and semantic React slice. Math tests, type-check, build, and a five-order API flow passed. Full production authentication, PostgreSQL, advanced UI, and classroom QA remain incomplete.

## 2026-09-19 — Local test environment commands

Result: Documented `npm install`, `npm run dev`, local URLs, and fictional student/teacher credentials.

## 2026-09-19 — Student and teacher login returned “Failed to fetch”

Result: Diagnosed a local Vite/API port and CORS mismatch. Stabilized the web port at 5181 and made local CORS permissive for the development adapter.

## 2026-09-19 — Difficulty implementation was missing

Result: Added configuration-backed Level 1 difficulty bands, deterministic band selection, server-persisted issued bands, and visible difficulty labels. Extended the progression foundation to all 30 configured levels with solvability tests.

## 2026-09-19 — Level 2 did not unlock the next level

Result: Refreshed the authoritative map snapshot when returning from results. The API correctly reports completed earlier levels and unlocks the next level.

## 2026-09-19 — Typed numbers retained the initial zero

Result: Quantity fields now select an initial zero on focus so typed values replace it.

## 2026-09-19 — Enter should ship an order

Result: Enter in a quantity field now submits the current order, in addition to the Ship Order button.

## 2026-09-19 — Shift navigation between quantity boxes

Result: Added Shift-to-next and Shift+Tab-to-previous quantity navigation, then removed plus/minus buttons from the tab sequence so fields can be reached directly.

## 2026-09-19 — Focus the 100,000 box on new levels and new problems

Result: The first quantity field is programmatically focused when a level opens and whenever a new order is issued after shipping.

## 2026-09-19 — End mission option

Result: Added End Mission, which returns to the refreshed map while preserving the active server-side attempt.

## 2026-09-19 — Maintain this prompt/results document

Result: Created this running log. Future implementation prompts should append a dated brief summary here.

## 2026-09-26 — Add Codex model orchestration

Prompt: Configure Math Factory to use an Astra lead, Luna workers, and Sol escalation/review.

Overall result: Added project-local model defaults, three custom agents, an orchestration runbook, and durable delegation rules in `AGENTS.md`. All four TOML files parsed successfully.

Agent contributions:
- Main agent — inspected the project guidance, designed the project-specific orchestration policy, created the configuration and agent definitions, updated documentation, and verified the files.

Subagents: none — the configuration work was tightly coupled and completed sequentially.

## 2026-09-26 — Record separate agent accomplishments

Prompt: Require the prompt/result documentation to show what every separate Codex agent accomplished.

Overall result: Expanded this log's required format and made per-agent contribution reporting a required final step in both `AGENTS.md` and the orchestration runbook.

Agent contributions:
- Main agent — reviewed the existing log, added the agent-level audit requirements and examples, connected them to the orchestration workflow, and verified the documentation changes.

Subagents: none — this was a small documentation-only update with overlapping files.

## 2026-09-26 — Remove Codex subagent orchestration

Prompt: Remove the subagent orchestration strategy because it consumed usage too quickly.

Result: Disabled multi-agent tools for Math Factory, removed the Astra/Luna/Sol routing configuration and custom agents, removed the orchestration runbook, restored single-agent instructions, and simplified future prompt/result logging.

## 2026-09-26 — Assess next milestone and usage-efficient strategy

Prompt: Analyse Math Factory and recommend its next major milestone and the most usage-efficient execution strategy, considering terminals and multiple models.

Result: Recommended completing RC-07 learning progression and trustworthy teacher evidence before the broader local V1 release candidate. Saved docs/MILESTONE_STRATEGY_2026-09-26.md with ordered work packages, acceptance gates and a single-active-model strategy. Fresh checks: type check fails at server index.ts:995; unit tests 55 passed/1 failed; broader suite 56 passed/13 failed/6 skipped, with 12 HTTP cases blocked by sandbox loopback binding (EPERM). Report modules are not yet wired into the server. No application code changed, no agents launched and no implementation goals started.

## 2026-09-26 — Complete RC-07 verified learning progression and teacher evidence

Prompt: Finish the attached RC-07 milestone autonomously, preserving dirty work and development data, with all six stages, practice/recovery/rewards, accurate teacher reports, integrated tests, documentation and a local checkpoint commit.

Overall result: Implemented and verified the local fictional-data RC-07 checkpoint. Earned HTTP evidence reaches every stage gate and Factory Master across 30 levels; nonminimal restricted and advanced correction cases pass; practice schedules, issued orders, certifications and rewards persist across PostgreSQL restart. Authorized teacher reports reconcile stored first/final answers and expose class-local filters and skill detail. Full unit/integration, isolated PostgreSQL/restart, standard browser and secure-pilot browser checks pass. The development database and private pilot data were preserved outside the commit. Full V1 operations, load, accessibility/device and external school gates remain open.

| 2026-09-26 | RC-07 completion audit and runtime revalidation | PA integrated the math/runtime audit findings, wired evidence-derived scaffolding to server-issued orders, hardened malformed answer rejection, corrected historical best-star accounting and transferred seed handling, and strengthened Level 9/all-blueprint assertions. Updated current acceptance, completion, blueprint, status and QA evidence. Full local checks: unit 71 passed/7 skipped, PostgreSQL 7+3 passed (2 restart-inapplicable skips), E2E 13 passed, pilot 4 passed, typecheck/build passed. Review contributions: math_audit (blueprint review), runtime_audit (runtime review), pg_journey (real-DB journey), report_core (report reconstruction/tests). Classroom readiness gates remain separate. |

## 2026-09-26 — Complete the locally verifiable V1 release candidate

Prompt: Complete operational readiness and the full locally verifiable V1 release candidate from the attached brief, building on RC-07; preserve user work, verify acceptance and make a local checkpoint commit.

Overall result: Implemented guarded encrypted backup/restore, archive, deletion and retention; hardened local identity and improved PostgreSQL read/write throughput; completed fictional-data load, recovery and accessibility checks; reconciled current acceptance and operations guidance. Full local unit, PostgreSQL/restart, load, standard browser, secure pilot, typecheck and build runs passed. Existing development data and private files were excluded. Owner, school policy, physical device, assistive-technology and school-network gates remain external; no classroom deployment claim.

## 2026-09-26 — Complete pilot-readiness milestone

Prompt: Finish the attached pilot-readiness brief autonomously: reconcile the worktree, close local visual/accessibility and operations gaps, verify sustained historical load, rehearse a fictional pilot, prepare deployment decisions and commit a checkpoint without touching existing data or private files.

Overall result: Implemented and verified broad visual/keyboard coverage, safe archive expiry and deletion-after-older-restore tooling, a path-plus-practice secure pilot, and a provider-independent deployment package. Regular, PostgreSQL/restart, short load, standard browser and secure-pilot suites pass. The stricter 90-student historical sustained test preserves all counts and rewards but fails the 500 ms full-detail teacher-report p95 target (1,042 ms); pilot-readiness completion remains blocked on PERF-01. No subagents, external deployment, real student data or owner approval were used. The checkpoint excludes the preexisting local database, private configuration, unrelated task-log sentence and server formatting.

## 2026-09-26 — Time-box PERF-01 report investigation

Prompt: Continue from `cfabd61`, focus only on PERF-01, make one targeted full-contract optimization, rerun the unchanged sustained workload, and stop with a resumable checkpoint and decision options if p95 still misses 500 ms.

Overall result: A scoped joined report read and single-pass report calculations preserved the v1 detail and correctness checks. Real PostgreSQL/restart, focused tests and typecheck passed. The unchanged sustained run still failed: best report p95 833 ms; final targeted run report 842 ms and start 510 ms. All counts, rewards and tenant isolation reconciled with zero request errors. Timing identified report loading and large JSON transfer as the main costs. PERF-01 remains open; performance experiments stopped. Existing local data, server formatting and private files were preserved.
