import { describe, expect, it } from "vitest";
import {
  DENOMINATIONS,
  adaptedDifficulty,
  canonicalRepresentation,
  generateLevelOrder,
  generatePracticeOrder,
  greedyMinimum,
  nextPracticeSkill,
  orderSignature,
  schedulePracticeSkills,
  validateRepresentation,
  xorshift32,
  type OrderSpec,
  type Representation,
} from "../../packages/game-engine/src/index.js";
import { LEVELS, STAGE_ONE_PLACES, STAGE_TWO_PLACES } from "../../packages/config/src/index.js";

function independentGreedy(target: number, allowed: readonly number[]): Representation {
  let rest = target;
  const quantities = DENOMINATIONS.map((denomination) => {
    if (!allowed.includes(denomination)) return 0;
    const count = Math.floor(rest / denomination);
    rest -= count * denomination;
    return count;
  });
  if (rest !== 0) throw new Error("test witness cannot represent target");
  return quantities as unknown as Representation;
}

function independentExactTypes(target: number, allowed: readonly number[], types: number): Representation {
  const choices = DENOMINATIONS.filter((denomination) => allowed.includes(denomination));
  const vector = Array(6).fill(0) as number[];
  const search = (start: number, remaining: number, left: number): boolean => {
    if (left === 0) return remaining === 0;
    if (choices.length - start < left) return false;
    for (let index = start; index <= choices.length - left; index++) {
      const denomination = choices[index];
      const vectorIndex = DENOMINATIONS.indexOf(denomination as (typeof DENOMINATIONS)[number]);
      for (let quantity = 1; quantity * denomination <= remaining; quantity++) {
        vector[vectorIndex] = quantity;
        if (search(index + 1, remaining - quantity * denomination, left - 1)) return true;
      }
      vector[vectorIndex] = 0;
    }
    return false;
  };
  if (!search(0, target, types)) throw new Error("test exact-k witness unavailable");
  return vector as unknown as Representation;
}

function independentTwoWay(order: OrderSpec): [Representation, Representation] {
  const first = independentGreedy(order.target, order.allowed);
  for (let largeIndex = 0; largeIndex < DENOMINATIONS.length; largeIndex++) {
    const larger = DENOMINATIONS[largeIndex];
    if (!first[largeIndex]) continue;
    for (let smallIndex = largeIndex + 1; smallIndex < DENOMINATIONS.length; smallIndex++) {
      const smaller = DENOMINATIONS[smallIndex];
      if (order.allowed.includes(smaller) && larger % smaller === 0) {
        const second = [...first] as number[];
        second[largeIndex]--;
        second[smallIndex] += larger / smaller;
        return [first, second as unknown as Representation];
      }
    }
  }
  throw new Error("test exchange witness unavailable");
}

function independentWitnesses(order: OrderSpec): [Representation, Representation | null] {
  if (order.canonicalRequired) return [canonicalRepresentation(order.target), null];
  if (order.exactTypes !== null)
    return [independentExactTypes(order.target, order.allowed, order.exactTypes), null];
  if (order.distinctRepresentations === 2) return independentTwoWay(order);
  return [independentGreedy(order.target, order.allowed), null];
}

