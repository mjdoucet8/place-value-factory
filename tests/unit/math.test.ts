import { describe, expect, it } from "vitest";
import fixtures from "../fixtures/math_cases.json";
import {
  DENOMINATIONS,
  adaptedDifficulty,
  alternateWitnessFor,
  assertValidOrder,
  canonicalRepresentation,
  difficultyFor,
  evidenceScore,
  generateLevelOrder,
  generateOrder,
  generatePracticeOrder,
  greedyMinimum,
  isIndependentFirst,
  nextPracticeSkill,
  practiceBlueprintFor,
  stageGate,
  summarizeMastery,
  scaffoldForSkill,
  updateScaffold,
  validateRepresentation,
  witnessFor,
  xorshift32,
} from "../../packages/game-engine/src/index.js";
import { LEVELS } from "../../packages/config/src/index.js";
import { dynamicProgrammingMinimum } from "../oracles/minimum-oracle.js";

describe("fixture mathematical validation", () => {
  for (const item of fixtures.cases)
    it(item.id, () => {
      const result = validateRepresentation(
        {
          id: item.id,
          target: item.target,
          allowed: item.allowed as unknown as typeof DENOMINATIONS,
          canonicalRequired: item.canonicalRequired,
          minimumRequired: item.minimumRequired,
          exactTypes: item.exactTypes as 2 | 3 | null,
          distinctRepresentations: item.distinctRepresentations as 1 | 2,
        },
        item.representationA,
        item.representationB,
      );
      expect(result.shipmentAccepted).toBe(item.expected.accepted);
      expect(result.feedbackCode).toBe(item.expected.feedbackCode);
      if ("representedTotal" in item.expected)
        expect(result.representedTotals[0]).toBe(
          item.expected.representedTotal,
        );
      if ("crateCount" in item.expected)
        expect(result.crateCounts[0]).toBe(item.expected.crateCount);
      if ("minimumCrates" in item.expected && result.valueMatches)
        expect(result.minimumCrates).toBe(item.expected.minimumCrates);
    });
  for (const invalid of fixtures.invalidConfigurations)
    it(`rejects invalid config ${invalid.target}`, () => {
      expect(() =>
        assertValidOrder({
          id: "invalid",
          canonicalRequired: false,
          distinctRepresentations: 1,
          exactTypes: null,
          minimumRequired: false,
          ...invalid,
        } as never),
      ).toThrow("CONFIG_INVALID");
    });
});

