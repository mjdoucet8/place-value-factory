# Math Factory: next milestone and usage-efficient execution

Assessment date: 26 September 2026. Inspected `/home/owner/Math Factory` (the existing directory corresponding to the requested path). This is a planning assessment, not an implementation or release sign-off.

## Recommendation

**Finish and verify RC-07: learning progression and trustworthy teacher evidence.** Deliver one reviewable checkpoint in which a fictional student can progress through all six stages, practice missing skills, recover saved work, receive each reward once, and have the teacher inspect accurate first/final answers and learning evidence.

The larger following milestone is the full locally verified V1 release candidate. Do not combine all remaining V1 work into the immediate goal: retention, backup/restore, load, complete accessibility review and operational hardening would make RC-07 harder to finish and verify.

## Evidence behind the recommendation

- The last commit is `edcc28d`, durable browser-command recovery. Earlier commits provide the secure local pilot, PostgreSQL persistence and reviewed visual work. These are historical evidence, not newly reverified release claims.
- There are 18 modified tracked files and substantial untracked RC-07 files. The tracked diff contains about 1,486 additions and 288 deletions, including local development data; it is not all implementation code. Preserve and review this work before starting new branches or rebuilding features.
- Progression changes span engine, configuration, server, contracts, migrations and student screens. Splitting these among concurrent writers would require repeated contract coordination.
- Two untracked reporting modules exist: `apps/server/src/reporting.ts` and `reports.ts`. Unit tests exercise the former, but the HTTP server imports neither. Its inline report logic still differs from the new report decision, including transfer filtering and class-local date handling. Consolidate deliberately after comparing behavior; do not discard either blindly.
- The teacher interface still presents basic submitted/accepted counts and saved shipment rows. The specification requires interval filters, skill summaries, progress detail, and exact question/first/final-answer evidence.
- Status and acceptance documents mostly describe 23 September; the newer ledger also contains gap descriptions superseded by current code. For example, the generator now contains fallback logic. Update evidence after verification rather than using stale lists as implementation instructions.
- The prompt history explicitly records removal of multi-agent orchestration because it consumed usage too quickly. Current AGENTS.md requires one main agent and `.codex/config.toml` disables agents.

## Fresh verification

- Type checking failed: `apps/server/src/index.ts:995` compares the declared status union with `abandoned`, which is absent from that union. Reconcile state semantics across types, persistence and callers rather than suppressing the error.
- Unit suite: **55 passed, 1 failed**. The failing assertion is `tests/unit/rc07-blueprints.test.ts:153`, expecting `pv.ones` where `nextPracticeSkill` returns null. Both fixture skills have eight independent successes across two attempts; the selector excludes secure skills. First determine whether the fixture or intended scheduling behavior is wrong. Freeze test time and verify focus/review separately.
- The all-150-slot blueprint test, existing math tests and four reporting unit tests passed. This does not establish end-to-end progression or report integration.
- The broader suite reported 56 passed, 13 failed and 6 skipped. Twelve HTTP cases failed because this environment denied loopback server binding (`listen EPERM`), leaving one substantive unit failure. These HTTP cases are unverified here, not established application regressions. Dedicated real-PostgreSQL tests are skipped without their harness. Browser/pilot/build checks were not run during this assessment.

## Bounded work packages, in order

| Package | Scope | Completion condition |
|---|---|---|
| 1. Stabilize current RC-07 | Inventory dirty/untracked files, resolve type error and practice test/spec mismatch, preserve development data | Type check and focused unit tests pass; explicit list of remaining integration gaps |
| 2. Prove learning progression | Engine/config/server/migrations; immutable issued orders, practice, every stage gate, persistent certifications, replay/transfer | All 150 slots across bands verified; every stage boundary and final certification reachable with earned evidence; restart preserves results; duplicate commands do not duplicate awards |
| 3. Connect teacher evidence | Select one report implementation, wire HTTP route and contracts, complete required teacher filters/drilldowns | Real HTTP/DB report totals reconcile with independently counted fixtures; pending/no-evidence, timezone, transfer and cross-class isolation cases pass; browser shows stored first/final answers |
| 4. Close RC-07 | Targeted browser recovery checks, full regression and updated evidence records | Reviewed checkpoint commit containing source, migrations and tests; current status/contracts/ledger agree; remaining V1 work explicitly listed |

Start with package 1. Keep one active implementation package. The existing PostgreSQL progression journey covers Stage 1→2 and restart; extend coverage to remaining gates instead of assuming that single journey proves all stages. Do not inject already-earned mastery as the sole evidence of gate reachability.

RC-07's exit journey: teacher creates fictional class/student → student completes early levels → practices missing skill → unlocks next stage → accepts a valid nonminimal restricted answer → handles advanced objectives → survives a dropped reply → receives rewards once → teacher sees exact question, first/final vectors and reconciled totals. Combine this browser journey with deterministic and database tests of all remaining stage boundaries and final certification.

## Model and terminal strategy

**Use one active coding model at a time.** My recommended default among this app's exposed models is **Sol at medium reasoning** for packages 1–3. Use **Luna at low or medium** for narrowly specified documentation reconciliation or mechanical changes after behavior is settled. Use **Astra for a bounded review of progression/persistence correctness or a difficult unresolved failure**, then return to the implementation model. Do not keep an Astra coordinator running while other models repeat the same reading.

These are task-fit recommendations, not measured account savings. Official model guidance recommends the lightest model/settings that meet the quality bar; exact account usage savings are not established here. Source: https://developers.openai.com/api/docs/guides/model-selection

Two terminal processes are sufficient during browser verification: one for the isolated pilot and one for tests. An additional terminal is useful only for a genuinely independent command with its own disposable data and ports. Terminal concurrency reduces waiting; multiple model conversations duplicate context and are not inherently usage-efficient.

For each package, give the model a compact brief: objective, authoritative specification sections, exact files, invariants, acceptance commands, current failing output, and stop condition. Read the full spec once; subsequent passes should use relevant sections and the current diff. Preserve a short handoff containing actual results and unresolved issues. Do not continually reread the whole historical task log.

Run focused tests while editing. Run the full unit/integration suite, type check, build, isolated PostgreSQL/restart harness, standard browser suite and secure-pilot journey at the integration checkpoint. Repeat broader checks only after changes invalidate their evidence. Save command output to logs; bring summaries and failures into model context. Avoid polling, open-ended review loops, speculative refactoring, new artwork and rewrites during RC-07.

Escalation rule: after two unsuccessful attempts at the same reproducible failure, hand the stronger model the minimal relevant code, exact failure and attempted fixes. Stop at passing acceptance criteria. Model/session switching must carry a compact handoff, not trigger another project-wide audit.

Parallel model work becomes worth reconsidering only after contracts are stable and independently owned work exists. A possible later pairing is operational tooling versus teacher presentation, in isolated worktrees with one integration owner. It would require intentionally revising the current single-agent policy. It is not recommended for the tightly coupled unfinished RC-07 state.

## Following milestone

After RC-07, complete the local V1 release candidate: guarded backup/restore, retention/deletion and class archive, remaining session/network throttling and expiry work, recovery edge cases, and measured load for 90 synthetic students with 30 coincident submissions. Finish local accessibility/visual checks and evidence reconciliation. School identity/hosting/retention approval, owner aesthetic approval and physical device/network/assistive-technology trials remain separate release gates.