describe("RC-07 deterministic blueprint coverage", () => {
  it("matches the published xorshift stream and inclusive generated vectors", () => {
    expect([xorshift32(1), xorshift32(270369), xorshift32(67634689)]).toEqual([
      270369, 67634689, 2647435461,
    ]);
    const golden = [
      ["level-1", 1, 0, 1], ["level-1", 1, 1, 30], ["level-1", 1, 2, 200],
      ["level-5", 1, 0, 3010], ["level-5", 1, 1, 203],
      ["level-10", 1, 0, 220000], ["level-24", 1, 0, 6002],
      ["level-30", 1, 0, 823465], ["level-30", 1, 4, 106016],
    ] as const;
    for (const [levelId, seed, slot, target] of golden)
      expect(generateLevelOrder(levelId, seed, slot).target).toBe(target);
  });

  it("independently checks each of 150 slots across bands and boundary seeds", () => {
    const seeds = [1, 0xffffffff, 71] as const;
    const bands = ["easy", "medium", "hard"] as const;
    for (const level of LEVELS) for (let slot = 0; slot < 5; slot++)
      for (const [seedIndex, seed] of seeds.entries()) {
        const band = bands[(seedIndex + slot) % bands.length];
        const order = generateLevelOrder(level.id, seed, slot, band);
        expect(order.target).toBeGreaterThan(0);
        expect(order.target).toBeLessThanOrEqual(999999);
        expect(order.primarySkill).toBeTruthy();
        const [first, second] = independentWitnesses(order);
        expect(validateRepresentation(order, first, second).shipmentAccepted).toBe(true);
        if (order.minimumRequired)
          expect(greedyMinimum(order.target, order.allowed)).toBe(first.reduce((sum, n) => sum + n, 0));
        if (order.distinctRepresentations === 2) {
          expect(second).not.toBeNull();
          expect(first).not.toEqual(second);
        }
        if (level.stage === 1) {
          expect(order.allowed).toEqual(DENOMINATIONS);
          expect(order.canonicalRequired).toBe(true);
          expect(order.target / (STAGE_ONE_PLACES[level.ordinal][slot])).toBeGreaterThanOrEqual(1);
        }
        if (level.stage === 2) {
          const places = STAGE_TWO_PLACES[level.ordinal][slot];
          const active = canonicalRepresentation(order.target).filter((n) => n > 0).length;
          if (level.ordinal === 5) expect(active).toBe(2);
          if (level.ordinal === 6) expect(active).toBe(3);
          if (level.ordinal === 7) expect(active).toBeGreaterThanOrEqual(4);
          if (level.ordinal === 8 || (level.ordinal === 9 && slot === 2)) {
            const digits = canonicalRepresentation(order.target);
            const nonzero = digits.flatMap((digit, i) => digit ? [i] : []);
            expect(digits.slice(nonzero[0] + 1, nonzero.at(-1)).some((digit) => digit === 0)).toBe(true);
          }
          expect(places.length).toBeGreaterThanOrEqual(2);
          expect(order.primarySkill).toBe(level.ordinal === 9 && slot === 4 ? "standard.decompose" : level.primarySkill);
        }
      }
  });

  it("rejects invalid seed/slot and strict objective combinations; feedback keeps precedence", () => {
    for (const seed of [0, -1, 1.5, 0x100000000])
      expect(() => generateLevelOrder("level-1", seed, 0)).toThrow("CONFIG_INVALID");
    for (const slot of [-1, 1.5, 5])
      expect(() => generateLevelOrder("level-1", 1, slot)).toThrow("CONFIG_INVALID");
    const invalid = {
      id: "bad", target: 10, allowed: [10] as const,
      canonicalRequired: true, minimumRequired: true, exactTypes: null,
      distinctRepresentations: 1 as const,
    };
    expect(validateRepresentation(invalid, [0, 1, 0, 0, 1, 0]).schemaValid).toBe(false);
    const blocked = { ...invalid, canonicalRequired: false, minimumRequired: false };
    const precedence = validateRepresentation(blocked, [0, 0, 0, 0, 0, 1]);
    expect(precedence.feedbackCode).toBe("MACHINE_UNAVAILABLE");
  });

  it("uses oldest evidence for focus ties and emits the fixed practice schedule", () => {
    const clock = new Date("2026-01-20T12:00:00.000Z");
    const records = [
      ...Array.from({ length: 7 }, (_, i) => ({ skillId: "pv.ones", score: 1, independentFirst: true, attemptId: `a${i % 2}`, signature: `one-${i}`, committedAt: new Date(Date.UTC(2026, 0, 1 + i)).toISOString() })),
      ...Array.from({ length: 7 }, (_, i) => ({ skillId: "pv.tens", score: 1, independentFirst: true, attemptId: `b${i % 2}`, signature: `ten-${i}`, committedAt: new Date(Date.UTC(2026, 0, 10 + i)).toISOString() })),
    ];
    expect(nextPracticeSkill(["pv.ones", "pv.tens"], records, clock)).toBe("pv.ones");
    const withSecureReview = [...records, { skillId: "pv.ones", score: 1, independentFirst: true, attemptId: "a2", signature: "one-7", committedAt: "2026-01-08T00:00:00.000Z" }];
    expect(schedulePracticeSkills(["pv.hundreds", "pv.tens"], withSecureReview, ["pv.hundreds", "pv.tens", "pv.ones"], clock)).toEqual([
      "pv.hundreds", "pv.hundreds", "pv.ones", "pv.hundreds", "pv.tens",
    ]);
  });

  it("avoids the last ten signatures and relaxes only after candidate exhaustion", () => {
    const order = generateLevelOrder("level-1", 91, 0);
    expect(orderSignature(order)).not.toBe(orderSignature(generateLevelOrder("level-1", 91, 0, "easy", [orderSignature(order)])));
    const exhausted = [1, 2, 3].map((target) => orderSignature({ ...order, target }));
    const fallback = generateLevelOrder("level-1", 91, 0, "easy", exhausted);
    expect(exhausted).toContain(orderSignature(fallback));
    expect(validateRepresentation(fallback, canonicalRepresentation(fallback.target)).shipmentAccepted).toBe(true);
    const practice = generatePracticeOrder("pv.ones", 91, 0, "easy");
    const allPracticeTargets = [1, 2, 3].map((target) => orderSignature({ ...practice, target }));
    const practiceFallback = generatePracticeOrder("pv.ones", 91, 0, "easy", 4, allPracticeTargets);
    expect(allPracticeTargets).toContain(orderSignature(practiceFallback));
    expect(validateRepresentation(practiceFallback, canonicalRepresentation(practiceFallback.target)).shipmentAccepted).toBe(true);
    expect(adaptedDifficulty({ skillId: "x", score: null, sampleN: 0, independentFirstN: 0, distinctAttemptN: 0, status: "unknown", needsRefresh: false, practiceSuggested: false, lastEvidenceAt: null }, { lowScoreStreak: 0, remainingEasyOrders: 0, independentSuccesses: 0 })).toBe("easy");
  });
});
