# Prompt Results Log

This document records each user request in brief and the resulting implementation status. New entries are appended after each implementation prompt.

## 2026-09-19 — Initial Place Value Factory V1 implementation request

Result: Established the TypeScript workspace, shared contracts, pure mathematical engine, minimum-crate logic, deterministic generation, independent oracle, fixture tests, fictional API, persisted development store, and semantic React slice. Math tests, type-check, build, and a five-order API flow passed. Full production authentication, PostgreSQL, advanced UI, and classroom QA remain incomplete.

## 2026-09-19 — Local test environment commands

Result: Documented `npm install`, `npm run dev`, local URLs, and fictional student/teacher credentials.

## 2026-09-19 — Student and teacher login returned “Failed to fetch”

Result: Diagnosed a local Vite/API port and CORS mismatch. Stabilized the web port at 5181 and made local CORS permissive for the development adapter.

## 2026-09-19 — Difficulty implementation was missing

Result: Added configuration-backed Level 1 difficulty bands, deterministic band selection, server-persisted issued bands, and visible difficulty labels. Extended the progression foundation to all 30 configured levels with solvability tests.

## 2026-09-19 — Level 2 did not unlock the next level

Result: Refreshed the authoritative map snapshot when returning from results. The API correctly reports completed earlier levels and unlocks the next level.

## 2026-09-19 — Typed numbers retained the initial zero

Result: Quantity fields now select an initial zero on focus so typed values replace it.

## 2026-09-19 — Enter should ship an order

Result: Enter in a quantity field now submits the current order, in addition to the Ship Order button.

## 2026-09-19 — Shift navigation between quantity boxes

Result: Added Shift-to-next and Shift+Tab-to-previous quantity navigation, then removed plus/minus buttons from the tab sequence so fields can be reached directly.

## 2026-09-19 — Focus the 100,000 box on new levels and new problems

Result: The first quantity field is programmatically focused when a level opens and whenever a new order is issued after shipping.

## 2026-09-19 — End mission option

Result: Added End Mission, which returns to the refreshed map while preserving the active server-side attempt.

## 2026-09-19 — Maintain this prompt/results document

Result: Created this running log. Future implementation prompts should append a dated brief summary here.

## 2026-09-26 — Add Codex model orchestration

Prompt: Configure Math Factory to use an Astra lead, Luna workers, and Sol escalation/review.

Overall result: Added project-local model defaults, three custom agents, an orchestration runbook, and durable delegation rules in `AGENTS.md`. All four TOML files parsed successfully.

Agent contributions:
- Main agent — inspected the project guidance, designed the project-specific orchestration policy, created the configuration and agent definitions, updated documentation, and verified the files.

Subagents: none — the configuration work was tightly coupled and completed sequentially.

## 2026-09-26 — Record separate agent accomplishments

Prompt: Require the prompt/result documentation to show what every separate Codex agent accomplished.

Overall result: Expanded this log's required format and made per-agent contribution reporting a required final step in both `AGENTS.md` and the orchestration runbook.

Agent contributions:
- Main agent — reviewed the existing log, added the agent-level audit requirements and examples, connected them to the orchestration workflow, and verified the documentation changes.

Subagents: none — this was a small documentation-only update with overlapping files.

## 2026-09-26 — Remove Codex subagent orchestration

Prompt: Remove the subagent orchestration strategy because it consumed usage too quickly.

Result: Disabled multi-agent tools for Math Factory, removed the Astra/Luna/Sol routing configuration and custom agents, removed the orchestration runbook, restored single-agent instructions, and simplified future prompt/result logging.

## 2026-09-26 — Assess next milestone and usage-efficient strategy

Prompt: Analyse Math Factory and recommend its next major milestone and the most usage-efficient execution strategy, considering terminals and multiple models.

