# Reporting performance continuation — 27 September 2026

## Scope and preservation

Resumed directly in `/home/owner/Math Factory`. Preserved existing uncommitted implementation, development JSON, private configuration and prior edits. No source changes, staging, commits, deployments or usage resets. Owner raised the weekly usage stop threshold to 90%; latest verified usage 76%. Existing checks before work, between major steps and approximately every five minutes remain active; stop if verification is unavailable.

## Retained workload diagnosis

The previous complete workload remains the latest acceptance result: browser class-summary request p95 566 ms versus the unchanged <500 ms target. Browser header p95 was 563 ms and body processing p95 9 ms. Server scripted class-summary diagnostics measured SQL p95 381 ms, total report read p95 402 ms and report construction p95 50 ms. These separate percentiles must not be summed. They support investigating database work before changing UI rendering or payload transfer.

Restarted only the retained disposable fictional-data PostgreSQL cluster `/tmp/pvf-postgres-test-GYczEZ`, using its private socket and no TCP listener. Read the final benchmark schema and executed the current summary query for one 30-student class over the full 2026 year. EXPLAIN ANALYZE reported 106 ms cold and 87 ms warm total execution without concurrent student traffic. The warm plan processed 5,850 order rows and 4,350 eligible evidence rows. It included approximately 20 ms grouped report aggregation, 17 ms evidence sorting/JSON output and 3 ms repeated objective-miss index probes; attempt aggregation timing includes the shared order-data computation. Isolated timings are diagnostic, not a new performance acceptance result.

## Rejected candidate

Compared an extra materialized narrow order projection (extracting canonical/allowed counts before joining facts/evidence) with the existing query. Eight alternating comparisons in milliseconds:

- Baseline: 127, 98, 106, 99, 89, 90, 95, 90.
- Candidate: 106, 118, 96, 97, 93, 102, 96, 105.

Parsed results were identical after normalization of object keys and array ordering. This comparison does not establish ordering-sensitive contract parity. The candidate did not improve latency, so it was not applied. No application code or test assertions changed; broad regression and a repeated complete workload were not run for this rejected experiment.

## Next bounded implementation step

Investigate reducing summary query serialization and repeated aggregation while retaining all evidence, exact revision invalidation and mastery/report semantics. Before retaining any change, run PostgreSQL parity/restart/security coverage and the unchanged real-browser historical workload. PERF-01 remains OPEN. Final regular/browser/pilot/load/build verification, readable viewport evidence, documentation reconciliation and a scoped checkpoint remain outstanding from the previous handoff.

Temporary diagnostic scripts and plans are in `/tmp/math-factory-query-plan.mjs`, `/tmp/math-factory-query-plan-0.txt`, `/tmp/math-factory-query-plan-1.txt`, `/tmp/math-factory-compare.mjs` and `/tmp/math-factory-candidate-query.sql`. They may disappear; this record preserves the conclusion.
