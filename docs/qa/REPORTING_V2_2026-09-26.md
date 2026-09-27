# Reporting v2 acceptance and reproduction

**Latest: 27 September 2026.** The approved v2 request-performance workload now passes (browser class-summary p95 475 ms). See `REPORTING_V2_PASS_2026-09-27.md` for current evidence, separate 717 ms usable-summary timing and remaining release work. Earlier failed/paused results below are historical; the active usage guard remains 90%.

The owner approved an additive summary/drilldown workflow in the PERF-01 continuation brief. `PERF-REPORT-V2` and `PERF-REPORT-CONSISTENCY` in `DECISIONS.md` record the authority and consistency choice. `/api/v1` remains available, with its full-detail response and original performance test. The primary teacher screen uses `/api/v2` summaries and bounded evidence pages; no history is truncated and the date range is never silently shortened.

## Implementation boundary

- Summaries retain v1 counts, null denominators, pending/corrected work, support and candidate counts, skills/trends, progress/certifications and representative IDs. The only large field deferred is `evidence`.
- PostgreSQL summary reads use compact per-order facts maintained by migration 011. Both summary and detail are reconstructed from authoritative orders, responses, supports and skill evidence within a repeatable-read request. Response facts update atomically with insert/update/delete and cascade; migration backfill and `pvf_rebuild_report_orders()` reconstruct them from raw responses. No report-response cache or expiry interval exists. Deletion and restored data are visible on the next read. Per-order change tokens invalidate open views on rebuild or raw response updates even when counts do not change.
- Profile requests use a read-only metadata/evidence projection, preserving their public response, progress, settings, certifications and rewards while avoiding historical answer/receipt reconstruction. The report read path groups exact counts and representative IDs by student/skill, retaining all eligible mastery evidence and counting all records for revisions; ineligible records remain fully accessible through detail. identity directory reads use one snapshot query. The 25-connection pool experiment was rejected; original pool sizes, three workers, actor hashing, 30-user concurrency and advisory locking are retained. Read-only authentication refreshes the session activity timestamp after releasing the report snapshot, preventing concurrent reads from retrying behind a long session-row update. Expiry/revocation checks and mutation transactions remain unchanged.
- Detail retains each immutable question, first/final vectors (including the second vector), exact feedback/status and support events. First-response time assigns the entire order to a date window; later corrections remain included. Transfer is excluded by default, with explicit opt-in. Class-local date-only boundaries and daylight-saving conversion use the existing report code.
- Evidence order is first-response timestamp, then order ID. Cursors bind the teacher, resource, normalized filters, page size and revision. Each request checks ownership again; cursors never authorize access. Changed activity returns 409 `REPORT_CHANGED`, and deletion returns 404. A stable view traverses every record exactly once. A refresh preserves filters and restarts navigation; no mixed-revision append occurs.
- The UI has a compact class summary, selected student evidence, keyboard-operable Previous/Next, explicit refresh, no-evidence/error/loading states and horizontal table regions at narrow widths. Outstanding requests are cancelled when the report or selection changes. Roster access controls are collapsed independently of report evidence. An authenticated v1 session bootstrap upgrades the cookie to `/api` so existing sessions can reach both API versions.

## Requirement-to-evidence audit