Result: Recommended completing RC-07 learning progression and trustworthy teacher evidence before the broader local V1 release candidate. Saved docs/MILESTONE_STRATEGY_2026-09-26.md with ordered work packages, acceptance gates and a single-active-model strategy. Fresh checks: type check fails at server index.ts:995; unit tests 55 passed/1 failed; broader suite 56 passed/13 failed/6 skipped, with 12 HTTP cases blocked by sandbox loopback binding (EPERM). Report modules are not yet wired into the server. No application code changed, no agents launched and no implementation goals started.

## 2026-09-26 — Complete RC-07 verified learning progression and teacher evidence

Prompt: Finish the attached RC-07 milestone autonomously, preserving dirty work and development data, with all six stages, practice/recovery/rewards, accurate teacher reports, integrated tests, documentation and a local checkpoint commit.

Overall result: Implemented and verified the local fictional-data RC-07 checkpoint. Earned HTTP evidence reaches every stage gate and Factory Master across 30 levels; nonminimal restricted and advanced correction cases pass; practice schedules, issued orders, certifications and rewards persist across PostgreSQL restart. Authorized teacher reports reconcile stored first/final answers and expose class-local filters and skill detail. Full unit/integration, isolated PostgreSQL/restart, standard browser and secure-pilot browser checks pass. The development database and private pilot data were preserved outside the commit. Full V1 operations, load, accessibility/device and external school gates remain open.

| 2026-09-26 | RC-07 completion audit and runtime revalidation | PA integrated the math/runtime audit findings, wired evidence-derived scaffolding to server-issued orders, hardened malformed answer rejection, corrected historical best-star accounting and transferred seed handling, and strengthened Level 9/all-blueprint assertions. Updated current acceptance, completion, blueprint, status and QA evidence. Full local checks: unit 71 passed/7 skipped, PostgreSQL 7+3 passed (2 restart-inapplicable skips), E2E 13 passed, pilot 4 passed, typecheck/build passed. Review contributions: math_audit (blueprint review), runtime_audit (runtime review), pg_journey (real-DB journey), report_core (report reconstruction/tests). Classroom readiness gates remain separate. |

## 2026-09-26 — Complete the locally verifiable V1 release candidate

Prompt: Complete operational readiness and the full locally verifiable V1 release candidate from the attached brief, building on RC-07; preserve user work, verify acceptance and make a local checkpoint commit.

Overall result: Implemented guarded encrypted backup/restore, archive, deletion and retention; hardened local identity and improved PostgreSQL read/write throughput; completed fictional-data load, recovery and accessibility checks; reconciled current acceptance and operations guidance. Full local unit, PostgreSQL/restart, load, standard browser, secure pilot, typecheck and build runs passed. Existing development data and private files were excluded. Owner, school policy, physical device, assistive-technology and school-network gates remain external; no classroom deployment claim.

## 2026-09-26 — Complete pilot-readiness milestone

Prompt: Finish the attached pilot-readiness brief autonomously: reconcile the worktree, close local visual/accessibility and operations gaps, verify sustained historical load, rehearse a fictional pilot, prepare deployment decisions and commit a checkpoint without touching existing data or private files.

Overall result: Implemented and verified broad visual/keyboard coverage, safe archive expiry and deletion-after-older-restore tooling, a path-plus-practice secure pilot, and a provider-independent deployment package. Regular, PostgreSQL/restart, short load, standard browser and secure-pilot suites pass. The stricter 90-student historical sustained test preserves all counts and rewards but fails the 500 ms full-detail teacher-report p95 target (1,042 ms); pilot-readiness completion remains blocked on PERF-01. No subagents, external deployment, real student data or owner approval were used. The checkpoint excludes the preexisting local database, private configuration, unrelated task-log sentence and server formatting.

## 2026-09-26 — Time-box PERF-01 report investigation

Prompt: Continue from `cfabd61`, focus only on PERF-01, make one targeted full-contract optimization, rerun the unchanged sustained workload, and stop with a resumable checkpoint and decision options if p95 still misses 500 ms.

