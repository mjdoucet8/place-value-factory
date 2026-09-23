# Full locally verifiable V1 release candidate

Objective: complete the original product/design handoff for owner review and a controlled fictional-data classroom pilot. Preserve the full expanded owner request in the thread. No implementable V1 gap can be reclassified as external merely because it is difficult. Historical handoffs are claims requiring verification.

## Dependency queue

1. Establish repeatable isolated real PostgreSQL tests without system-cluster access. Verify repository transactions, duplicate races, rollback and restart.
2. Wire actual runtime persistence for every entity; fail closed on configuration/storage failure. Implement sessions, CSRF, throttling, class/roster lifecycle and multi-identity tests with approved local adapter.
3. Implement durable browser outbox/support serialization, reconcile crash/retry/lease/revocation behavior end to end.
4. Audit all 30 level blueprints, stage-1 attribution, mastery/gates/rewards and independent oracle coverage.
5. Complete teacher reports/drilldowns/filters, retention/deletion mechanisms, safe local operations and bounded load verification.
6. Correct visual defects, 30-node illustrated route/list, student copy and integrated supporting states; inspect desktop/tablet/narrow/zoom/keyboard presentations against the four PNGs.
7. Run full cross-workstream acceptance audit, reconcile docs/contracts and commit coherent implementation with reviewed evidence.

## Resumable state

RC-01/02 repository checks passed on a user-owned PostgreSQL 16 cluster: migrations, populated upgrade, ownership constraints, rollback, duplicate races, leases and real process restart. RC-03 in progress: connect normalized runtime persistence. First eliminate collisions in runtime-issued order IDs (pure generator IDs are deterministic and currently reused), retain exact evidence ownership, and add request transaction boundaries before secure identity/rosters. Existing `apps/server/db/local-development.json` is user data and must remain unmodified/unstaged. No full runtime or release completion claimed.

## External release gates

Owner aesthetic approval; school identity/hosting/privacy and retention-policy decisions; physical devices, manual assistive technology and school-network trials where unavailable. Complete all local adapters, tests, configuration and operational preparation before these are the only remaining items. No deployment, paid resources, real student data or system administrator changes authorized.
