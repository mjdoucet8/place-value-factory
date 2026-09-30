# Approved factory campus map — 30 September 2026

The owner asked to recreate the newly approved generated map in the Place Value Factory game. The world map now uses its scenery-only clean plate, with the same five landmark stations and connecting conveyors, roads, pipes, water and landscape. All station labels, 30 level buttons, locks, stars, completion medals and the current-level indicator remain semantic HTML driven by existing map data. No sample progress is baked into the artwork. Level coordinates share the image's 1747×900 canvas, scaled uniformly to fit the actual space after headers and banners. The Level list retains full-size controls, original station illustrations and earned cosmetics.

## Verification

- `npx tsc --noEmit`: pass.
- `npm run build`: pass.
- `npm run test:e2e`: **28 passed, 1 existing native-browser-zoom environment skip**.
- `PVF_PILOT_URL=http://127.0.0.1:5181 npx playwright test --config=playwright.pilot.config.ts --grep '30 live map nodes'`: **1 passed**, on the disposable development harness.
- `git diff --check`: pass.
- Inspected the 1920px desktop map, the 1280px gallery baseline and the 390px portrait view. The entire artwork remains visible on small displays, with the existing Level list providing full-size controls.
- Browser checks verify all 30 nodes within the viewport, their click hit targets, undistorted artwork, keyboard activation of locked-level explanations, accurate fixture stars/current level, earned-only medals, switching to/from the full-size list, and Shipping unlock feedback.
- Existing integrated journeys verify actual login, level selection, five saved shipments, results, return to map, next-level keyboard play, pause/resume, settings, reply-loss recovery and teacher evidence against disposable fictional data.
- Refreshed only the intentionally changed map visual baseline. Gameplay/pause/results baselines remain unchanged.
- The first new targeted check used an incorrect expected fixture star count (2 versus the fixture's 3 for Level 1); corrected the assertion after reading the fixture. No game rules were altered.

## Scope and provenance

Source changes: `apps/web/src/screens/MapScreen.tsx`, `apps/web/src/factoryMapLayout.ts`, map-only portions of `apps/web/src/styles.css`, the new art-v3 scenery, map tests and records. Original art assets remain available for other screens and Level list. No server, math, persistence, API, dependency or account configuration changes. The pre-existing modified `apps/server/db/local-development.json` was not included in this work or any checkpoint.

The generated asset and exact prompts are documented in `docs/FACTORY_CAMPUS_ARTWORK.json` and `docs/ASSET_MANIFEST.md`. The image was generated with the built-in image tool, not an application runtime dependency.

## Deployment state

The first production attempt was rejected by automatic approval review and did not execute. The owner then explicitly replied, "Yes, publish the map update," approving the live destination https://math-factory-one.vercel.app/. The approved publish succeeded.

- Deployment: `dpl_9sA8nvMiJNxsrB38T7oQPNgkq1JN`, production, **READY**.
- Stable URL: https://math-factory-one.vercel.app/.
- Implementation commit: `3680b57`.
- Runtime: existing Vite/React client and Node container; remote build completed in 30 seconds.
- Live page, health endpoint and new artwork: HTTP 200.
- Live 2,816,806-byte artwork SHA-256 matches the locally verified asset.
- Live JavaScript `/assets/index-C6fN_EEh.js` references the new campus; live stylesheet `/assets/index-BBLvhwCm.css` contains the matching coordinate layout.
- Deployment-specific error-log query (`--level error --since 10m --limit 10 --json`) returned no error records at verification time. This is a bounded post-deployment observation, not ongoing monitoring.
- No external account settings, database migrations, credentials or saved student progress were changed.