Overall result: A scoped joined report read and single-pass report calculations preserved the v1 detail and correctness checks. Real PostgreSQL/restart, focused tests and typecheck passed. The unchanged sustained run still failed: best report p95 833 ms; final targeted run report 842 ms and start 510 ms. All counts, rewards and tenant isolation reconciled with zero request errors. Timing identified report loading and large JSON transfer as the main costs. PERF-01 remains open; performance experiments stopped. Existing local data, server formatting and private files were preserved.


## 2026-09-27 — Reporting v2 work paused at usage guard

Prompt: Complete essential reporting work, checking weekly Codex usage now, between major steps and about every five minutes; stop at 80% used or if usage cannot be checked; save a resumable handoff and never redeem a reset.

Overall result: Weekly usage could not be verified because no account-usage tool or connected browser was available. Stopped new coding/testing without estimating or redeeming a reset. Saved `docs/qa/REPORTING_V2_PAUSED_HANDOFF.md` and updated shared status/log. Prior reporting v2 implementation and passing typecheck/PostgreSQL evidence remain uncommitted; the already-running benchmark finished with browser class-summary p95 566 ms, so PERF-01 and final checks remain open. Waiting for the owner.


## 2026-09-27 — Resume locally and update usage guard

Prompts: Continue Math Factory in the actual folder, preserving all changes; change the usage guard to 90%.

Result: Accessed the actual repository, recovered the reporting-v2 handoff, verified weekly usage at 75%, recorded a bounded diagnostic claim and updated the active usage threshold to 90%. Existing uncommitted code and development data preserved. Performance investigation continues; no completion claim.

Follow-up result: completed a bounded report-query diagnosis on retained fictional data. Rejected an equivalent but slower query variant; no application source changed. Findings saved in docs/qa/REPORTING_V2_RESUME_DIAGNOSTIC.md. Latest weekly usage 76%; PERF-01 still open.


## 2026-09-27 — Continue report-performance target

Prompt: Continue working on that target please.

Result: Optimized shared evidence selection without changing educational rules. The unchanged full historical workload passed: browser class-summary requests 475 ms p95 versus the 500 ms target, zero unexpected errors and complete report/retry/reward parity. Regular, PostgreSQL/restart, browser and build checks passed with documented skips. Full usable-summary interaction remains separately measured at 717 ms. Saved durable evidence and updated current acceptance; existing changes preserved, no commit/deployment/reset.


## 2026-09-27 — Current website visual preview

Prompt: Show a preview of what the website looks like right now.

Result: Started the existing Vite visual-gallery preview at http://127.0.0.1:5181/dev/place-value-factory/states?fixture=calm (session 5541). Uses current application components with fictional fixture states and does not award progress. Automatic browser opening/render verification was blocked because the browser security-policy check was unavailable; no workaround attempted. Supplied direct gameplay/map/results links. No application source changes. Weekly usage verified at 80%, below the 90% guard.


## 2026-09-27 — Dimensional crates and machines, first pass

Prompt: Please start working on making the equipment closer to the original artwork and making the crates look like actual crates.

Result: Added original SVG hoppers and open slatted crates across all six machines, exact quantity counters, representative stacks and empty receiving bays. Kept the existing quantity/exchange behavior. Typecheck, build and static component checks passed. Preview updates through the existing local server; live visual inspection remains blocked by the unavailable browser security check. Existing user changes preserved.


## 2026-09-27 — Closer reference composition

Prompt: Make the site look as much like the original reference as possible.

Result: Generated and integrated matching decorative factory scenery, enlarged the robot, styled a suspended order sign, opened the machinery row onto a shared conveyor, and moved the packing monitor into a lower control console. All values and controls remain live. Typecheck/build/static render passed; browser visual QA remains blocked by unavailable security verification. Provenance and exact image prompt saved in docs/ART_SCENE_V2.md.


## 2026-09-27 — Continuous conveyor and crate number entry

Prompt: Work on the continuous conveyor and crates below the value number; number entry should be on the crate itself.