| Requirement | Authoritative evidence |
| --- | --- |
| Approved versioned contract, compatible v1 | `API_CONTRACTS.md`, `DECISIONS.md`, `packages/contracts/src/index.ts`, `tests/fixtures/report-v2.json`; unchanged v1 report routes retained |
| Independent counts and complete v1 parity | `tests/integration/report-v2.test.ts` runs JSON and real PostgreSQL variants; golden counts are independent of report assembly. Sustained test drains every final student's pages and compares exact entries/summary fields with v1 |
| First/final, corrections, pending, skip, hints, second vector, transfers, empty evidence | Report fixture assertions plus `tests/unit/reporting.test.ts`; no replacement of the engine's math/progression/reward tests |
| Date boundaries | `reportWindow` unit tests include exclusive boundary and a 23-hour class-local DST day; integration first-response date fixture includes a correction outside the first-response window |
| Pagination and concurrent changes | Tied-time 60-order fixture, page sizes 7 and 25, bound/malformed cursor tests, stale-revision 409, cross-teacher/student denial, full final historical traversal; live submissions overlap pages in the sustained test |
| Deletion/restore | Real PostgreSQL operations test restores encrypted backup into a separate database, compares all restored v2 pages with v1 and confirms deleted student v1/v2 routes return 404 |
| Exactly-once and isolation | Sustained final SQL counts, class-local rosters, cross-worker immutable retry equality and unchanged rewards; existing secure PG, rollback and restart suites |
| Complete teacher workflow | `tests/e2e/reporting-v2.spec.ts`: API-earned 35 orders, cookie upgrade, keyboard open/Next/Previous, unique IDs across pages, narrow region focus/reflow, injected stale-view response, refresh and empty-date filter. Secure pilot covers issued access, play/practice, teacher drilldown, revoke and archive |
| Historical performance | `npm run test:reporting`: unchanged 90 students, 30 concurrent, three workers, ten synthetic historical attempts and two API-earned attempts each, at least 90 seconds, full-year filters, overlapping summary/student/evidence interactions; separate phase thresholds remain 500 ms |
| Browser performance | The same workload serves the actual teacher application through Vite to Chromium. It times usable refreshed summaries, opened evidence and next-page presentation during student writes. Browser timing includes automation/scroll/render plus requests; it is distinct from API timing. The browser also measures its own summary/detail fetch through parsed JSON, with separate 500 ms p95 assertions |
| Legacy performance | `npm run test:sustained` retains the full-detail v1 workload and original per-phase 500 ms assertions; record its actual result separately |

## Reproduce

From the repository root with the pinned dependencies installed:

```sh
npx tsc --noEmit
npm run build
npm test
npm run test:postgres
npm run test:e2e
npm run test:load
npm run test:reporting
npm run test:sustained
npm run pilot:local
# Use the private temporary credentials path printed by the launcher:
PVF_PILOT_CREDENTIALS=/tmp/pvf-pilot-XXXXXX/pilot-private.json npx playwright test -c playwright.pilot.config.ts
```

Run measured load suites individually with no other suites consuming the host. Every database harness creates its own `/tmp/pvf-postgres-test-*` cluster and stops it after the run; it never resets the existing development database or reads a production connection string. The pilot launcher also uses a disposable cluster and is stopped after its checks. Keep its credentials outside the repository.

Measurement definitions: API latency covers request through parsed JSON. Request bytes are JSON-body bytes for writes or path/query bytes for reads, excluding HTTP headers; response bytes are uncompressed JSON bytes. The workload records throughput, phase distributions, error/conflict counts, evidence volume, database growth and process RSS/advisory-wait samples. RSS includes the load client/Vite and three API workers, and excludes PostgreSQL and Chromium. Explicit `REPORT_CHANGED` replies are measured and counted separately from unexpected request errors; rejected pages never contribute evidence rows. Final parity traversal occurs after timed writes and does not dilute timed detail-request latency.

## Results and limits

Final measurements are recorded in `CLASSROOM_LOAD_2026-09-26.md` and the final PERF-REPORT-V2-01 task handoff. The earlier API-only candidate passed, but adding browser activity exposed a class-summary miss (596 ms); that failed candidate is retained in the performance history. The positional JSON variant also failed (815 ms class-summary p95), and direct per-order aggregation still missed at 608 ms. Profiling led to transactional response facts (migration 011); that implementation and the final compact class view must pass the complete workload before this goal is DONE.

This is local fictional-data evidence. Owner art approval; school identity, hosting/region, privacy, retention, backup/ledger custody and operating-owner decisions; physical devices, native zoom, selected assistive technology and school-network trials remain external. No deployment, classroom-readiness or comprehensive accessibility-conformance claim is made.
