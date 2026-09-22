# Visual state gallery

The development-only gallery at `/dev/place-value-factory/states` renders deterministic, fictional states without changing student progress. Use the **Visual state** selector or append `?fixture=<name>` for a stable browser target.

## Fixture inventory

- Structure: `map`, `map-resume`, `level-intro`, `progress`, `loading`, `error`, `empty`.
- Game modes: `calm`, `busy`, `restricted`, `minimum`, `exactTypes`, `twoWays`, `repack`.
- Feedback and recovery: `incorrect`, `correct`, `pending`, `offline`, `storage`, `takeover`, `paused`, `help`.
- Completion: `results-two`, `results-three`.

The gallery uses the same screen and machine components as the live fictional-data application. It is a visual-development and regression surface, not a second game implementation. Fixtures contain no real student data and cannot award progress.

Keep text, numbers, controls, level nodes, stars, and status indicators as semantic live UI. Future original artwork should be added behind or around these components, never baked into interactive screenshots.
