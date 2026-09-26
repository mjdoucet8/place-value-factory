# Recovery and local accessibility audit — 26 September 2026

Evidence levels below refer to executable local tests, not school deployment or a manual screen-reader conformance claim. Browser checks use Chromium; real-database checks use the private disposable PostgreSQL harness. Run names are in `README.md` and `TASK_LOG.md`.

| Criterion | Executable evidence | Local finding |
| --- | --- | --- |
| RECOVERY-01 drop before commit | `tests/e2e/student-teacher.spec.ts` IndexedDB reply abort, refresh and reconnect; `tests/pilot/classroom.spec.ts` secure PostgreSQL pilot | Original queued key replays; one saved answer. |
| RECOVERY-02 drop after commit | Standard browser and secure pilot dropped-after-commit cases; `tests/integration/postgres-real.test.ts` concurrent same-command receipts | Cached receipt wins, no duplicate answer/reward. |
| RECOVERY-03 refresh with draft | Standard browser draft reload and outbox restoration tests | Same unresolved order and quantities restored after successful device write. |
| RECOVERY-04 two tabs and stale epoch | Standard browser takeover/conflict; unit/integration stale revision and expired lease; real PostgreSQL lease test | Old writer rejected; unsent crates require explicit review. |
| RECOVERY-05 restart and rollback | Real PostgreSQL rollback injection, restart phase, immutable pending order and 30-level progression test | No phantom response; committed evidence survives restart. |
| RECOVERY-06 revocation while offline | Secure pilot queues an unsent replay response, teacher revokes access, retry is rejected and five previously committed answers remain in report | No new accepted evidence; queued device work remains pending under the original profile. |
| RECOVERY-07 storage failure | Browser localStorage quota and absent IndexedDB cases | Warns that draft cannot survive close; current in-memory play remains usable. |
| ACCESS-01 keyboard | `tests/e2e/accessibility.spec.ts` machine labels, Tab/Shift+Tab, Enter shipment, five-order keyboard-only journey through saved results, and teacher report focus; existing map list/help tests | Full local keyboard journey passes; manual full journey with assistive technology remains outstanding. |
| ACCESS-02 focus/dialog | Help dialog focus/Escape restoration, visible focus assertion, teacher region focus | Local browser checks pass. |
| ACCESS-03 contrast | `tests/e2e/visual-audit.spec.ts` checks visible text in 24 gallery states plus login and teacher against opaque fills/gradient stops; selected captures in `docs/visual-evidence/pilot-*.png` | An initial 3.01:1 map-node stop was corrected. No text below 4.5:1 or directly on art was found in the tested states. Decorative art lettering, untested combinations and full manual review remain open. |
| ACCESS-04 spoken totals/restrictions | Semantic monitor, quantity names and accessible total browser assertions | DOM semantics checked; actual screen-reader trial unavailable locally. |
| ACCESS-05 reduced motion/calm | Gallery reduced-motion checks, saved supports and math/reward unit rules | Motion turns off; speed and support settings do not enter reward formula. |
| ACCESS-06 zoom/reflow | Gallery at 1366, 1280, 1024, 768, 390 and 320 widths; 200% CSS zoom at 640 viewport plus teacher 320 width check; native `Control+Equal` attempted in headless and headed Chrome | No horizontal document overflow in tested states. Chrome did not change its native zoom metrics under automation, so native 200% browser zoom and physical touch/Chromebook review remain NOT RUN. |
| ACCESS-07 field errors | Login error `role=alert` and associated `aria-describedby`; labeled teacher/student inputs | Login association locally checked; manual assistive-technology review outstanding. |

Physical devices, unavailable assistive-technology configurations, school network and owner visual approval remain external release gates. The automated contrast and zoom checks cover the named local samples and do not establish WCAG conformance for all artwork or browser/AT combinations.
