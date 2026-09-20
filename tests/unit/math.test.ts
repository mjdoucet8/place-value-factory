import { describe, expect, it } from 'vitest';
import fixtures from '../fixtures/math_cases.json';
import { DENOMINATIONS, adaptedDifficulty, alternateWitnessFor, assertValidOrder, difficultyFor, evidenceScore, generateLevelOrder, generateOrder, greedyMinimum, isIndependentFirst, nextPracticeSkill, stageGate, summarizeMastery, updateScaffold, validateRepresentation, witnessFor } from '../../packages/game-engine/src/index.js';
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

describe('mastery and adaptation policy', () => {
  const at = (day: number) => new Date(Date.UTC(2026, 0, day)).toISOString();
  const evidence = (index: number, overrides: Record<string, unknown> = {}) => ({ skillId: 'pv.ones', score: 1, independentFirst: true, attemptId: `attempt-${index % 2}`, signature: `order-${index}`, committedAt: at(index + 1), ...overrides });

  it('uses the documented evidence-score precedence and excludes time', () => {
    expect(evidenceScore({ firstObjectiveCorrect: true, wrongSubmissions: 0, highestHint: 'none', skipped: false })).toBe(1);
    expect(evidenceScore({ firstObjectiveCorrect: true, wrongSubmissions: 0, highestHint: 'H2', skipped: false })).toBe(0.8);
    expect(evidenceScore({ firstObjectiveCorrect: true, wrongSubmissions: 2, highestHint: 'H2', skipped: false })).toBe(0.6);
    expect(evidenceScore({ firstObjectiveCorrect: true, wrongSubmissions: 0, highestHint: 'H3', skipped: false })).toBe(0.25);
    expect(evidenceScore({ firstObjectiveCorrect: true, wrongSubmissions: 0, highestHint: 'none', skipped: true })).toBe(0);
    expect(isIndependentFirst({ firstObjectiveCorrect: true, wrongSubmissions: 0, highestHint: 'none', skipped: false })).toBe(true);
  });

  it('requires a sufficient, diverse independent sample for secure status', () => {
    expect(summarizeMastery('pv.ones', Array.from({ length: 8 }, (_, index) => evidence(index)), new Date(at(10)))).toMatchObject({ status: 'secure', sampleN: 8, independentFirstN: 8, distinctAttemptN: 2 });
    expect(summarizeMastery('pv.ones', Array.from({ length: 7 }, (_, index) => evidence(index)), new Date(at(10))).status).toBe('developing');
    expect(summarizeMastery('pv.ones', Array.from({ length: 8 }, (_, index) => evidence(index, { attemptId: 'same-attempt' })), new Date(at(10))).status).toBe('developing');
  });

  it('deduplicates repeated signatures within 24 hours and marks absence as refresh, not score decay', () => {
    const repeated = [evidence(1), evidence(2, { signature: 'order-1', committedAt: new Date(Date.UTC(2026, 0, 1, 12)).toISOString() })];
    expect(summarizeMastery('pv.ones', repeated, new Date(at(3))).sampleN).toBe(1);
    const summary = summarizeMastery('pv.ones', Array.from({ length: 8 }, (_, index) => evidence(index)), new Date(Date.UTC(2026, 1, 1)));
    expect(summary).toMatchObject({ status: 'secure', needsRefresh: true });
  });

  it('selects bands from mastery and applies only a bounded per-skill scaffold', () => {
    expect(difficultyFor('unknown')).toBe('easy');
    expect(difficultyFor('developing')).toBe('medium');
    expect(difficultyFor('secure')).toBe('hard');
    let state = { lowScoreStreak: 0, remainingEasyOrders: 0, independentSuccesses: 0 };
    state = updateScaffold(state, 0.6, false);
    state = updateScaffold(state, 0.6, false);
    expect(state.remainingEasyOrders).toBe(3);
    const secure = summarizeMastery('pv.ones', Array.from({ length: 8 }, (_, index) => evidence(index)), new Date(at(10)));
    expect(adaptedDifficulty(secure, state)).toBe('easy');
    state = updateScaffold(state, 1, true);
    state = updateScaffold(state, 1, true);
    expect(state.remainingEasyOrders).toBe(0);
    expect(adaptedDifficulty(secure, state)).toBe('hard');
  });

  it('keeps stage gates separate from completed paths and selects a positive practice target', () => {
    const secureOnes = Array.from({ length: 8 }, (_, index) => evidence(index));
    expect(stageGate(1, secureOnes, new Date(at(10))).satisfied).toBe(false);
    expect(nextPracticeSkill(['pv.ones', 'pv.tens'], secureOnes, new Date(at(10)))).toBe('pv.tens');
    const allStageOne = ['pv.ones', 'pv.tens', 'pv.hundreds', 'pv.thousands', 'pv.tenThousands', 'pv.hundredThousands'].flatMap((skillId, skillIndex) => Array.from({ length: 8 }, (_, index) => evidence(index + skillIndex * 20, { skillId })));
    expect(stageGate(1, allStageOne, new Date(at(200)))).toMatchObject({ satisfied: true, requiredSkillIds: expect.arrayContaining(['pv.ones', 'pv.hundredThousands']) });
  });
});
