# Vercel and Supabase fictional staging deployment — 2026-09-27

Math Factory is deployed as a guarded fictional-data staging service at `https://math-factory-one.vercel.app`.

## Resources

- Vercel project: `rostersports/math-factory`
- Git source: `mjdoucet8/place-value-factory`, production branch `main`
- Vercel runtime: Container preset with Fluid compute, built from `Dockerfile.vercel`
- Supabase resource: `supabase-charcoal-feather`, connected through Vercel Marketplace
- Database: forward migrations applied once through the direct Supabase URL; the autoscaling container does not migrate or seed during startup
- Identity: one fictional staging teacher provisioned; its credentials are stored locally with mode `0600` at `/home/owner/.config/math-factory/staging-credentials.json`

## Runtime configuration

Vercel holds the pooled PostgreSQL URL as a secret and uses Supabase's documented encrypted `sslmode=require` compatibility semantics. Runtime is guarded by `PVF_MODE=staging`, `PVF_AUTH=local`, `PVF_FICTIONAL_ONLY=true`, `PVF_DATABASE_POOL_MAX=1`, the stable HTTPS origin, and a private receipt key. The staging teacher password is not stored in Vercel runtime configuration.

## Verification

- Production deployment status: Ready
- Stable alias: `https://math-factory-one.vercel.app`
- `/api/healthz`: HTTP success with `{ "status": "ok" }`
- Live fictional-data smoke: teacher login passed; class and student access issuance passed; student login passed; all 30 map levels loaded; the temporary class was archived after verification
- Local `.env.local` and the durable teacher credentials file are both mode `0600` and excluded from Git

The first deployment failed before release because the newly created Vercel project selected the generic static-site preset. The project was switched to Vercel's Container preset and its build/output overrides reset; the subsequent container deployment and origin-corrected redeployment succeeded.

## Scope

This is an MVP review surface for fictional data. Production with real student identities remains blocked until the school identity adapter, data governance, retention, backup custody, operational monitoring and school approvals are complete.