describe("minimum oracle", () => {
  it("uses the published nonzero uint32 xorshift stream", () => {
    expect(xorshift32(1)).toBe(270369);
    expect(() => xorshift32(0)).toThrow("CONFIG_INVALID");
    expect(() => xorshift32(2 ** 32)).toThrow("CONFIG_INVALID");
  });
  it("agrees with the independent oracle for all subsets and targets through 2,000", () => {
    for (let mask = 1; mask < 64; mask++) {
      const allowed = DENOMINATIONS.filter((_, index) => mask & (1 << index));
      for (let target = 0; target <= 2000; target++) {
        const oracle = dynamicProgrammingMinimum(target, allowed);
        if (oracle !== null)
          expect(greedyMinimum(target, allowed)).toBe(oracle);
      }
    }
  });
  it("generates reproducible valid orders with witnesses", () => {
    for (let slot = 0; slot < 5; slot++) {
      expect(generateOrder(7, slot)).toEqual(generateOrder(7, slot));
      const order = generateOrder(7, slot);
      const digits = order.target
        .toString()
        .padStart(6, "0")
        .split("")
        .map(Number);
      expect(validateRepresentation(order, digits)).toMatchObject({
        shipmentAccepted: true,
      });
    }
  });
  it("uses the configured Stage 1 difficulty band without changing required place coverage", () => {
    for (const band of ["easy", "medium", "hard"] as const) {
      const order = generateOrder(7, 1, band);
      const digit = order.target / 10;
      expect(order.difficultyBand).toBe(band);
      expect(digit).toBeGreaterThanOrEqual(1);
      expect(digit).toBeLessThanOrEqual(
        band === "easy" ? 3 : band === "medium" ? 6 : 9,
      );
    }
  });
  it("emits a validated witness for every configured level and slot", () => {
    for (const level of LEVELS)
      for (let slot = 0; slot < 5; slot++) {
        const order = generateLevelOrder(level.id, 71, slot);
        expect(
          validateRepresentation(
            order,
            witnessFor(order),
            alternateWitnessFor(order),
          ),
        ).toMatchObject({ shipmentAccepted: true });
      }
  });
  it("can practice every gate skill with five correctly attributed orders", () => {
    const skills = [
      "pv.ones",
      "pv.tens",
      "pv.hundreds",
      "pv.thousands",
      "pv.tenThousands",
      "pv.hundredThousands",
      "standard.decompose",
      "standard.zero",
      "rename.100000_10000",
      "rename.10000_1000",
      "rename.1000_100",
      "rename.100_10",
      "rename.10_1",
      "rename.multi",
      "compose.allowed",
      "compose.forbidden",
      "reason.minimum",
      "reason.exactTypes",
      "reason.multiple",
    ];
    for (const skill of skills) {
      const blueprint = practiceBlueprintFor(skill, 30);
      for (let slot = 0; slot < 5; slot++) {
        const order = generatePracticeOrder(skill, 79, slot, "hard", 30);
        expect(order.primarySkill).toBe(skill);
        expect(
          validateRepresentation(
            order,
            witnessFor(order),
            alternateWitnessFor(order),
          ).shipmentAccepted,
        ).toBe(true);
      }
      expect(blueprint.ordinal).toBeLessThanOrEqual(30);
    }
    expect(practiceBlueprintFor("standard.zero", 9).id).toBe("level-8");
    expect(() => practiceBlueprintFor("reason.multiple", 25)).toThrow(
      "CONFIG_INVALID",
    );
  });
  it("keeps published stage-one skill IDs and exposes a read-only repack source", () => {
    const stageOneSkills = new Set<string>();
    for (let level = 1; level <= 4; level++)
      for (let slot = 0; slot < 5; slot++)
        stageOneSkills.add(
          generateLevelOrder(`level-${level}`, 71, slot).primarySkill!,
        );
    expect([...stageOneSkills]).toEqual(
      expect.arrayContaining([
        "pv.ones",
        "pv.tens",
        "pv.hundreds",
        "pv.thousands",
        "pv.tenThousands",
        "pv.hundredThousands",
      ]),
    );
    const repack = generateLevelOrder("level-21", 71, 0);
    expect(repack.sourceRepresentation).toEqual(
      canonicalRepresentation(repack.target),
    );
    expect(validateRepresentation(repack, witnessFor(repack))).toMatchObject({
      shipmentAccepted: true,
    });
  });
  it("honours level one's five configured place-value slots at every band", () => {
    const expected = [
      "pv.ones",
      "pv.tens",
      "pv.hundreds",
      "pv.ones",
      "pv.tens",
    ];
    for (const band of ["easy", "medium", "hard"] as const) {
      const orders = expected.map((_, slot) =>
        generateLevelOrder("level-1", 77, slot, band),
      );
      expect(orders.map((order) => order.primarySkill)).toEqual(expected);
      const [low, high] =
        band === "easy" ? [1, 3] : band === "medium" ? [1, 6] : [1, 9];
      for (const order of orders) {
        const digit = canonicalRepresentation(order.target).find(
          (value) => value > 0,
        )!;
        expect(digit).toBeGreaterThanOrEqual(low);
        expect(digit).toBeLessThanOrEqual(high);
      }
    }
  });
  it("keeps all four Stage 1 place sequences fixed and uses canonical value across all machines", () => {
    const blueprints = [
      [1, 10, 100, 1, 10],
      [1000, 10000, 100000, 1000, 10000],
      [100000, 100, 1, 10, 1000],
      [10000, 100000, 1, 10, 100],
    ];
    for (const [levelIndex, places] of blueprints.entries())
      for (const [slot, place] of places.entries()) {
        const order = generateLevelOrder(`level-${levelIndex + 1}`, 71, slot);
        expect(order.allowed).toEqual(DENOMINATIONS);
        expect(order.primarySkill).toBe(
          {
            1: "pv.ones",
            10: "pv.tens",
            100: "pv.hundreds",
            1000: "pv.thousands",
            10000: "pv.tenThousands",
            100000: "pv.hundredThousands",
          }[place],
        );
        expect(order.target / place).toBeGreaterThanOrEqual(1);
        expect(order.target / place).toBeLessThanOrEqual(3);
      }
  });
  it("preserves Stage 2 active-digit, zero and primary-skill coverage for varied seeds", () => {
    for (const seed of [1, 71, 0xffffffff])
      for (let level = 5; level <= 9; level++)
        for (let slot = 0; slot < 5; slot++) {
          const order = generateLevelOrder(
            `level-${level}`,
            seed,
            slot,
            "hard",
          );
          const digits = canonicalRepresentation(order.target);
          const active = digits.filter((digit) => digit > 0).length;
          expect(validateRepresentation(order, digits).shipmentAccepted).toBe(
            true,
          );
          expect(order.target).toBeGreaterThan(0);
          expect(order.target).toBeLessThanOrEqual(999999);
          if (level === 5) {
            expect(active).toBe(2);
            expect(order.target).toBeGreaterThanOrEqual(10);
            expect(order.target).toBeLessThanOrEqual(9999);
          }
          if (level === 6) {
            expect(active).toBe(3);
            expect(order.target).toBeGreaterThanOrEqual(100);
            expect(order.target).toBeLessThanOrEqual(99999);
          }
          if (level === 7) {
            expect(active).toBeGreaterThanOrEqual(4);
            expect(order.target).toBeGreaterThanOrEqual(10000);
          }
          if (level === 8 || (level === 9 && (slot === 2 || slot === 3))) {
            const first = digits.findIndex((digit) => digit > 0);
            const last = digits.reduce(
              (latest, digit, index) => (digit > 0 ? index : latest),
              -1,
            );
            expect(digits.slice(first + 1, last)).toContain(0);
            expect(order.primarySkill).toBe("standard.zero");
          }
          if (level === 9 && slot < 2) {
            expect(order.target % 10).toBe(0);
            expect(order.primarySkill).toBe("standard.zero");
          }
          if (level === 9 && slot === 4) {
            expect(active).toBe(6);
            expect(order.primarySkill).toBe("standard.decompose");
          }
        }
  });
  it("keeps each Stage 3 exchange on its assigned single machine and quotient band", () => {
    const units = [10000, 1000, 100, 10, 1];
    for (const band of ["easy", "medium", "hard"] as const)
      for (let level = 10; level <= 15; level++)
        for (let slot = 0; slot < 5; slot++) {
          const order = generateLevelOrder(
            `level-${level}`,
            1234567,
            slot,
            band,
          );
          const unit =
            level === 15 ? [1000, 100, 10, 1, 1000][slot] : units[level - 10];
          const quotient = order.target / unit;
          const [low, high] =
            level === 15
              ? band === "easy"
                ? [100, 299]
                : band === "medium"
                  ? [300, 699]
                  : [700, 999]
              : band === "easy"
                ? [10, 29]
                : band === "medium"
                  ? [30, 69]
                  : [70, 99];
          expect(order.allowed).toEqual([unit]);
          expect(quotient).toBeGreaterThanOrEqual(low);
          expect(quotient).toBeLessThanOrEqual(high);
          expect(
            validateRepresentation(order, witnessFor(order)).shipmentAccepted,
          ).toBe(true);
        }
  });
  it("keeps Stage 4 allowed subsets soluble within their published ranges", () => {
    for (const seed of [1, 71, 0xffffffff])
      for (const band of ["easy", "medium", "hard"] as const)
      for (let level = 16; level <= 18; level++)
        for (let slot = 0; slot < 5; slot++) {
          const order = generateLevelOrder(`level-${level}`, seed, slot, band);
          expect(order.allowed.length).toBeGreaterThanOrEqual(2);
          expect(6 - order.allowed.length).toBeGreaterThanOrEqual(
            level === 18 ? 2 : 1,
          );
          expect(order.target).toBeLessThanOrEqual(
            level === 16 ? 9999 : 999999,
          );
          expect(order.primarySkill).toBe("compose.allowed");
          expect(
            validateRepresentation(order, witnessFor(order)).shipmentAccepted,
          ).toBe(true);
          if (level === 18) {
            const canonical = canonicalRepresentation(order.target);
            expect(DENOMINATIONS.some((place, index) =>
              !order.allowed.includes(place) && canonical[index] > 0,
            )).toBe(true);
            // Every solution must regroup: six ordinary digit counts cannot suffice.
            expect(witnessFor(order).some((count) => count >= 10)).toBe(true);
          }
          if (level === 18 && slot === 0) {
            expect(order.target).toBe(529521);
            expect(order.allowed).toEqual([10000, 100, 1]);
          }
        }
  });
  it("makes Stage 5 closed machines relevant and provides a valid repack", () => {
    for (const seed of [1, 71, 0xffffffff])
      for (let level = 19; level <= 21; level++)
        for (let slot = 0; slot < 5; slot++) {
          const order = generateLevelOrder(`level-${level}`, seed, slot);
          const canonical = canonicalRepresentation(order.target);
          const forbidden = DENOMINATIONS.filter(
            (place) => !order.allowed.includes(place),
          );
          if (level === 19) expect(forbidden).toHaveLength(1);
          else if (level === 20) expect(forbidden).toHaveLength(2);
          else {
            expect(forbidden.length).toBeGreaterThanOrEqual(1);
            expect(forbidden.length).toBeLessThanOrEqual(2);
          }
          expect(
            forbidden.some(
              (place) => canonical[DENOMINATIONS.indexOf(place)] > 0,
            ),
          ).toBe(true);
          expect(order.primarySkill).toBe("compose.forbidden");
          expect(order.minimumRequired).toBe(false);
          expect(
            validateRepresentation(order, witnessFor(order)).shipmentAccepted,
          ).toBe(true);
          if (level === 21)
            expect(order.sourceRepresentation).toEqual(canonical);
          if (level === 20 && slot === 0) {
            expect(order.target).toBe(458123);
            expect(forbidden).toEqual([100000, 100]);
          }
        }
  });
  it("emits all five Lab objective families with valid witnesses", () => {
    const mixedModes = [
      "minimum",
      "exactTypes",
      "exactTypes",
      "twoWays",
      "restricted",
    ];
    const mixedSkills = [
      "reason.minimum",
      "reason.exactTypes",
      "reason.exactTypes",
      "reason.multiple",
      "compose.allowed",
    ];
    for (const seed of [1, 71, 0xffffffff])
      for (let level = 22; level <= 30; level++)
        for (let slot = 0; slot < 5; slot++) {
          const order = generateLevelOrder(`level-${level}`, seed, slot);
          const witness = witnessFor(order);
          const second = alternateWitnessFor(order);
          expect(
            validateRepresentation(order, witness, second).shipmentAccepted,
          ).toBe(true);
          if (level === 27) {
            expect(order.allowed).toHaveLength(3);
            expect(order.allowed[0] / order.allowed[1]).toBe(10);
            expect(order.allowed[1] / order.allowed[2]).toBe(10);
            expect(second).not.toBeNull();
          }
          if (level === 28) {
            expect(order.mode).toBe("repack");
            expect(order.minimumRequired).toBe(true);
            expect(order.sourceRepresentation).toEqual(
              canonicalRepresentation(order.target),
            );
          }
          if (level >= 29) {
            expect(order.mode).toBe(mixedModes[slot]);
            expect(order.primarySkill).toBe(mixedSkills[slot]);
            if (level === 30)
              expect(order.target).toBeGreaterThanOrEqual(100000);
          }
        }
  });
});

