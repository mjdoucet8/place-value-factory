import { describe, expect, it } from 'vitest';
import fixtures from '../fixtures/math_cases.json';
import { DENOMINATIONS, alternateWitnessFor, assertValidOrder, generateLevelOrder, generateOrder, greedyMinimum, validateRepresentation, witnessFor } from '../../packages/game-engine/src/index.js';
import { LEVELS } from '../../packages/config/src/index.js';
import { dynamicProgrammingMinimum } from '../oracles/minimum-oracle.js';

describe('fixture mathematical validation', () => {
  for (const item of fixtures.cases) it(item.id, () => {
    const result = validateRepresentation({ id: item.id, target: item.target, allowed: item.allowed as unknown as typeof DENOMINATIONS,
      canonicalRequired: item.canonicalRequired, minimumRequired: item.minimumRequired,
      exactTypes: item.exactTypes as 2 | 3 | null, distinctRepresentations: item.distinctRepresentations as 1 | 2 }, item.representationA, item.representationB);
    expect(result.shipmentAccepted).toBe(item.expected.accepted);
    expect(result.feedbackCode).toBe(item.expected.feedbackCode);
    if ('representedTotal' in item.expected) expect(result.representedTotals[0]).toBe(item.expected.representedTotal);
    if ('crateCount' in item.expected) expect(result.crateCounts[0]).toBe(item.expected.crateCount);
    if ('minimumCrates' in item.expected) expect(result.minimumCrates).toBe(item.expected.minimumCrates);
  });
  for (const invalid of fixtures.invalidConfigurations) it(`rejects invalid config ${invalid.target}`, () => {
    expect(() => assertValidOrder({ id: 'invalid', canonicalRequired: false, distinctRepresentations: 1, exactTypes: null,
      minimumRequired: false, ...invalid } as never)).toThrow('CONFIG_INVALID');
  });
});

describe('minimum oracle', () => {
  it('agrees with the independent oracle for all subsets and targets through 2,000', () => {
    for (let mask = 1; mask < 64; mask++) {
      const allowed = DENOMINATIONS.filter((_, index) => mask & (1 << index));
      for (let target = 0; target <= 2000; target++) {
        const oracle = dynamicProgrammingMinimum(target, allowed);
        if (oracle !== null) expect(greedyMinimum(target, allowed)).toBe(oracle);
      }
    }
  });
  it('generates reproducible valid orders with witnesses', () => {
    for (let slot = 0; slot < 5; slot++) {
      expect(generateOrder(7, slot)).toEqual(generateOrder(7, slot));
      const order = generateOrder(7, slot);
      const digits = order.target.toString().padStart(6, '0').split('').map(Number);
      expect(validateRepresentation(order, digits)).toMatchObject({ shipmentAccepted: true });
    }
  });
  it('uses the configured Stage 1 difficulty band without changing required place coverage', () => {
    for (const band of ['easy', 'medium', 'hard'] as const) {
      const order = generateOrder(7, 1, band);
      const digit = order.target / 10;
      expect(order.difficultyBand).toBe(band);
      expect(digit).toBeGreaterThanOrEqual(band === 'easy' ? 1 : band === 'medium' ? 4 : 7);
      expect(digit).toBeLessThanOrEqual(band === 'easy' ? 3 : band === 'medium' ? 6 : 9);
    }
  });
  it('emits a validated witness for every configured level and slot', () => {
    for (const level of LEVELS) for (let slot = 0; slot < 5; slot++) {
      const order = generateLevelOrder(level.id, 71, slot);
      expect(validateRepresentation(order, witnessFor(order), alternateWitnessFor(order))).toMatchObject({ shipmentAccepted: true });
    }
  });
});
