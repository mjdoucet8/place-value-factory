# Original art asset manifest

Three generated scene backgrounds and a mascot source sheet have an initial screen integration. The complete 23-asset transparent pack in `apps/web/public/assets/art-v1/` is integrated through the reusable `FactoryArt` presentation component; see `ARTWORK_HANDOFF.md`, `ARTWORK_PROMPTS.json` and the pack's `index.html` preview. Final owner visual approval remains pending.

| Asset ID                | File                                                 | Screen/component                             | Purpose and safe area                                                           | Creator/tool            | Prompt/source revision                                                              | Created    | License/approval                                          | Accessibility behavior                                                                          |
| ----------------------- | ---------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| mascot-pose-sheet       | `apps/web/public/assets/mascot-pose-sheet.png`       | Gameplay robot guide; future state reactions | 1536×1024 RGBA pose sheet; crop in CSS, decorative only                         | OpenAI image generation | Original rounded white/navy/orange math-factory robot pose-sheet prompt, revision 1 | 2026-09-22 | Original generated project asset, pending visual approval | Empty alt; never conveys required instruction alone; motion disabled under reduced-motion       |
| gameplay-calm-factory   | `apps/web/public/assets/gameplay-calm-factory.png`   | Gameplay calm background                     | 1672×940 RGB wide scene with central safe area for live controls                | OpenAI image generation | Original warm factory interior, no UI/text/characters, revision 1                   | 2026-09-22 | Original generated project asset, pending visual approval | Decorative CSS background; hidden from assistive tech; contrast maintained by live cream panels |
| factory-map-environment | `apps/web/public/assets/factory-map-environment.png` | Factory map                                  | 1536×1024 RGB landscape with five building silhouettes and empty overlay spaces | OpenAI image generation | Original connected factory landscape prompt, revision 1                             | 2026-09-22 | Original generated project asset, pending visual approval | Decorative CSS only; nodes and labels remain semantic live HTML                                 |

| results-celebration-factory | `apps/web/public/assets/results-celebration-factory.png` | Results screen | 1672×941 RGB celebration scene, empty center for live result data | OpenAI image generation | Original factory celebration prompt, revision 1 | 2026-09-22 | Original generated asset, pending visual approval | Decorative CSS only; stars/results remain semantic HTML |

## Integration rules

- Artwork is decorative unless an equivalent text label and semantic control exist.
- Never bake student-specific text, quantities, equations, level numbers, stars, progress or buttons into artwork.
- Keep transparent source masters and optimized web derivatives; record both filenames in the row.
- Record every meaningful prompt/reference revision so a consistent set can be regenerated.
- Confirm contrast, crop behavior, reduced-motion behavior and ownership approval before marking an asset approved.

## Transparent artwork pack — 22 September 2026

All filenames below are relative to `apps/web/public/assets/art-v1/`. Each item retains a 1254×1254 transparent PNG master and uses the listed alpha-preserving WebP delivery size. Creator/provenance: built-in OpenAI image generation, with the concise generation prompts in `ARTWORK_PROMPTS.json`. The images are decorative (`alt=""`, `aria-hidden`) and have explicit dimensions; live labels, stars, locks, quantities, controls and feedback remain HTML. Busy props/effects are hidden in calm and reduced-motion presentation.

