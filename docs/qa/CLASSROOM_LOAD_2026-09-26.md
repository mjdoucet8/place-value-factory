# Local classroom load — 26 September 2026

Command: `npm run test:load`. It creates a private, disposable PostgreSQL 16 cluster with a Unix socket, no TCP listener, an isolated schema, and fictional teacher/student identities. The API is a local Node HTTP server. The run uses 90 students in three classes of 30, one active attempt per student, and 30 concurrent starts in three waves. Thirty students submit an actual correct answer and retry its identical immutable command; teacher report reads overlap the submissions and run again after them. The test checks 90 attempts, 30 answers, 30 answer receipts, zero request errors, identical retry receipts, and final report totals across all three classes. It times HTTP request through parsed JSON response; it does not measure browser rendering or school-network latency. A 50 ms sampler counts database sessions waiting on the advisory lock.

| Local run | Start p95 | Answer p95 | Retry p95 | Report p95 | Throughput | Errors | Lock-wait samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Before query optimization, reports after submissions | 1,641 ms | 2,552 ms | 2,483 ms | 59 ms | 20 req/s | 0 | 2,792 / 149 polls |
| Final overlapping-report run after migration 010 | 343 ms | 450 ms | 405 ms | 67 ms | 87 req/s | 0 | 599 / 35 polls |

The 500 ms p95 API target in the specification passed in this final local run; the load test asserts each phase stays below 500 ms. The global mutation lock remains correctness-first and has measurable contention. Rewriting only changed profiles/attempts removed the main bottleneck; repeatable-read GETs no longer wait on that lock. No narrower mutation lock is justified by this measured scope yet. Results vary by host and are not school infrastructure evidence.

A separate Chromium fixture check measured 30 quantity-input-to-displayed-total updates at p50 3.7 ms and p95 5.1 ms, below the specification's 100 ms local target. This measures component update latency in the local browser, excluding network, physical input hardware and representative school Chromebook performance. The smooth Chromebook and school-network targets remain external trials.
