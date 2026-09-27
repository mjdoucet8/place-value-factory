# Reporting v2 — resumable handoff

**Latest: 27 September 2026.** The approved v2 request-performance workload now passes (browser class-summary p95 475 ms). See `REPORTING_V2_PASS_2026-09-27.md` for current evidence, separate 717 ms usable-summary timing and remaining release work. Earlier failed/paused results below are historical; the active usage guard remains 90%.

Owner resumed work on 2026-09-27 and raised the weekly usage stop threshold to **90%**. Check before work, between major steps and approximately every five minutes; stop at 90% or when verification is unavailable. Never redeem a reset without explicit authorization. Usage was verified at 75% on resume. The pause described below is historical; the 90% threshold supersedes the original 80% instruction.

Paused 2026-09-27 00:55:56 UTC at the owner's usage guard. Weekly account usage could not be checked: no account-usage tool is exposed, and computer-use discovery returned no connected apps or browsers. No percentage was estimated and no reset was redeemed. Do not resume coding/testing until the owner resumes and the usage guard can be satisfied. Check before work, between major steps and approximately every five minutes; stop at 90% used or whenever verification is unavailable.

## Completed work

Uncommitted additive v2 class/student summaries and revision-bound evidence paging, teacher UI, strict query contracts, migration 011 transactional report facts with rebuild/invalidation, complete v1 parity fixtures, profile read projection, and short post-read session heartbeat. The latest summary implementation uses one SQL query with shared materialized order data and compact grouped results. V1 remains available. Original pool sizes are restored; the attempted increase was rejected. No engine rules changed.

Current-code typecheck passed. Latest PostgreSQL suite passed 9 initial and 3 post-restart tests (2 restart-inapplicable skips), including report/profile parity, full 30-level progression, authorization, held-read heartbeat regression, deletion and encrypted restore. Logs: `/tmp/pvf-single-query-pg.log`. Earlier regular suite: 74 passed/9 harness skips; earlier browser suite: 22 passed/1 native-zoom skip. These earlier broad runs predate subsequent backend edits.

## Last benchmark and outstanding checks

The already-running `npm run test:reporting` finished with exit 1; no new test was started after the usage-check request. `/tmp/pvf-reporting-single-query-final.log`: unchanged 90 students, 30 concurrent users, 3 API workers, full-year reporting, 91.357 seconds, 27 rounds, 217 requests/second. Scripted p95 profile/start/answer/retry/summary/detail: 263/268/220/238/438/179 ms; class summary separately 467 ms. Actual-browser API class summary **566 ms**, student summary 126 ms, detail 125 ms. PERF-01 remains OPEN against the unchanged 500 ms target. Zero unexpected request errors and observed advisory waits; 22 expected refresh conflicts. Final 3,510 attempts, 17,550 answers and 15,660 receipts reconciled; full evidence parity and reward assertions completed before the failing browser latency assertion. Harness shut down its disposable PostgreSQL cluster; retained diagnostics at `/tmp/pvf-postgres-test-GYczEZ`.

Outstanding: resolve actual-browser class-summary latency; repeat the unchanged complete workload after a justified change; current final regular/E2E/secure-pilot/short-load/build checks; retained legacy sustained benchmark; readable final viewport evidence; reconcile acceptance/status/operations documents; scoped review and checkpoint commit. No classroom readiness or PERF-01 completion claim.

## Latest continuation

The 27 September bounded query diagnosis is recorded in `REPORTING_V2_RESUME_DIAGNOSTIC.md`. A narrower materialized order projection was rejected after eight comparisons; no application source was changed. Latest weekly usage is 76%. The 566 ms complete-workload result remains authoritative. Continue with measured summary serialization/aggregation work and retain all correctness and workload assertions.

## Resume next

First verify actual weekly Codex account usage and obtain the owner's resume instruction. If below 90%, inspect the last benchmark's browser/server timings and query plan to identify the remaining class-summary cost before changing code. Retain all workload, parity and security assertions.

Worktree is on `main` at `1980ef4`; nothing staged or committed for this task. Preserve unrelated development JSON, private `.codex/`, preexisting index.ts formatting and the preexisting RC-07 TASK_LOG sentence. Use an isolated branch before checkpointing. `/tmp/pvf-prepare-index.mjs` prepares semantic-only index.ts staging and verifies formatted parity; recheck it before use. Stage TASK_LOG only from the PERF-REPORT-V2-01 claim onward while retaining the earlier unrelated edit unstaged. Existing task details: `TASK_LOG.md`, `DECISIONS.md`, `API_CONTRACTS.md`, `docs/qa/REPORTING_V2_2026-09-26.md`. Temporary files may disappear; the source worktree is authoritative.
