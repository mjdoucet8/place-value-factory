# Factory-city login integration — 1 October 2026

Integrated the owner's approved generated city as the full viewport login background. A centered cream panel with blue/gold trim keeps text and controls legible; existing mascot, blank credentials, student/teacher forms, PIN toggle and error announcement remain functional. Background is decorative CSS and does not intercept input. Short-height spacing is compact; expanded teacher access can scroll normally.

- TypeScript and production build pass.
- Eight existing Chromium checks pass: login errors and field associations, blank initial/logout fields, logout/retry/history, student five-order and optional-transfer completion, teacher evidence, keyboard/reflow and visible-text contrast.
- Inspected the production build at 1920×1080, 1366×600, 1024×600, 390×844 and 320×568, including expanded teacher access. No horizontal overflow; Student login is fully visible at all five sizes. At 320×568, the full card can scroll vertically; no controls are clipped.
- Reviewed desktop, short-laptop and phone screenshots. Public image is byte-for-byte identical to the approved 1672×941 source (SHA-256 0dd8932059ec04c12e94b0c78d22a5ca4ebde49dbb2a4e6730fdc774ab1e5757). No visual baselines updated.
- Source diff checked. No authentication, API, database, game logic or saved-progress changes. Existing local runtime data remains unstaged.

Publication verification follows in TASK_LOG.md. Actual classroom devices were not tested during this change.
