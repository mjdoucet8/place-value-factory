# Full locally verifiable V1 release candidate

Objective: complete the original product/design handoff for owner review and a controlled fictional-data classroom pilot. Preserve the full expanded owner request in the thread. No implementable V1 gap can be reclassified as external merely because it is difficult. Historical handoffs are claims requiring verification.

## Current local V1 candidate — 26 September 2026

The dependency queue below is historical. RC-07 plus `f410558` supply verified mathematics, earned six-stage progression, immutable evidence and teacher reporting. The local V1 candidate adds encrypted, guarded backup/restore and configured deletion/retention/archive; session/network hardening; measured 90-student/30-concurrent API load; queued-work revocation recovery; and local accessibility checks. `docs/V1_CURRENT_ACCEPTANCE.md` maps the current evidence, `docs/OPERATIONS.md` describes safe operation, and `docs/qa/` records load and recovery/accessibility measurements. The full local integration suite passed before the checkpoint commit. School policy and physical classroom trials remain external gates; no deployment is claimed.

## Dependency queue

1. Establish repeatable isolated real PostgreSQL tests without system-cluster access. Verify repository transactions, duplicate races, rollback and restart.
2. Wire actual runtime persistence for every entity; fail closed on configuration/storage failure. Implement sessions, CSRF, throttling, class/roster lifecycle and multi-identity tests with approved local adapter.
3. Implement durable browser outbox/support serialization, reconcile crash/retry/lease/revocation behavior end to end.
4. Audit all 30 level blueprints, stage-1 attribution, mastery/gates/rewards and independent oracle coverage.
5. Complete teacher reports/drilldowns/filters, retention/deletion mechanisms, safe local operations and bounded load verification.
6. Correct visual defects, 30-node illustrated route/list, student copy and integrated supporting states; inspect desktop/tablet/narrow/zoom/keyboard presentations against the four PNGs.
7. Run full cross-workstream acceptance audit, reconcile docs/contracts and commit coherent implementation with reviewed evidence.

## Resumable state

RC-06 IndexedDB answer/help outbox is integrated with exact-key replay on refresh or reconnect and visible retry/fallback states. Cross-tab conflict handling requires explicit review after takeover; it does not merge old unsent quantities. The secure PostgreSQL browser journey verifies interruptions before commit, after an intermediate commit, and after final-result commit, followed by accurate teacher totals. Local checks passed: 49 unit/integration tests, 5+2 real PostgreSQL cases across restart, 13 isolated standard Chromium journeys and 4 secure-pilot browser checks. Next: math and progression audit, including stage-1 attribution, practice, gates, rewards and report reconciliation; recovery edge cases remain on the acceptance ledger.

RC-05 visual correction has passed 48 local tests, real PostgreSQL restart checks, eight standard browser journeys and four secure pilot/browser visual checks. Reviewed screenshots show desktop/tablet/narrow map, gameplay and results; the 1024px landscape controls were tightened after review. Documentation/commit review for RC-05 is in progress. Next: durable IndexedDB pending-command recovery and matching server lease/reconciliation behavior, then math/report/operations. Owner approval and manual device/assistive-tech checks remain external gates; do not treat visual baselines alone as approval.

RC-01/02 repository checks and RC-03 normalized HTTP runtime persistence passed real PostgreSQL transactions/restart. RC-04 secure local adapter and browser class/student journey now pass: authenticated teacher creates class, provisions student, five shipments persist, teacher sees five submitted/accepted orders, reset/revocation invalidates sessions. Teacher UI and isolated resumable pilot launcher added. Remaining security work includes bounded network throttling, expired secret cleanup and operational/retention audit; remaining runtime work includes scoped performance/load, complete command/lease integration and all advanced modes. Next: fix inspected visual defects and verify responsive scenes, then durable browser outbox/math/report/operations queue. Existing `apps/server/db/local-development.json` remains unmodified/unstaged. Full V1 release candidate is NOT complete.

## External release gates

Owner aesthetic approval; school identity/hosting/privacy and retention-policy decisions; physical devices, manual assistive technology and school-network trials where unavailable. Complete all local adapters, tests, configuration and operational preparation before these are the only remaining items. No deployment, paid resources, real student data or system administrator changes authorized.
