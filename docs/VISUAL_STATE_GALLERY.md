# Visual state gallery

The development-only gallery at `/dev/place-value-factory/states` renders deterministic, fictional states without changing student progress. Use the **Visual state** selector or append `?fixture=<name>` for a stable browser target.

## Fixture inventory

- Structure: `map`, `map-resume`, `level-intro`, `progress`, `loading`, `error`, `empty`.
- Game modes: `calm`, `busy`, `restricted`, `minimum`, `exactTypes`, `twoWays`, `repack`.
- Feedback and recovery: `incorrect`, `correct`, `pending`, `offline`, `storage`, `takeover`, `paused`, `help`.
- Completion: `results-two`, `results-three`.

The gallery uses the same screen and machine components as the live fictional-data application. It is a visual-development and regression surface, not a second game implementation. Fixtures contain no real student data and cannot award progress.

## Art and presentation review

The `art-v1` pack is integrated through reusable presentation components, not fixture-only markup. Mascot poses follow the handoff mapping: welcome for entry/empty/paused, instruct for normal play/progress/teacher context, help for the dialog/settings, correct for accepted feedback, encourage for correction/errors, and celebrate for both result ratings. The map fixture displays all five configured zone buildings and their CSS-driven available/completed/locked treatments.

`calm` omits optional activity props; `busy` enables contained pipes, conveyor, pallets, shipment, light and steam behind the live machine UI; `restricted` remains a math constraint rather than a visual-pressure setting. Browser checks cover all documented fixture routes, asset image dimensions, narrow-width overflow, reduced-motion hiding of nonessential busy art, and native controls after integration.

Final-review captures from the browser suite are committed in `docs/visual-evidence/`: `art-v1-map.png`, `art-v1-busy-game.png`, and `art-v1-results.png`. They are evidence only, not UI substitutes.

Keep text, numbers, controls, level nodes, stars, and status indicators as semantic live UI. Future original artwork should be added behind or around these components, never baked into interactive screenshots.
