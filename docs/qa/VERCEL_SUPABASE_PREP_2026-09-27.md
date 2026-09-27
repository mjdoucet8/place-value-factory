# Vercel + Supabase fictional staging preparation — 27 September 2026

## Prepared runtime

- Added root `Dockerfile.vercel` for Vercel container deployment. It builds the existing Vite client, starts the existing Node HTTP server on Vercel's assigned `PORT`, serves static and API routes on one origin, and retains the fictional-staging startup guards.
- Added `vercel.json` with Fluid compute enabled and `.vercelignore` to exclude local data, test output and reference material from the build context.
- Vercel container boot now performs no migration or identity provisioning. Autoscaling instances therefore cannot race to apply schema or create the staging teacher.
- Runtime accepts Vercel/Supabase Marketplace `POSTGRES_URL`; one-time migration and seed prefer `PVF_MIGRATION_DATABASE_URL` or `POSTGRES_URL_NON_POOLING`.
- `PVF_DATABASE_POOL_MAX` is validated from 1–50 and defaults to 1 in staging, limiting each stateless instance's PostgreSQL footprint. Local development retains its existing default.

## Verification

Typecheck and production web build pass. Focused deployment validation accepts the Marketplace PostgreSQL variable, HTTPS staging origin, fictional-only guard and pool size, while rejecting pool size zero. Static/health and runtime database-option tests pass. Full regular regression and final diff checks are recorded in the MVP-VERCEL-05 handoff.

## Remaining external actions

No Vercel or Supabase project, paid resource, database, account link, region, URL or secret was created. The owner must connect the GitHub repository to Vercel and create/link Supabase. After those account actions, run the one-time migration/fictional-teacher setup, configure the stable HTTPS origin and runtime secrets, deploy, then execute the secure browser smoke journey against the staging URL. Production with real identities remains blocked by design.
