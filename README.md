# Place Value Factory V1

This repository contains a locally runnable, fictional-data implementation of the Place Value Factory Grade 5 game. It is not approved for real students: production identity, hosting, retention decisions, a real PostgreSQL service, and classroom-device/network evidence remain external prerequisites.

Start with AGENTS.md and the technical specification in `Place_Value_Factory_Codex_Handoff/Math_Factory/docs/`. Root PROJECT_STATUS.md, TASK_LOG.md, DECISIONS.md and API_CONTRACTS.md coordinate implementation. `docs/COMPLETION_CHECKLIST.md` records the verified local scope and remaining limits.

Five named agents are development roles. One session can perform them sequentially; they are not runtime AI services. The local application is implemented, but school deployment and real-student use remain unapproved.

## Local development (fictional data only)

Requires Node 22/npm 10.

```bash
npm install
npm test
npx tsc --noEmit
npm run build
npm run test:e2e
npm run test:postgres
npm run test:load
npm run test:sustained
npm run dev
```

`npm run dev` starts the API at http://127.0.0.1:3101 and the web app at http://127.0.0.1:5181. The test suite includes deterministic math/oracle tests, fictional API journey/restart tests, idempotency/lease/help/skip/transfer coverage, and a pg-mem repository transaction test.

The browser stores one pending answer or help request per student attempt in IndexedDB before sending it. A refresh or restored connection retries the same command ID. The screen distinguishes work waiting on the device from server-confirmed progress and offers a retry button. If IndexedDB is unavailable, direct play still works with an explicit warning that a refresh may lose an unconfirmed request. `npm run test:e2e` creates a new disposable fictional store in `/tmp`; its test-only control resets only that newly created store between browser cases. The suite does not clear `apps/server/db/local-development.json`.

`npm run test:sustained` currently exits nonzero on the predeclared full-detail teacher-report p95 target (last retained run: 1,042 ms versus 500 ms). It still verifies the final fictional counts, cross-process duplicate receipts, class isolation and rewards before asserting latency. See `docs/qa/CLASSROOM_LOAD_2026-09-26.md`; the short fresh-data `test:load` pass does not close this pilot-readiness blocker.

### Pre-art visual development

The development-only state gallery is available at http://127.0.0.1:5181/dev/place-value-factory/states. It renders deterministic fictional map, introduction, progress, gameplay, recovery, error and results states using the same components as the application. See `docs/VISUAL_STATE_GALLERY.md` for stable fixture names and `docs/ASSET_MANIFEST.md` for required provenance. Use this surface when integrating original artwork; never paint live text, quantities, controls, stars or level status into background images.

Fictional student: `FACTORY5` / `ava` / `123456`; teacher: `teacher` / `factory-demo`. `db/local-development.json` is a server-owned development-only store, never a production student database. Do not put real student records or credentials in it.

### PostgreSQL preparation

For an isolated, fictional-data secure local pilot, run `npm run pilot:local` (installed PostgreSQL 16 binaries required). Open the printed loopback URL and use the teacher credentials from the printed private `pilot-private.json` path. Create a class and issue fictional student access. Stop with Ctrl+C; use the printed `npm run pilot:local -- /tmp/pvf-pilot-...` command to resume the same database. Nothing is reset and no existing database is used. The private file includes a PIN-receipt encryption key: do not commit or publish it. This is a development preview, not production hosting or approval for real students.

Repeat its browser journey with `PVF_PILOT_CREDENTIALS=/tmp/pvf-pilot-.../pilot-private.json npx playwright test -c playwright.pilot.config.ts`. It adds fictional classes/students to that isolated pilot and verifies session-backed play, reporting, queued-work revocation and archive. For guarded encrypted backup/restore, retention/deletion and expired-secret cleanup, follow `docs/OPERATIONS.md`. For measured local load, see `docs/qa/CLASSROOM_LOAD_2026-09-26.md`.

Forward migrations are in `db/migrations/`. For a new, authorized fictional-data PostgreSQL 15+ database, set `DATABASE_URL` and run `npm run db:migrate --workspace=@place-value-factory/server`, then `npm run dev`. PostgreSQL failures never fall back to JSON. Without it, the development-only JSON adapter remains available. Existing JSON data is not automatically imported or rewritten. Secure mode requires `PVF_AUTH=local`, `PVF_ORIGIN` and a private 64-hex-character `PVF_RECEIPT_KEY` in addition to PostgreSQL; the launcher supplies these. Pilot/production startup rejects the development identity adapter. Do not use real student data.

Run `npm run test:postgres` for isolated real-database verification. It uses installed PostgreSQL 16 binaries (`PVF_POSTGRES_BIN` can select another binary directory), creates a new user-owned cluster under `/tmp/pvf-postgres-test-*`, permits peer-authenticated connections only on its private Unix socket, and disables TCP. It never reads `DATABASE_URL`, resets existing databases or requires sudo. Tests cover rollback, concurrent duplicate receipts and a real database process restart. The cluster is stopped afterward; temporary files are retained for diagnostics. `npm test` deliberately skips this dedicated real-database test unless the harness supplies its private socket.

For the secure fictional browser pilot, start `npm run pilot:local` in one terminal, then run `PVF_PILOT_CREDENTIALS=/tmp/pvf-pilot-.../pilot-private.json npx playwright test --config=playwright.pilot.config.ts` in another, using the exact private path printed by the launcher. Stop the pilot with Ctrl+C. Starting a new launcher without an argument makes a fresh isolated pilot; the old directory is preserved. See `docs/PILOT_OPERATOR_GUIDE.md`, `docs/PILOT_VISUAL_REVIEW.md` and `docs/DEPLOYMENT_READINESS.md` for the rehearsal, owner review and remaining deployment decisions. The RC-07 database harness completes all 30 path levels and practices missing stage skills through HTTP submissions; the browser pilot covers provision, gameplay, practice, interrupted save, teacher evidence, revocation and archive.

### Private fictional staging

`Dockerfile` packages the built web client and API as one service. The container runs migrations, provisions one fictional teacher on an empty database, serves browser routes and `/api`, and reports health at `/api/healthz`. Supply an HTTPS `PVF_ORIGIN`, persistent PostgreSQL `DATABASE_URL`, a private 64-hex `PVF_RECEIPT_KEY`, and first-start `PVF_STAGING_TEACHER_USERNAME`/`PVF_STAGING_TEACHER_PASSWORD` secrets. Keep the image defaults `PVF_MODE=staging`, `PVF_AUTH=local` and `PVF_FICTIONAL_ONLY=true`. Do not use real student data. Production mode continues to refuse startup until the school identity adapter is implemented.

For Vercel, `Dockerfile.vercel` runs only the stateless web/API process on Vercel's assigned `PORT`; it deliberately does not migrate or seed during container boot. `vercel.json` enables Fluid compute. A linked Supabase Marketplace database can provide `POSTGRES_URL` for runtime and `POSTGRES_URL_NON_POOLING` for one-time administration; explicit `DATABASE_URL` and `PVF_MIGRATION_DATABASE_URL` take precedence. Before the first deployment, run `npm run staging:seed` once from an authorized administrator environment with the direct migration URL and the fictional teacher credentials. The command applies forward migrations and provisions at most one teacher without printing its password. Vercel runtime configuration requires the stable HTTPS `PVF_ORIGIN`, `PVF_RECEIPT_KEY`, `PVF_MODE=staging`, `PVF_AUTH=local`, `PVF_FICTIONAL_ONLY=true`, `PVF_DATABASE_POOL_MAX=1` and the pooled PostgreSQL URL. Do not place the staging teacher password in the Vercel runtime after first provisioning.
