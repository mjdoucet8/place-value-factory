# Fictional-data pilot operator guide

This is a local rehearsal for review, with fictional identities and a private disposable PostgreSQL cluster. It does not authorize real student use. A fresh `npm run pilot:local` creates a new database and a 0600 private credentials file under `/tmp/pvf-pilot-*`; Ctrl+C stops the server and database without erasing that directory. Starting the command again **without a directory argument** is the safe reset: it creates a fresh isolated pilot and leaves earlier user work intact. To resume one, use the exact command printed by its launcher. Never point a test or reset command at the development database or a school service.

## Launch and rehearse

1. Run `npm run pilot:local` in a terminal. Record the printed private directory path and loopback URL. Read `pilot-private.json` from that directory locally for the generated fictional teacher username/password; do not paste them into shared records or commit the file.
2. Open the loopback URL. Sign in as the fictional teacher, create a class, issue a fictional learner, note its class code and one-time six-digit PIN on a private worksheet, then hide the PIN. Sign in as that learner in a separate browser profile.
3. Open Level 1 and ship five orders. Confirm Level 2 becomes available. For a manual before-commit interruption, put the browser's Network panel offline just before shipping an order, restore the connection, retry the pending save and confirm one saved answer. The automated pilot test also injects a dropped reply after commit and verifies the original queued key on reload. Return to the map, open **Practice a skill**, complete five practice orders, and confirm map stars did not decrease.
4. In the teacher workspace, select the class and inspect the stored question, first answer, final answer and support evidence. Verify the submitted and accepted counts for the five path plus five practice orders. Revoke the learner, attempt a queued save from the student profile and confirm it is rejected without altering the report. Archive the class and confirm the historical report remains visible while student login is closed.
5. For a repeatable automated rehearsal against the running pilot, set `PVF_PILOT_CREDENTIALS` to the exact private `pilot-private.json` path and run `npx playwright test -c playwright.pilot.config.ts`. The suite provisions new fictional records; use a fresh pilot directory for an independent rerun. Stop the launcher with Ctrl+C.

Expected evidence: one original answer per shipped order and an identical cached receipt on retry; accurate path/practice teacher totals; no stars lost to help, timing or recovery; queued work cannot save after revocation; archived-class reports remain readable. `tests/pilot/classroom.spec.ts` is the executable local journey. The 30-level earned-evidence journey remains in `tests/integration/rc07-progression-real.test.ts`; the pilot browser journey is deliberately shorter.

## Review checklist for owner and school

| Trial | Device or setting to supply | Expected result |
| --- | --- | --- |
| Visual | Owner views the current review images and live map, calm/busy gameplay, help, results and teacher workspace | Original factory character and hierarchy are acceptable; one CURRENT ORDER; all six machines and Ship visible; no art obscures live text. |
| Keyboard and screen reader | Representative Chromebook plus chosen screen reader, at 1366×768 and 1280×720 | Login, map/list, order entry, help, results and teacher evidence have understandable names, focus order and announcements; focus returns from dialog. |
| Touch and reflow | School tablets 1024×768 and 768×1024, narrow 390×844, and real browser 200% zoom | No horizontal document overflow; six/three/two-column transitions preserve order; controls remain reachable and at least 48 CSS px where required. |
| Network/recovery | School guest/classroom network with 30 simultaneous fictional learner sessions | Interruption shows pending vs saved state, retries once, keeps one answer/reward, and teacher report reconciles after reconnect. Record API p95 and rendering smoothness on actual devices. |
| Operations | School-approved hosting/identity/privacy/retention/key custodians | Policies and access owners are signed off, backup/restore and deletion ledger are held separately, and an isolated recovery target is verified before any exposure. |

Defect record: date/time and fictional account; device/browser/OS/AT; viewport and zoom; route/state; steps; expected and observed behavior; screenshot or redacted recording; severity; network status; related acceptance ID; owner and retest result. Never include a live PIN, session cookie, key, or real child information in evidence.

Owner review and school trials are explicit external gates. Browser emulation, semantic DOM checks and the local fictional pilot do not replace them.
