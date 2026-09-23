# Place Value Factory artwork handoff

Created 22 September 2026 using the built-in OpenAI image-generation tool and the imagegen skill. This delivery supplies the artwork; application-wide layout, state wiring, animation and accessibility approval remain the visual integration milestone.

## Files

All new files are in `apps/web/public/assets/art-v1/`. Each asset has its original 1254×1254 transparent PNG and a smaller transparent WebP. Use WebP in the application; keep PNG as the source master. Zone WebPs are 768×768; other WebPs are 512×512. All assets were visually inspected. Alpha channels are checked during export. Final owner visual approval is pending.

Open `apps/web/public/assets/art-v1/index.html` to browse the complete pack. Exact prompts and generation-source paths are in `docs/ARTWORK_PROMPTS.json`.

## Inventory

- `mascot-welcome.webp` / `mascot-welcome.png`
- `mascot-instruct.webp` / `mascot-instruct.png`
- `mascot-help.webp` / `mascot-help.png`
- `mascot-correct.webp` / `mascot-correct.png`
- `mascot-encourage.webp` / `mascot-encourage.png`
- `mascot-celebrate.webp` / `mascot-celebrate.png`
- `zone-receiving.webp` / `zone-receiving.png`
- `zone-packing.webp` / `zone-packing.png`
- `zone-warehouse.webp` / `zone-warehouse.png`
- `zone-shipping.webp` / `zone-shipping.png`
- `zone-lab.webp` / `zone-lab.png`
- `prop-waiting-pallet.webp` / `prop-waiting-pallet.png`
- `prop-conveyor.webp` / `prop-conveyor.png`
- `prop-pipes-gauge.webp` / `prop-pipes-gauge.png`
- `prop-activity-light.webp` / `prop-activity-light.png`
- `prop-shipment.webp` / `prop-shipment.png`
- `cosmetic-crane.webp` / `cosmetic-crane.png`
- `cosmetic-sign.webp` / `cosmetic-sign.png`
- `cosmetic-shelves.webp` / `cosmetic-shelves.png`
- `cosmetic-loading-bay.webp` / `cosmetic-loading-bay.png`
- `cosmetic-lab-equipment.webp` / `cosmetic-lab-equipment.png`
- `effect-steam.webp` / `effect-steam.png`
- `effect-celebration.webp` / `effect-celebration.png`

## Screen and state mapping

- Welcome mascot: login, map introduction, level introduction, empty progress.
- Instruct mascot: ordinary play and explaining an objective.
- Help mascot: help dialog and hints.
- Correct mascot: accepted-answer acknowledgement, paired with live saved-state text.
- Encourage mascot: incorrect answers and recovery messages. Never use artwork as the only error message.
- Celebrate mascot: both two-star and three-star results. Stars remain live HTML/SVG.
- Five buildings: Receiving (levels 1–4), Packing (5–9), Warehouse (10–15), Shipping (16–21), Lab (22–30). These are the actual configured zones; the names previously suggested in conversation were illustrative and are superseded by the handoff names.
- Pallet + conveyor + shipment: combine as layered decorative busy-lane pieces. Maximum two waiting pallets under the handoff policy. Do not treat visible decorative boxes as the student's mathematical quantities.
- Pipes/gauge + activity light + steam: optional busy scenery. Gauge is ornamental, not a timer or score. No strobing.
- Sign, crane, shelves, loading bay, lab equipment: the five zone-completion cosmetics. Sign copy is live text; glow may be added in CSS.
- Celebration effect: sparse confetti/glints, used around an opaque results panel. The four-point glints are decorative and are not the five-point earned-star rating.

## Existing scenes to retain

- `apps/web/public/assets/gameplay-calm-factory.png`
- `apps/web/public/assets/factory-map-environment.png`
- `apps/web/public/assets/results-celebration-factory.png`

The map scene already contains buildings. Avoid visually duplicating those buildings when positioning the new cutouts; use the cutouts in zone cards or compose a deliberate map layout. Preserve the original mascot pose sheet as source reference, but replace its current direct display with an individual pose during integration.

## Integration rules

Use `object-fit: contain`, never crop the mascot or building silhouettes. Give each image explicit dimensions to avoid layout shifts. Treat these as decorative (`alt=""`); live text supplies meaning. Load only the needed assets, lazy-load offscreen buildings, and do not preload the entire pack. Reuse poses on supporting screens rather than generating redundant backgrounds.

Keep machine controls, denomination colors and symbols, numerical crates, equations, buttons, check marks, warning labels, locks, level nodes, progress and stars in accessible HTML/CSS/SVG. Simple activation glows and status effects are code-native. Their omission from this raster pack is intentional.

For reduced motion, keep a static mascot and hide moving steam/confetti/conveyor effects. Calm mode removes busy decoration. Restricted mathematics is an objective state, not a separate pressure setting; artwork must never hide or imply unavailable denominations.

## Delivery boundaries

These are original generated project assets based on the supplied project references; no third-party stock was used. PNG masters are preserved with generation metadata. WebP copies are mechanical delivery derivatives. Exact source prompts are recorded. This is asset-ready evidence, not a claim that the full website visual milestone or classroom release is complete.