describe("mastery and adaptation policy", () => {
  const at = (day: number) => new Date(Date.UTC(2026, 0, day)).toISOString();
  const evidence = (
    index: number,
    overrides: Record<string, unknown> = {},
  ) => ({
    skillId: "pv.ones",
    score: 1,
    independentFirst: true,
    attemptId: `attempt-${index % 2}`,
    signature: `order-${index}`,
    committedAt: at(index + 1),
    ...overrides,
  });

  it("uses the documented evidence-score precedence and excludes time", () => {
    expect(
      evidenceScore({
        firstObjectiveCorrect: true,
        wrongSubmissions: 0,
        highestHint: "none",
        skipped: false,
      }),
    ).toBe(1);
    expect(
      evidenceScore({
        firstObjectiveCorrect: true,
        wrongSubmissions: 0,
        highestHint: "H2",
        skipped: false,
      }),
    ).toBe(0.8);
    expect(
      evidenceScore({
        firstObjectiveCorrect: true,
        wrongSubmissions: 2,
        highestHint: "H2",
        skipped: false,
      }),
    ).toBe(0.6);
    expect(
      evidenceScore({
        firstObjectiveCorrect: true,
        wrongSubmissions: 0,
        highestHint: "H3",
        skipped: false,
      }),
    ).toBe(0.25);
    expect(
      evidenceScore({
        firstObjectiveCorrect: true,
        wrongSubmissions: 0,
        highestHint: "none",
        skipped: true,
      }),
    ).toBe(0);
    expect(
      isIndependentFirst({
        firstObjectiveCorrect: true,
        wrongSubmissions: 0,
        highestHint: "none",
        skipped: false,
      }),
    ).toBe(true);
  });

  it("requires a sufficient, diverse independent sample for secure status", () => {
    expect(
      summarizeMastery(
        "pv.ones",
        Array.from({ length: 8 }, (_, index) => evidence(index)),
        new Date(at(10)),
      ),
    ).toMatchObject({
      status: "secure",
      sampleN: 8,
      independentFirstN: 8,
      distinctAttemptN: 2,
    });
    expect(
      summarizeMastery(
        "pv.ones",
        Array.from({ length: 7 }, (_, index) => evidence(index)),
        new Date(at(10)),
      ).status,
    ).toBe("developing");
    expect(
      summarizeMastery(
        "pv.ones",
        Array.from({ length: 8 }, (_, index) =>
          evidence(index, { attemptId: "same-attempt" }),
        ),
        new Date(at(10)),
      ).status,
    ).toBe("developing");
  });

  it("deduplicates repeated signatures within 24 hours and marks absence as refresh, not score decay", () => {
    const repeated = [
      evidence(1),
      evidence(2, {
        signature: "order-1",
        committedAt: new Date(Date.UTC(2026, 0, 1, 12)).toISOString(),
      }),
    ];
    expect(summarizeMastery("pv.ones", repeated, new Date(at(3))).sampleN).toBe(
      1,
    );
    const summary = summarizeMastery(
      "pv.ones",
      Array.from({ length: 8 }, (_, index) => evidence(index)),
      new Date(Date.UTC(2026, 1, 1)),
    );
    expect(summary).toMatchObject({ status: "secure", needsRefresh: true });
  });

  it("selects bands from mastery and applies only a bounded per-skill scaffold", () => {
    expect(difficultyFor("unknown")).toBe("easy");
    expect(difficultyFor("developing")).toBe("medium");
    expect(difficultyFor("secure")).toBe("hard");
    let state = {
      lowScoreStreak: 0,
      remainingEasyOrders: 0,
      independentSuccesses: 0,
    };
    state = updateScaffold(state, 0.6, false);
    state = updateScaffold(state, 0.6, false);
    expect(state.remainingEasyOrders).toBe(3);
    const secure = summarizeMastery(
      "pv.ones",
      Array.from({ length: 8 }, (_, index) => evidence(index)),
      new Date(at(10)),
    );
    expect(adaptedDifficulty(secure, state)).toBe("easy");
    state = updateScaffold(state, 1, true);
    state = updateScaffold(state, 1, true);
    expect(state.remainingEasyOrders).toBe(0);
    expect(adaptedDifficulty(secure, state)).toBe("hard");
  });

  it("reconstructs the three-order scaffold from committed resolved evidence", () => {
    const base = scaffoldForSkill("pv.ones", [
      {
        skillId: "pv.tens",
        score: 0.6,
        independentFirst: false,
        attemptId: "other",
        signature: "x",
        committedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        skillId: "pv.ones",
        score: 0.6,
        independentFirst: false,
        attemptId: "a",
        signature: "a",
        committedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        skillId: "pv.ones",
        score: 0,
        independentFirst: false,
        attemptId: "b",
        signature: "b",
        committedAt: "2026-01-02T00:00:00.000Z",
      },
    ]);
    const secure = {
      skillId: "pv.ones",
      score: 1,
      sampleN: 8,
      independentFirstN: 8,
      distinctAttemptN: 2,
      status: "secure" as const,
      needsRefresh: false,
      practiceSuggested: false,
      lastEvidenceAt: "2026-01-02T00:00:00.000Z",
    };
    expect(base).toMatchObject({ lowScoreStreak: 2, remainingEasyOrders: 3 });
    expect(adaptedDifficulty(secure, base)).toBe("easy");
    const afterOne = scaffoldForSkill("pv.ones", [
      {
        skillId: "pv.ones",
        score: 0.6,
        independentFirst: false,
        attemptId: "a",
        signature: "a",
        committedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        skillId: "pv.ones",
        score: 0,
        independentFirst: false,
        attemptId: "b",
        signature: "b",
        committedAt: "2026-01-02T00:00:00.000Z",
      },
      {
        skillId: "pv.ones",
        score: 0.6,
        independentFirst: false,
        attemptId: "c",
        signature: "c",
        committedAt: "2026-01-03T00:00:00.000Z",
      },
    ]);
    expect(afterOne.remainingEasyOrders).toBe(2);
    const afterRecovery = scaffoldForSkill("pv.ones", [
      {
        skillId: "pv.ones",
        score: 0.6,
        independentFirst: false,
        attemptId: "a",
        signature: "a",
        committedAt: "2026-01-01T00:00:00.000Z",
      },
      {
        skillId: "pv.ones",
        score: 0,
        independentFirst: false,
        attemptId: "b",
        signature: "b",
        committedAt: "2026-01-02T00:00:00.000Z",
      },
      {
        skillId: "pv.ones",
        score: 1,
        independentFirst: true,
        attemptId: "c",
        signature: "c",
        committedAt: "2026-01-03T00:00:00.000Z",
      },
      {
        skillId: "pv.ones",
        score: 1,
        independentFirst: true,
        attemptId: "d",
        signature: "d",
        committedAt: "2026-01-04T00:00:00.000Z",
      },
    ]);
    expect(afterRecovery.remainingEasyOrders).toBe(0);
    expect(adaptedDifficulty(secure, afterRecovery)).toBe("hard");
  });

  it("keeps stage gates separate from completed paths and selects a positive practice target", () => {
    const secureOnes = Array.from({ length: 8 }, (_, index) => evidence(index));
    expect(stageGate(1, secureOnes, new Date(at(10))).satisfied).toBe(false);
    expect(
      nextPracticeSkill(["pv.ones", "pv.tens"], secureOnes, new Date(at(10))),
    ).toBe("pv.tens");
    const allStageOne = [
      "pv.ones",
      "pv.tens",
      "pv.hundreds",
      "pv.thousands",
      "pv.tenThousands",
      "pv.hundredThousands",
    ].flatMap((skillId, skillIndex) =>
      Array.from({ length: 8 }, (_, index) =>
        evidence(index + skillIndex * 20, { skillId }),
      ),
    );
    expect(stageGate(1, allStageOne, new Date(at(200)))).toMatchObject({
      satisfied: true,
      requiredSkillIds: expect.arrayContaining([
        "pv.ones",
        "pv.hundredThousands",
      ]),
    });
  });
});
