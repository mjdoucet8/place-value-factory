# Pilot-readiness baseline and worktree reconciliation

Baseline is committed `4495ae8` on `f410558`, contract v1 and forward migrations 001–010. The current task does not reset the repository. At claim time the worktree already held four uncommitted paths:

| Path | Finding | Disposition |
| --- | --- | --- |
| `TASK_LOG.md` | One RC-07 verification sentence differed from `4495ae8`, saying diff checking was still to be recorded. | Preserve that prior author's sentence as an unstaged change; stage this milestone's claim and handoff separately. |
| `apps/server/src/index.ts` | Broad formatting changes predated this task; semantic V1 changes in `4495ae8` were already committed. | Keep the formatting in the working tree and stage only this task's semantic server changes. Do not overwrite the earlier edit. |
| `apps/server/db/local-development.json` | Development store last modified 22 September; contains existing user work. | Never read into tests, reset, stage or commit it. |
| `.codex/config.toml` | Private local Codex configuration from the earlier single-agent change. | Leave untracked and out of the checkpoint. |

The milestone uses newly created fictional identities and private disposable PostgreSQL clusters. Generated screenshots, logs, archives and credentials live outside the repository unless a deliberately selected, redacted review image is copied into `docs/visual-evidence/`. Current evidence is tracked in `docs/V1_CURRENT_ACCEPTANCE.md`, `docs/qa/`, the task log and the final checkpoint diff. Dated RC-07 prose below current status sections is historical, not a present gap list.
