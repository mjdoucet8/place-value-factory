# Place Value Factory - development coordination

Version 1.0 | 20 September 2026 | Specification-only handoff

## Purpose and authority

These five agents are development roles, not runtime game agents. One Codex session may perform all roles sequentially. Separate terminals are not required. If the environment supports authorized parallel workers, use bounded tasks with explicit ownership; this file does not imply that any workers are already running.

Owner requirements govern. Read docs/Place_Value_Factory_V1_Product_Technical_Specification.md, this file, PROJECT_STATUS.md, TASK_LOG.md, DECISIONS.md and API_CONTRACTS.md before claiming work. Inspect the relevant full PNG in design/ before UI work. Audit existing code and instructions before scaffolding; never replace an existing application or platform identity system without understanding it.

## Roles and primary file ownership

| Role | Responsibilities | Primary ownership |
| --- | --- | --- |
| Product / Architecture (PA) | Scope, architecture, dependency board, contract coordination, integration and honest status | docs/, DECISIONS.md, PROJECT_STATUS.md, AGENTS.md, repository setup |
| Frontend / Game UX (FE) | Student/teacher screens, semantic controls, factory art, animations, responsiveness and accessibility | apps/web/, design implementation assets |
| Backend / Data (BE) | Identity adapter, class/roster, authorization, APIs, transactions, receipts, reporting, migrations | apps/server/, db/ |
| Game Logic / Adaptive Learning (GL) | Deterministic generator, validator, minimum crates, evidence, mastery, scheduling and progression | packages/game-engine/, packages/config/ |
| QA | Independent math oracle, integration/E2E, recovery, isolation, accessibility, load and device evidence | tests/integration/, tests/e2e/, tests/oracles/, docs/qa/ |

Module unit tests belong with their owning module. QA reviews coverage rather than becoming the only person allowed to test. packages/contracts/, API_CONTRACTS.md, root manifests, lockfiles, shared fixtures and CI are coordinated shared files with one named editor per task. The five initial root documents are the baseline, not generated application state.

## Claiming and coordination

1. Read latest status/log and relevant code; identify prerequisites and acceptance IDs.
2. Append a CLAIM entry to TASK_LOG.md naming unique task ID, role, goal, exact owned paths, dependencies and expected outputs. An orchestrator/integrator serializes shared-log claims when workers cannot safely append concurrently.
3. Check overlapping claims. If a conflict exists, narrow paths or agree transfer with the current owner. Do not overwrite another worker's branch or uncommitted files.
4. Use an isolated branch/worktree where the environment supports it. Worktrees do not remove logical conflicts in schemas or migrations.
5. Implement the bounded task; update relevant documentation and fixtures when behavior changes. Never silently change accepted requirements to make a test pass.
6. Run tests appropriate to the change and append HANDOFF with actual commands/results and limitations. A rendered mock is not integrated completion.
7. QA or the designated reviewer checks acceptance evidence; PA integrates in dependency order and updates PROJECT_STATUS.md. Close with a DONE entry only at the stated evidence level.

## Contract-change workflow

Propose the changed request/response and reason in DECISIONS.md (recommendation pending, not accepted user requirement). PA names one contract editor; FE/BE/GL affected owners review. Update API_CONTRACTS.md, packages/contracts schemas and golden examples together. Identify migration/version compatibility. Implement producer and consumer changes behind a coherent version boundary. QA checks both sides and recovery. Do not independently rename shared fields in different branches.

## Required invariants

- All mathematical decisions are deterministic application code; no LLM.
- Ordinary correct representations ship even when nonminimal. Explicit objective misses acknowledge correct totals.
- Generated orders have valid whole-crate witnesses; no impossible 42,000-only-10,000 question.
- Speed, accessibility supports and network failure do not lower mastery or stars.
- One CURRENT ORDER panel; no separate Orders panel; semantic controls, not screenshots.
- First response remains immutable; server recomputes educational state; idempotency prevents duplicate awards.
- Student/class isolation applies to every route, including cached receipts and reports.
- Preserve user work and secrets. Use fictional users in development.

## Testing before handoff

GL: deterministic fixtures, generation properties, minimum oracle and mastery/gate scenarios. BE: schema validation, authorization, transaction rollback, duplicate keys, leases and persistence. FE: actual keyboard interaction, loading/error states, responsive sizes, reduced motion and engine binding; use screenshots for visual evidence. QA: real integrated flows and explicit fault injection, not only mocks. PA: requirements/contract/status consistency and dependency review.

Record NOT RUN honestly when a device, service or school network is unavailable; do not claim classroom readiness. Runtime tests do not exist at initial handoff. Add repeatable commands to README after scaffolding. Do not invent passing commands in the log.

## Task record template

- Event: CLAIM / UPDATE / HANDOFF / REVIEW / DONE / BLOCKED
- Task ID and role:
- Timestamp (UTC):
- Goal and scope:
- Owned paths:
- Dependencies and contract version:
- Acceptance IDs:
- Changes and artifacts:
- Commands/manual checks and observed results:
- Evidence level: visual mock / logic verified / integrated / classroom tested
- Remaining risks or blockers:
- Next owner / reviewer:

## Initial bounded examples

PA-01: reconcile current repository against baseline, record stack/identity recommendation; owns docs/status/decisions; enables all tasks.
GL-01: implement validateRepresentation and greedyMinimum in packages/game-engine; owns math unit tests; depends contract v1; VALIDATE-01..05.
FE-01: six labelled machine controls and quantity editor with Ship, Clear/Undo and keyboard flow; owns apps/web/game; uses frozen fixture adapter; GAME-02..07.
BE-01: identity adapter and class/student isolation migrations; owns apps/server/auth and db; LOGIN/SEC/ROSTER criteria.
QA-01: independent small-target dynamic-programming oracle and acceptance register; owns tests/oracles and docs/qa; no production validator edits.

Conflict resolution: stop only overlapping edits, not unrelated progress; notify PA with both assumptions and concrete options. Accepted product changes require owner decision. Routine implementation choices can follow labelled baselines. Final handoff includes commit, files, tests, contract impact and limitations; shared status is updated by PA after review.
