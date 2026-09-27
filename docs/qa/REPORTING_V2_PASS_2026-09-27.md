# Reporting v2 performance target — local pass, 27 September 2026

## Result

The unchanged `npm run test:reporting` workload passed. Actual-browser class-summary fetch through parsed JSON measured **475 ms p95**, compared with the prior 566 ms failure, against the same **<500 ms** limit. Browser student summary/detail were 157/181 ms p95. Scripted class/student summary were 430/177 ms p95. Profile/start/answer/retry/summary/detail were 277/272/224/235/414/179 ms p95. All pre-existing assertions passed; no workload or threshold changed.

The workload used 90 fictional students, 30 concurrent users, three API workers, ten synthetic historical attempts plus two API-earned attempts per learner, full-year reporting, browser navigation and overlapping writes. It completed 27 rounds in 91.285 measured seconds at 217 requests/second with zero unexpected request errors or observed advisory waits. Final counts reconciled: 3,510 attempts, 17,550 answers and 15,660 receipts. Full v1/v2 evidence parity, cross-worker retries and unchanged rewards passed. Synthetic history remains performance data, not earned mastery proof.

The separately measured full usable-summary interaction, including automation/scroll/render, was **717 ms p95**; evidence opening 558 ms and next-page presentation 335 ms. These are not the API request measurements and are not claimed below 500 ms. This is one passing local workload, not a school-network guarantee. The retained legacy v1 full-detail benchmark was not rerun and retains its prior failed result.

## Retained change

`eligibleEvidence` parses each timestamp once before its stable sort and stops scanning once 12 records have been accepted. The same 24-hour signature deduplication, timestamp tie order, eligibility filtering and newest-12 window remain in effect. The selected original record objects are returned without mutating the input. This removes redundant calculation in student requests as well as teacher summaries; no educational, API, migration, pool-size or locking rule changed.

Added a frozen-original differential regression over 160 deterministic histories with repeated signatures, ties, excluded records and long histories, plus explicit exact-24-hour and accepted-record boundary cases. Existing mastery, report and earned 30-level PostgreSQL journeys also passed. A compact JSON evidence experiment showed only a small isolated benefit and was not applied; the only application source change in this continuation is the shared evidence selector.

## Verification

- `npx tsc --noEmit`: passed.
- `npm test`: 76 passed, 9 dedicated-harness skips.
- `npm run test:postgres`: 9 initial plus 3 post-restart passed; 2 restart-inapplicable skips. Includes report parity/invalidation, earned progression, security, rollback, deletion and encrypted restore.
- `npm run test:reporting`: passed all unchanged performance and correctness assertions.
- `npm run test:e2e`: 22 passed, 1 native-browser-zoom skip. Native zoom remains unverified.
- `npm run build`: passed.
- `git diff --check`: passed before documentation updates; final check recorded in task log.

Structured measurements: `REPORTING_V2_PASS_2026-09-27.json`. Temporary execution logs: `/tmp/math-factory-evidence-reporting.log`, `/tmp/math-factory-evidence-pg.log`, `/tmp/math-factory-final-tests.log`, `/tmp/math-factory-final-e2e.log`, `/tmp/math-factory-final-build.log`. The disposable databases stopped normally; no existing development records were changed by the diagnostic procedure.

## Remaining release work

The local approved v2 report-request performance target is met by this run. This does not complete the overall release milestone. A fresh secure pilot/short-load check, retained legacy workload result on the final version, owner-facing viewport review and scoped checkpoint remain outside this continuation. Owner aesthetic approval; school identity, hosting, privacy, retention and operations decisions; physical device, native zoom, assistive-technology and school-network trials remain external. Existing uncommitted work, development JSON and private configuration are preserved. No staging, commit, deployment or reset was performed. The owner-set usage stop threshold is 90%.
