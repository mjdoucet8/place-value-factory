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

### Pre-art visual development

The development-only state gallery is available at http://127.0.0.1:5181/dev/place-value-factory/states. It renders deterministic fictional map, introduction, progress, gameplay, recovery, error and results states using the same components as the application. See `docs/VISUAL_STATE_GALLERY.md` for stable fixture names and `docs/ASSET_MANIFEST.md` for required provenance. Use this surface when integrating original artwork; never paint live text, quantities, controls, stars or level status into background images.

Fictional student: `FACTORY5` / `ava` / `123456`; teacher: `teacher` / `factory-demo`. `db/local-development.json` is a server-owned development-only store, never a production student database. Do not put real student records or credentials in it.

### PostgreSQL preparation

For an isolated, fictional-data secure local pilot, run `npm run pilot:local` (installed PostgreSQL 16 binaries required). Open the printed loopback URL and use the teacher credentials from the printed private `pilot-private.json` path. Create a class and issue fictional student access. Stop with Ctrl+C; use the printed `npm run pilot:local -- /tmp/pvf-pilot-...` command to resume the same database. Nothing is reset and no existing database is used. The private file includes a PIN-receipt encryption key: do not commit or publish it. This is a development preview, not production hosting or approval for real students.

Repeat its browser journey with `PVF_PILOT_CREDENTIALS=/tmp/pvf-pilot-.../pilot-private.json npx playwright test -c playwright.pilot.config.ts`. It adds fictional classes/students to that isolated pilot and verifies session-backed play/reporting/revocation. Complete visual acceptance, recovery and operational release checks remain in progress.

Forward migrations are in `db/migrations/`. For a new, authorized fictional-data PostgreSQL 15+ database, set `DATABASE_URL` and run `npm run db:migrate --workspace=@place-value-factory/server`, then `npm run dev`. PostgreSQL failures never fall back to JSON. Without it, the development-only JSON adapter remains available. Existing JSON data is not automatically imported or rewritten. Secure mode requires `PVF_AUTH=local`, `PVF_ORIGIN` and a private 64-hex-character `PVF_RECEIPT_KEY` in addition to PostgreSQL; the launcher supplies these. Pilot/production startup rejects the development identity adapter. Do not use real student data.

Run `npm run test:postgres` for isolated real-database verification. It uses installed PostgreSQL 16 binaries (`PVF_POSTGRES_BIN` can select another binary directory), creates a new user-owned cluster under `/tmp/pvf-postgres-test-*`, permits peer-authenticated connections only on its private Unix socket, and disables TCP. It never reads `DATABASE_URL`, resets existing databases or requires sudo. Tests cover rollback, concurrent duplicate receipts and a real database process restart. The cluster is stopped afterward; temporary files are retained for diagnostics. `npm test` deliberately skips this dedicated real-database test unless the harness supplies its private socket.
