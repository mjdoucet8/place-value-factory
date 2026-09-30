import { describe, expect, it } from "vitest";
import { LEVELS } from "../../packages/config/src/index.js";
import {
  DENOMINATIONS,
  alternateWitnessFor,
  canonicalRepresentation,
  generateLevelOrder,
  generatePracticeOrder,
  orderSignature,
  validateRepresentation,
  witnessFor,
  xorshift32,
} from "../../packages/game-engine/src/index.js";
import type { OrderSpec } from "../../packages/contracts/src/index.js";

const bands = ["easy", "medium", "hard"] as const;
const activePlaces = (order: OrderSpec) =>
  DENOMINATIONS.filter(
    (_, index) => canonicalRepresentation(order.target)[index] > 0,
  );
const seedAt = (run: number, slot: number) =>
  xorshift32(
    (Math.imul(run + 1, 0x9e3779b9) ^ Math.imul(slot + 1, 0x85ebca6b)) >>> 0 ||
      1,
  );

describe("question variety without changing the lesson", () => {
  it("keeps every level solvable, reproducible and in its existing objective family at all bands", () => {
    for (const level of LEVELS)
      for (const band of bands)
        for (let run = 0; run < 32; run++)
          for (let slot = 0; slot < 5; slot++) {
            const seed = seedAt(run, slot);
            const order = generateLevelOrder(level.id, seed, slot, band);
            const first = witnessFor(order),
              second = alternateWitnessFor(order);
            expect(order).toEqual(
              generateLevelOrder(level.id, seed, slot, band),
            );
            expect(order.difficultyBand).toBe(band);
            expect(order.target).toBeGreaterThan(0);
            expect(order.target).toBeLessThanOrEqual(999999);
            expect(
              validateRepresentation(order, first, second).shipmentAccepted,
            ).toBe(true);
            expect(order.mode).toBe(
              level.ordinal < 29
                ? level.mode
                : [
                    "minimum",
                    "exactTypes",
                    "exactTypes",
                    "twoWays",
                    "restricted",
                  ][slot],
            );
            if (level.ordinal >= 22)
              expect(order.engineVersion).toBe("xorshift32-v4");
            if (level.ordinal === 22 || level.ordinal === 24)
              expect(order.target).toBeLessThanOrEqual(99999);
            if (level.ordinal === 23)
              expect(order.target).toBeGreaterThanOrEqual(1000);
            if (level.ordinal === 30)
              expect(order.target).toBeGreaterThanOrEqual(100000);
          }
  });

  it("guarantees varied Lab places within five questions even when each slot gets an unrelated seed", () => {
    for (const band of bands)
      for (let level = 22; level <= 28; level++)
        for (let run = 0; run < 64; run++) {
          const orders = Array.from({ length: 5 }, (_, slot) =>
            generateLevelOrder(`level-${level}`, seedAt(run, slot), slot, band),
          );
          const keys = orders.map((order) =>
            [23, 27, 28].includes(level)
              ? order.allowed.join(",")
              : activePlaces(order).join(","),
          );
          expect(
            new Set(keys).size,
            `level ${level}, ${band}, run ${run}`,
          ).toBe(level === 27 ? 4 : 5);
          if (level === 24) {
            // Neither ones nor the old thousands/ones pair is compulsory every time.
            expect(orders.some((order) => order.target % 10 === 0)).toBe(true);
            expect(new Set(orders.flatMap(activePlaces))).toEqual(
              new Set([10000, 1000, 100, 10, 1]),
            );
          }
        }
  });

  it("retains exact type counts and the amount of regrouping in each Lab family", () => {
    for (const band of bands)
      for (let level = 22; level <= 28; level++)
        for (let slot = 0; slot < 5; slot++)
          for (let run = 0; run < 32; run++) {
            const order = generateLevelOrder(
              `level-${level}`,
              seedAt(run, slot),
              slot,
              band,
            );
            const active = activePlaces(order),
              witness = witnessFor(order);
            if (level === 22) {
              expect(order.allowed).toEqual(DENOMINATIONS);
              expect(order.minimumRequired).toBe(true);
              expect(active.length).toBeGreaterThanOrEqual(4);
              expect(active.length).toBeLessThanOrEqual(5);
            }
            if (level === 23 || level === 28) {
              expect(order.allowed).toHaveLength(3);
              const [large, middle, small] = order.allowed;
              expect(
                [large / middle, middle / small].sort((a, b) => a - b),
              ).toEqual([10, 100]);
              expect(order.minimumRequired).toBe(true);
            }
            if (level === 23) {
              expect(active).toHaveLength(3);
              expect(witness.every((count) => count <= 9)).toBe(true);
            }
            if (level === 24 || level === 25) {
              expect(order.allowed).toEqual(DENOMINATIONS);
              expect(active).toHaveLength(level === 24 ? 2 : 4);
              expect(order.exactTypes).toBe(level === 24 ? 2 : 3);
              expect(witness.filter((count) => count > 0)).toHaveLength(
                order.exactTypes!,
              );
              expect(order.minimumRequired).toBe(false);
              // Four nonzero positions can become three types by one adjacent merge.
              if (level === 25)
                expect(
                  active.some(
                    (place, index) => place / (active[index + 1] ?? 1) === 10,
                  ),
                ).toBe(true);
            }
            if (level === 26 || level === 27) {
              expect(active).toHaveLength(level === 26 ? 1 : 2);
              expect(order.distinctRepresentations).toBe(2);
              const second = alternateWitnessFor(order)!;
              expect(
                second.reduce((sum, n) => sum + n, 0) -
                  witness.reduce((sum, n) => sum + n, 0),
              ).toBe(9);
              if (level === 27) {
                expect(order.allowed).toHaveLength(3);
                expect(order.allowed[0] / order.allowed[1]).toBe(10);
                expect(order.allowed[1] / order.allowed[2]).toBe(10);
              }
            }
            if (level === 28) {
              expect(active).toHaveLength(4);
              expect(
                active.filter((place) => !order.allowed.includes(place)),
              ).toHaveLength(1);
              expect(witness.filter((count) => count > 9)).toHaveLength(1);
              expect(Math.max(...witness)).toBeLessThanOrEqual(99);
              expect(order.sourceRepresentation).toEqual(
                canonicalRepresentation(order.target),
              );
            }
          }
  });

  it("varies mixed review place patterns across replays without changing the five objectives", () => {
    for (const level of [29, 30]) {
      const seen = Array.from({ length: 5 }, () => new Set<string>());
      for (let run = 0; run < 128; run++)
        for (const slot of [1, 2, 4]) {
          const order = generateLevelOrder(
            `level-${level}`,
            seedAt(run, slot),
            slot,
            "hard",
          );
          seen[slot].add(
            (slot === 4 ? order.allowed : activePlaces(order)).join(","),
          );
          expect(activePlaces(order)).toHaveLength(
            slot === 1 ? 2 : slot === 2 || level === 30 ? 4 : 3,
          );
        }
      for (const slot of [1, 2, 4])
        expect(seen[slot].size).toBeGreaterThanOrEqual(4);
    }
  });

  it("finds exact-type witnesses for trailing zeros and keeps impossible type counts invalid", () => {
    const base = generateLevelOrder("level-24", 1, 0);
    for (const [target, exactTypes] of [
      [45000, 2],
      [10100, 2],
      [7000, 2],
      [900, 3],
      [11100, 3],
      [123400, 3],
    ] as const) {
      const order = { ...base, target, exactTypes };
      const witness = witnessFor(order);
      expect(witness.filter((count) => count > 0)).toHaveLength(exactTypes);
      expect(validateRepresentation(order, witness).shipmentAccepted).toBe(
        true,
      );
    }
    for (const [target, exactTypes] of [
      [10, 2],
      [110, 3],
    ] as const)
      expect(() => witnessFor({ ...base, target, exactTypes })).toThrow(
        "CONFIG_INVALID",
      );
  });

  it("keeps signature avoidance and targeted practice with the same slot objective", () => {
    for (let level = 22; level <= 30; level++)
      for (let slot = 0; slot < 5; slot++) {
        const first = generateLevelOrder(
          `level-${level}`,
          123456789,
          slot,
          "hard",
        );
        const second = generateLevelOrder(
          `level-${level}`,
          123456789,
          slot,
          "hard",
          [orderSignature(first)],
        );
        expect(orderSignature(second)).not.toBe(orderSignature(first));
        expect(second.primarySkill).toBe(first.primarySkill);
        expect(second.mode).toBe(first.mode);
      }
    for (const skill of [
      "reason.minimum",
      "reason.exactTypes",
      "reason.multiple",
    ])
      for (let slot = 0; slot < 5; slot++) {
        const order = generatePracticeOrder(
          skill,
          seedAt(17, slot),
          slot,
          "medium",
          30,
        );
        expect(order.primarySkill).toBe(skill);
        expect(order.engineVersion).toBe("xorshift32-v4");
        expect(
          validateRepresentation(
            order,
            witnessFor(order),
            alternateWitnessFor(order),
          ).shipmentAccepted,
        ).toBe(true);
      }
  });
});