Result: One shared conveyor replaces separate roller bases. Each machine has an open crate with its native editable number field and plus/minus controls on the front, including when count is zero. Exact quantity/exchange behavior retained. Narrow screens scroll the production line horizontally. Typecheck/build/static checks passed; live visual confirmation remains pending due to browser security-policy unavailability.


## 2026-09-27 — Crate button clearance

Prompt: Make intersecting plus/minus circles smaller or rounded rectangles.

Result: Changed them to shorter rounded rectangles and moved them down, leaving a 9 px gap below the number-field box. Scoped CSS only; no interaction changes.


## 2026-09-27 — Place-value label alignment pending

Prompt: Place-value names such as Thousands are not properly centered in their boxes.

Result: Weekly usage check returned 91%, above the owner-set 90% guard. Paused before styling edits or tests. Next task: inspect the illustrated-machine h2 rules (including production-line override) and center label content horizontally and vertically while preserving long-name wrapping and the fixed machine-row alignment. No reset redeemed.

## 2026-09-27 — Resume and center place-value labels

Prompt: Continue after reducing the model strength to Sol.

Result: Resumed with explicit owner authorization. Centered place-value names horizontally and vertically inside equal-height boxes, including wrapped labels such as Hundred thousands. No machine, crate, or interaction behavior changed.

## 2026-09-27 — Smaller crate number fields

Prompt: Shrink the number-entry boxes because they cover too much of the crates.

Result: Used the supplied preview screenshot to reduce and recenter each number field, revealing more of the crate face while retaining readable values and the existing controls.

## 2026-09-27 — Recenter crate number fields

Prompt: Center the number field more on the crate and keep it clear of the bottom frame.

Result: Recentered the field against the visible front face of the angled crate and moved it upward, leaving clear space above the lower rim.

## 2026-09-27 — Shorter crate number fields

Prompt: Make the number boxes a bit shorter so they fit with more room.

Result: Reduced the field height to 28 px while preserving its vertical center, adding more space around it inside the crate face.

## 2026-09-27 — 24 px centered crate fields

Prompt: Try 24 px high and recenter the fields on the crates.

Result: Set the number fields to 24 px and centered them within the open front panel between the crate rails.

## 2026-09-27 — Fix rendered crate field height

Prompt: The fields are too low and intersect the plus/minus buttons.

Result: The screenshot exposed a global 48 px minimum height overriding the crate-specific height. Added a scoped 24 px minimum/maximum and moved the field upward, removing the overlap.

## 2026-09-27 — Functional MVP and staging path

Prompt: Begin the four-step path with minimal interruption: secure end-to-end pilot, blocker fixes, release-candidate freeze and private staging deployment.

Result: A fresh fictional PostgreSQL teacher/student pilot passed, including recovery, reporting, revocation and archive. Corrected two accessibility regressions exposed by the factory redesign and refreshed the intentional calm visual baseline. Final typecheck, build, regular, PostgreSQL/restart, standard browser and secure-pilot suites pass with documented environment/harness skips. Added a guarded single-container fictional staging package and verified its static server, health route and deployment validation. External upload could not proceed because the saved GitHub credential is invalid and no hosting/container CLI is connected; production remains fail-closed pending school identity. Existing development data and private files were preserved outside the checkpoint.

## 2026-09-27 — Restore preview student login

Prompt: Student login fails because the response body is empty JSON.

Result: The preview had been restarted without its API process. Started the existing development API without resetting data and verified the fictional student login through the website proxy returns HTTP 200 and valid JSON. No application code or stored data changed.

## 2026-09-27 — Tab directly through quantity boxes

Prompt: Make Tab move from one crate number box directly to the next instead of stopping at Trade 1 for 10 smaller.

Result: Removed trade actions from the sequential keyboard order while preserving mouse/touch use and accessibility semantics. A focused browser test enables the intervening trade action and confirms Tab and Shift+Tab move directly between adjacent quantity fields.
