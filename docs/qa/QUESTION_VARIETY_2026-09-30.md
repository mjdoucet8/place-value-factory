# Question-set review — all 30 levels

Reviewed the five-question sequence for every level. Several Lab generators previously changed digits while repeating the same place positions or machine set. New generation varies those positions inside the existing lesson constraints. No score, mastery, unlock, retry or saved-progress policy changes.

## Level-by-level review

| Level | Lesson | Review and result |
| --- | --- | --- |
| 1 | First Shipments | Ones, tens and hundreds; required sequence retained. |
| 2 | Tall Crates | Thousands, ten-thousands and hundred-thousands; required sequence retained. |
| 3 | Mixed Machines | Five different single-place selections retained. |
| 4 | Receiving Review | Five different single-place selections retained. |
| 5 | Two Digits | Five two-active-digit patterns retained. |
| 6 | Three Digits | Five three-active-digit patterns retained. |
| 7 | Full Number Builds | Five patterns with four to six active digits retained. |
| 8 | Zero Detectives | Five internal-zero patterns retained. |
| 9 | Zero Review | Two trailing-zero, two internal-zero and one full-number slot retained. |
| 10 | Hundred-Thousands Exchange | One focused 100,000 → 10,000 conversion; quotients vary. |
| 11 | Ten-Thousands Exchange | One focused 10,000 → 1,000 conversion; quotients vary. |
| 12 | Thousands Exchange | One focused 1,000 → 100 conversion; quotients vary. |
| 13 | Hundreds Exchange | One focused 100 → 10 conversion; quotients vary. |
| 14 | Tens Exchange | One focused 10 → 1 conversion; quotients vary. |
| 15 | Multi-Step Exchange | Four target units across five multi-step exchanges retained. |
| 16 | Small Allowed Sets | Two alternating allowed pairs retained, as required by the lesson. |
| 17 | Mixed Allowed Sets | Two alternating allowed triplets retained, as required by the lesson. |
| 18 | Shipping Challenge | Five subsets retained; every question still requires regrouping. |
| 19 | One Closed Machine | Four different single-machine closures retained. |
| 20 | Two Closed Machines | Five different two-machine closures retained. |
| 21 | Repacking Bay | Five different closure sets retained for repacking. |
| 22 | Fewest Crates | Five planned number patterns replace potentially identical patterns. Four or five active places; still within 100–99,999. |
| 23 | Fewest with Gaps | Five allowed triplets; three positive counts and the same one-position gap. |
| 24 | Two Crate Types | Five active-place pairs; still exactly two positive crate types and targets below 100,000. |
| 25 | Three Crate Types | Five four-active-place patterns; still exactly three types, achievable with one adjacent regrouping. |
| 26 | Two Ways | Five different place magnitudes; one active place and one 10:1 exchange throughout. |
| 27 | Two Ways with Gaps | Four allowed triplets across five slots; two active places, three open adjacent machines and a 10:1 exchange. |
| 28 | Repack Efficiently | Five gapped triplets; four active source places, one required adjacent regrouping and minimum crates. |
| 29 | Mixed Lab | Fixed five objective families retained; exact-type and restricted slots vary their place patterns across replays. |
| 30 | Factory Master Review | Fixed five objective families and six-digit targets retained; exact-type and restricted patterns vary across replays. |

## Concrete Level 24 example

One deterministic revised set produces **9,004; 60,020; 5,100; 20,700; 84,000**. The pairs are thousands/ones, ten-thousands/tens, thousands/hundreds, ten-thousands/hundreds, and ten-thousands/thousands. Every question still asks for exactly two positive crate types. These are generated examples, not fixed questions or new saved student answers.

The repeated **1,000 / 100 / 1** allowed set also existed in Levels 23 and 28. Both now rotate through five equivalent triplets, keeping three open machines and the same 10:1 and 100:1 gaps. Level 28 still requires exactly one missing canonical place to be regrouped; its required expanded quantity stays between 10 and 99.

## Difficulty safeguards

- Required learning objectives and primary-skill attribution are unchanged in all 150 slots. Earlier levels retain their exact generation behavior.
- Stage 1 and canonical digit bands, focused renaming quotient bands, and the existing Lab digit policy remain unchanged. No new adaptive difficulty policy was introduced.
- Level 24 keeps two nonzero canonical positions. Level 25 keeps four nonzero positions but requires exactly three crate types; every pattern permits an adjacent exchange.
- Two-way questions retain a valid single 10:1 exchange. Gap/repacking tasks retain the same number of open machines and gap ratios.
- All existing target ceilings remain enforced; Level 30 remains six-digit. Broader place magnitudes are used where the existing level blueprint allows them.
- Level 22 uses four/five-active-place patterns within its published range to prevent five questions with the same shape; this is structural comparability, not a claim that subjective difficulty is numerically identical for every child.
- Recent-target suppression, bounded retries and validated fallbacks remain in place. Exact-type witness construction now supports trailing-zero targets instead of always requiring tens/ones or hundreds/tens/ones.

## Evidence

- Before/after audit: 128 independently seeded five-question runs per level (19,200 generated questions per revision). All 21 earlier-level audit profiles are identical. The new Level 22–26 and 28 runs always have five relevant patterns; Level 27 always uses four machine sets. Mixed review exact/restricted slots each exercise at least four patterns across replay seeds.
- Generator regression: 14,400 cases across all 30 levels, all five slots and all three bands, plus focused diversity, operation-count, trailing-zero, recent-signature and practice checks.
- Independent existing mathematical checks include an exact-type search, an independent minimum-count oracle, and published PRNG vectors.
- Real API tests complete five saved questions for each Level 22–28. A persisted v2 Level 24 question resumes unchanged, accepts its answer and remains immutable in history while later questions use v4.
- `npm test`: 100 passed, 9 dedicated-harness skips.
- `npm run test:postgres`: 9 passed; after restart 3 passed, 2 restart-inapplicable skips. This includes earned progression through all 30 levels, practice, optional transfers and report reconciliation.
- `npx tsc --noEmit` and `npm run build`: pass.
- `npm run test:e2e`: 31 passed, 1 existing native-browser-zoom environment skip. All visual baselines remain unchanged.
- `git diff --check`: pass.

## Compatibility and publication

New Lab questions carry `engineVersion: xorshift32-v4`. Existing saved order specifications, active questions, responses and evidence are not regenerated or migrated. Levels 1–21 retain their prior versions. Exact-type modelled answers remain valid under both old and new specs. The API shape and configuration version are unchanged.

Existing local runtime data is excluded from the change. Artwork, layout and visual baselines are unchanged. Published successfully to https://math-factory-one.vercel.app/.

- Target/status: production, READY.
- Deployment: `dpl_B1L24G24GtbJXwBRAwG2kFP4pEL7`.
- Implementation commit: `2260479`; remote container image was built with tag `22604791b207`.
- Runtime: existing Node server and Vite/React client; remote build completed in 50 seconds.
- Live page and `/api/healthz`: HTTP 200; health status `ok`.
- Frontend bundle remains `/assets/index-D3lM5YxR.js`, as expected for the server-side generator change; artwork/layout are unchanged.
- Deployment-specific error query (`--level error --since 10m --limit 10 --json`) returned no error records. This is a bounded check; no ongoing monitor was created.
- No live student responses were submitted for verification. Full question issuance, saving, 30-level progression and restart recovery were verified in disposable local data before publishing.
