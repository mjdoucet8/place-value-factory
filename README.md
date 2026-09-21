# Place Value Factory V1

This repository contains a locally runnable, fictional-data implementation of the Place Value Factory Grade 5 game. It is not approved for real students: production identity, hosting, retention decisions, a real PostgreSQL service, and classroom-device/network evidence remain external prerequisites.

Start with AGENTS.md and the technical specification in `Place_Value_Factory_Codex_Handoff/Math_Factory/docs/`. Root PROJECT_STATUS.md, TASK_LOG.md, DECISIONS.md and API_CONTRACTS.md coordinate implementation. `docs/COMPLETION_CHECKLIST.md` records the verified local scope and remaining limits.

Extract the ZIP and put the contents of Math_Factory/ in the intended project root. If that repository already contains these files, review and merge rather than overwriting work. Open Codex from that root and ask it to read AGENTS.md and the specification, inspect all four images, claim PA-01, and begin the dependency-ordered roadmap with the pure math engine and independent tests.

Five named agents are development roles. One session can perform them sequentially. The document does not require five terminals or introduce five runtime AI services.

No install/start commands exist until the application is scaffolded. The foundation task must add actual dependency, migration, seed, test and run commands here, verify them, and use fictional student accounts. Do not claim a working application from these documents alone.

## Local development (fictional data only)

Requires Node 22/npm 10.

```bash
npm install
npm test
npx tsc --noEmit
npm run build
npm run test:e2e
npm run dev
```

`npm run dev` starts the API at http://127.0.0.1:3101 and the web app at http://127.0.0.1:5181. The test suite includes deterministic math/oracle tests, fictional API journey/restart tests, idempotency/lease/help/skip/transfer coverage, and a pg-mem repository transaction test.

Fictional student: `FACTORY5` / `ava` / `123456`; teacher: `teacher` / `factory-demo`. `db/local-development.json` is a server-owned development-only store, never a production student database. Do not put real student records or credentials in it.

### PostgreSQL preparation

The first forward migration is in `db/migrations/`. With a provisioned PostgreSQL 15+ database, set `DATABASE_URL` and run `npm run db:migrate --workspace=@place-value-factory/server`. No PostgreSQL service is bundled with this repository, and the JSON adapter remains the active local-development backend; it must not be selected for production.