| Asset files (PNG / WebP)                                 | Delivery dimensions | Purpose and live location                                 | Responsive / accessibility treatment                                       |
| -------------------------------------------------------- | ------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------- |
| mascot-welcome.png / mascot-welcome.webp                 | 512×512             | Welcome, login, map, level intro, empty and paused states | Contained at 96–150px; decorative and floating only outside reduced motion |
| mascot-instruct.png / mascot-instruct.webp               | 512×512             | Gameplay guide, progress and teacher header               | Contained; instructions remain adjacent live text                          |
| mascot-help.png / mascot-help.webp                       | 512×512             | Help dialog and settings                                  | Contained; dialog semantics and keyboard flow remain native                |
| mascot-correct.png / mascot-correct.webp                 | 512×512             | Accepted-answer feedback                                  | Contained; status message is a live `role=status` region                   |
| mascot-encourage.png / mascot-encourage.webp             | 512×512             | Incorrect, offline and error feedback                     | Contained; error/correction copy remains live                              |
| mascot-celebrate.png / mascot-celebrate.webp             | 512×512             | Two- and three-star results                               | Contained; rating stays live accessible text                               |
| zone-receiving.png / zone-receiving.webp                 | 768×768             | Receiving map zone card                                   | Lazy loaded, contained; level buttons/locks are HTML                       |
| zone-packing.png / zone-packing.webp                     | 768×768             | Packing map zone card                                     | Lazy loaded, contained; CSS desaturates locked state                       |
| zone-warehouse.png / zone-warehouse.webp                 | 768×768             | Warehouse map zone card                                   | Lazy loaded, contained; CSS desaturates locked state                       |
| zone-shipping.png / zone-shipping.webp                   | 768×768             | Shipping map zone card                                    | Lazy loaded, contained; CSS desaturates locked state                       |
| zone-lab.png / zone-lab.webp                             | 768×768             | Lab map zone card                                         | Lazy loaded, contained; CSS desaturates locked state                       |
| prop-waiting-pallet.png / prop-waiting-pallet.webp       | 512×512             | Busy gameplay lower-right scenery                         | Busy only; no interaction or math cue                                      |
| prop-conveyor.png / prop-conveyor.webp                   | 512×512             | Busy gameplay lower-left scenery                          | Busy only; restrained motion disabled when reduced                         |
| prop-pipes-gauge.png / prop-pipes-gauge.webp             | 512×512             | Busy gameplay upper-right scenery                         | Busy only; decorative and behind controls                                  |
| prop-activity-light.png / prop-activity-light.webp       | 512×512             | Busy gameplay activity detail                             | Busy only; blink disabled when reduced                                     |
| prop-shipment.png / prop-shipment.webp                   | 512×512             | Busy gameplay shipping detail                             | Busy only; decorative                                                      |
| cosmetic-crane.png / cosmetic-crane.webp                 | 512×512             | Earned Packing map-zone accent                            | Lazy loaded; decorative; only after all zone levels are completed           |
| cosmetic-sign.png / cosmetic-sign.webp                   | 512×512             | Receiving map-zone accent                                 | Lazy loaded; decorative, no readable artwork text used                     |
| cosmetic-shelves.png / cosmetic-shelves.webp             | 512×512             | Earned Warehouse map-zone accent                          | Lazy loaded; decorative; only after all zone levels are completed           |
| cosmetic-loading-bay.png / cosmetic-loading-bay.webp     | 512×512             | Shipping map-zone accent                                  | Lazy loaded; decorative                                                    |
| cosmetic-lab-equipment.png / cosmetic-lab-equipment.webp | 512×512             | Lab map-zone accent                                       | Lazy loaded; decorative                                                    |
| effect-steam.png / effect-steam.webp                     | 512×512             | Busy gameplay ambience                                    | Busy only; motion and image hidden under reduced motion                    |
| effect-celebration.png / effect-celebration.webp         | 512×512             | Results celebration backdrop                              | Decorative; hidden under reduced motion, stars remain live                 |

## 2026-09-30 — Approved connected factory campus

`apps/web/public/assets/art-v3/factory-campus.png` is the 1747×900 scenery-only edit of the owner's approved generated map. Built with the built-in image generator; exact prompts and provenance are retained in `docs/FACTORY_CAMPUS_ARTWORK.json`. Its five station buildings, conveyors, roads, water and landscape form one composition. It contains no level buttons, digits, locks, stars, station nameplates or current-level indicators.

The live world map uses this scene with semantic HTML controls in the same coordinate system (`apps/web/src/factoryMapLayout.ts`). All 30 nodes, station names, earned stars, locks, completion medals and the current level come from existing game data. The complete scene fits the available viewport without cropping or distortion. The full-size Level list retains the original art-v1 station illustrations and earned cosmetics. Scenery itself is neutral infrastructure, not a saved achievement. No gameplay, scoring, persistence or API changes.
