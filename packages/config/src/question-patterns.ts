import type { Denomination } from "../../contracts/src/index.js";

type PlacePatterns = readonly (readonly Denomination[])[];

/** Five-slot Lab coverage. Digits vary with the seed; positions vary by slot.
 * Keep the operation count/structure stable instead of randomizing difficulty.
 */
export const LAB_PATTERNS = {
  // Four or five active places, within the existing 100–99,999 target range.
  minimum: [
    [10000, 1000, 100, 10, 1],
    [10000, 1000, 100, 1],
    [10000, 1000, 10, 1],
    [10000, 100, 10, 1],
    [10000, 1000, 100, 10],
  ],
  // Three open types with one skipped position; translation or reflection
  // keeps the same gap. Repacking fills all four positions before regrouping.
  gapped: [
    [1000, 100, 1],
    [10000, 1000, 10],
    [10000, 100, 10],
    [100000, 10000, 100],
    [100000, 1000, 100],
  ],
  exactTwo: [
    [1000, 1],
    [10000, 10],
    [1000, 100],
    [10000, 100],
    [10000, 1000],
  ],
  // Four active positions require combining at least one pair to use exactly
  // three types. Every pattern includes an adjacent pair (one 10:1 exchange).
  exactThree: [
    [10000, 100, 10, 1],
    [100000, 1000, 100, 10],
    [10000, 1000, 10, 1],
    [100000, 10000, 100, 10],
    [100000, 1000, 10, 1],
  ],
  twoWays: [[100], [10000], [10], [100000], [1000]],
  // Two active types and a third available adjacent type in every slot.
  twoWaysRestricted: [
    [1000, 100, 10],
    [100000, 10000, 1000],
    [100, 10, 1],
    [10000, 1000, 100],
    [1000, 100, 10],
  ],
  // Mixed reviews sample within equivalent families on each replay.
  mixedExactTwo: [
    [10000, 1],
    [10000, 10],
    [10000, 100],
    [10000, 1000],
  ],
  masterExactTwo: [
    [100000, 1],
    [100000, 10],
    [100000, 100],
    [100000, 1000],
    [100000, 10000],
  ],
  mixedExactThree: [
    [10000, 100, 10, 1],
    [10000, 1000, 100, 1],
    [10000, 1000, 10, 1],
    [10000, 1000, 100, 10],
  ],
  masterExactThree: [
    [100000, 100, 10, 1],
    [100000, 10000, 100, 10],
    [100000, 1000, 10, 1],
    [100000, 10000, 1000, 100],
    [100000, 1000, 100, 1],
  ],
  mixedRestricted: [
    [10000, 100, 1],
    [10000, 1000, 10],
    [10000, 100, 10],
    [10000, 1000, 1],
    [10000, 10, 1],
  ],
  masterRestricted: [
    [100000, 1000, 10, 1],
    [100000, 10000, 100, 1],
    [100000, 10000, 1000, 10],
    [100000, 1000, 100, 1],
    [100000, 10000, 10, 1],
  ],
} as const satisfies Record<string, PlacePatterns>;
