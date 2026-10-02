# Classroom login, control and screen-fit fixes — 1 October 2026

Owner request: remove prefilled demo credentials, remove the false other-tab warning/manual takeover, and keep Ship order visible on smaller student screens.

## Implementation

- All three student credential fields start blank and clear after logout. The class code remains `doucet`; students enter their own credentials.
- The visible tab acquires the existing writer lease on arrival/focus and automatically recovers a lease/revision rejection during actions. Background heartbeats cannot claim it. Manual takeover UI and tab-conflict notices are removed.
- Existing receipts are replayed before reconciliation. Only a definite rejection allows a fresh command key, saved with an atomic outbox comparison before sending. Network uncertainty retains the exact saved request. Stale answers are never applied to a later order. Server authorization, validation, progress and math are unchanged.
- The live HTML game compacts its artwork/spacing on short screens and scales to the available viewport height. Target, quantities and footer stay within the stage; separate crates still animate. Help renders in an unscaled modal. Very narrow phone screens retain horizontal scrolling of the six-machine row.

## Evidence

- TypeScript and production build pass.
- Regular application suite: 100 passed, 9 dedicated-harness skips. An initial run alongside two browser workloads exceeded the existing exhaustive math-oracle 5-second timeout; the unchanged suite passed when run without that CPU contention. No timeout or test threshold was increased.
- Full Chromium suite: 37 passed, 1 existing native-browser-zoom environment skip. Covers initial/logout blank fields, refresh, focus/tab ownership, queued responses and hints, dropped replies, exactly-once shipment recovery, keyboard completion, Help focus trap, animations/reduced motion, draft preservation and contrast.
- Secure isolated PostgreSQL pilot: all 4 journeys pass (teacher-issued credentials, real student save/reload, evidence/revocation and visual/keyboard checks).
- Screen-fit regression checks 48 combinations: six gameplay states (first-order guide, ordinary, incorrect, two representations, repack, pending) at 1366×600, 1280×600, 1024×600, 1024×768, 768×1024, 844×390, 390×844 and 320×568. Target and shipping controls remain visible; document height stays within the viewport.
- Reviewed short-laptop, two-representation and phone screenshots. Only the gameplay visual baseline intentionally changed. Shipment geometry remains stable throughout departure/arrival.

Final command-key recovery rechecks: 7 browser journeys pass, asserting a fresh key after definite rejection and exact recovery after a lost committed reply; the secure PostgreSQL classroom journey passes again. Publication is recorded in TASK_LOG.md. No actual student answers were submitted for verification. Physical classroom devices and native browser zoom were not independently tested. Existing local-development.json is pre-existing runtime data and remains untouched/excluded.
