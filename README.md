# Place Value Factory - Codex handoff

**Specification only; no game application is implemented in this package.**

Start with AGENTS.md and docs/Place_Value_Factory_V1_Product_Technical_Specification.md. The PDF is the formatted reading copy. Root PROJECT_STATUS.md, TASK_LOG.md, DECISIONS.md and API_CONTRACTS.md coordinate implementation. Original visual references are in design/ with exact filenames. Expected math cases are in tests/fixtures/math_cases.json; this is fixture data, not a runnable application test suite.

Extract the ZIP and put the contents of Math_Factory/ in the intended project root. If that repository already contains these files, review and merge rather than overwriting work. Open Codex from that root and ask it to read AGENTS.md and the specification, inspect all four images, claim PA-01, and begin the dependency-ordered roadmap with the pure math engine and independent tests.

Five named agents are development roles. One session can perform them sequentially. The document does not require five terminals or introduce five runtime AI services.

No install/start commands exist until the application is scaffolded. The foundation task must add actual dependency, migration, seed, test and run commands here, verify them, and use fictional student accounts. Do not claim a working application from these documents alone.


## Local development (fictional data only)

Requires Node 22/npm 10. Run `npm install`, `npm test`, `npx tsc --noEmit`, and `npm run build`. Start the API with `npm run start --workspace=-value-factory/server` (port 3101) and the web app with `npm run dev --workspace=-value-factory/web` (port 5173).

Fictional student: `FACTORY5` / `ava` / `123456`; teacher: `teacher` / `factory-demo`. `db/local-development.json` is a server-owned development-only store, never a production student database.
