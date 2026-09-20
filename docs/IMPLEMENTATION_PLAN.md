# Place Value Factory implementation plan

## Frozen boundaries

`packages/contracts` owns published data shapes. `packages/game-engine` is pure and runs in both browser and server. `packages/config` will own immutable level and skill definitions. `apps/server` owns identity, stored orders, responses, evidence and authority. `apps/web` owns draft interaction and rendering. QA owns independent oracles and cross-boundary tests.

## Dependency-ordered bounded tasks

| Order | Task / role | Scope | Depends on | Exit evidence |
| --- | --- | --- | --- | --- |
| 0 | PA-01 Product/Architecture | stack, ownership, contracts, roadmap | handoff | recorded decisions and pinned lockfile |
| 1 | GL-01 Game Logic | strict vectors, validation, minimums | contract v1 | fixture and property tests |
| 1 | QA-01 QA | independent DP oracle and acceptance matrix | fixture | oracle agrees on all subsets ≤2,000 |
| 2 | GL-02 Game Logic | config-backed deterministic order generation | GL-01/config | valid witness for every seed/slot |
| 2 | BE-01 Backend/Data | fictional identity adapter and repository interface | PA-01 | login/isolation tests |
| 2 | FE-01 Frontend/Game UX | semantic six-machine editor with fixture adapter | contract v1 | keyboard/manual UI checks |
| 3 | BE-02 Backend/Data | Postgres migrations, attempts, receipts, leases | GL-02/BE-01 | transaction/idempotency tests |
| 3 | FE-02 Frontend/Game UX | server binding, pending state and one-command outbox | BE-02 | reload/drop-reply checks |
| 3 | QA-02 QA | end-to-end first-level flow | FE-02/BE-02 | fresh login → five saved orders → report |
| 4 | GL-03 Game Logic | evidence, mastery, adaptation and gates | durable responses | policy fixtures |
| 4 | BE-03 Backend/Data | report aggregates and authorization | GL-03 | cross-class/report reconciliation |
| 4 | FE-03 Frontend/Game UX | progress, practice and teacher report UX | BE-03 | semantic screen review |
| 5 | GL-04 + FE-04 | advanced restrictions, exchange/two-way UI | GL-03 | all Stage 3–6 fixtures |
| 6 | QA-03 + PA-02 | recovery, access, reflow, device/load, acceptance reconciliation | prior tasks | evidence register; no unverified claims |

The present checkpoint completes PA-01, GL-01 and QA-01 at logic-verified level, with a deliberately narrow JSON-backed development demonstration for FE-01/BE-01. It does not close their full production exit evidence.
