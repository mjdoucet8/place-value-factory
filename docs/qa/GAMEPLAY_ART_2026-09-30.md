# Separate gameplay equipment artwork — 30 September 2026

The owner requested implementing the approved gameplay concept, specifically retaining independent crate image files because crates roll off the conveyor when an order ships.

## Implemented

- Twelve standalone transparent images: six dispensers and six crates, in purple, blue, green, amber, magenta and cyan for the six places. Each is a 1254×1254 lossless WebP in `apps/web/public/assets/art-v4/`. Exported pixels were compared with the built-in image generator's original RGBA output and are identical. Total delivery size is 7,709,732 bytes before HTTP compression/cache.
- Dispenser place values remain live text on the navy plaques. Crate counts remain editable number inputs in the large ivory front panels, with visible CRATES labels and separate live plus/minus controls. Responsive input type scales down for six-digit quantities.
- Shared display frames bound the transparent padding without changing the generated art. The moving crate, label, input and buttons share one wrapper; the dispenser is its stationary sibling.
- Existing accepted-shipment save/depart/clear/arrive sequencing is retained. Crate travel now exceeds both the viewport and the minimum conveyor width, fixing the old fixed-distance cutoff on wide displays. No optimistic departure before the server reply; existing incorrect/pending-save behavior is preserved.
- Closed machines retain disabled controls and a visible CLOSED badge. Reduced-motion preferences suppress the conveyor animation. The conveyor remains internally scrollable at narrow widths.

## Verification

- `npx tsc --noEmit`: pass.
- `npm run build`: pass.
- `npm run test:e2e`: **31 passed, 1 existing native-browser-zoom environment skip**.
- `git diff --check`: pass.
- New browser coverage verifies all 12 distinct assets decode, quantities/trades respond, six-digit counts fit the actual cream-panel bounds at 1920/1366/1024/390px, the last input is reachable by focus without page overflow, and closed machines remain disabled.
- A real saved shipment is held at the network boundary to confirm the art remains still while saving. Its actual animation endpoints confirm all crates and counts move beyond the wide viewport while every dispenser retains its exact geometry; the new crates return with zero counts.
- A real shipment under reduced motion completes with no crate animation events.
- Existing integrated coverage passes for five-order completion, keyboard entry and Enter shipping, next mission, totals/feedback, pause/resume, durable save and lost-reply recovery, multi-tab ownership, teacher evidence, map/unlocks, visual contrast checks and gallery states.
- Reviewed desktop (1920px), 1280px baseline, 1024px and 390px renders. Only `handoff-calm-linux.png` was intentionally refreshed; map, pause and results baselines remain unchanged.
- The first layout render exposed an inherited flex rule on the new wrapper, corrected to block layout before the final checks. An initial animation test listened to the last crate endpoint too close to the application's phase timer; asset decoding and the first crate endpoint made the observation deterministic. No timing or math rules were changed to make the tests pass.

## Scope

Frontend artwork, two presentation components, equipment/quantity/conveyor CSS, focused tests, one visual baseline and records. No server, API, scoring, order-generation, persistence, dependency or map changes. Existing dirty `apps/server/db/local-development.json` is excluded from this work and the commit. The full backend/PostgreSQL suites were not repeated for this presentation-only change.

Generation used the built-in image tool. Exact prompts, generated source paths, project delivery paths, dimensions and SHA-256 hashes are in `docs/GAMEPLAY_ARTWORK_V4.json`.

## Publication

Implementation verified locally; production publication is the remaining step.
