import { DENOMINATIONS, type Denomination, type OrderSpec, type Representation, type Validation } from '../../contracts/src/index.js';
import { DIGIT_RANGES, LEVEL_ONE_SLOTS, levelById, type DifficultyBand } from '../../config/src/index.js';

export { DENOMINATIONS } from '../../contracts/src/index.js';
export type { Denomination, OrderSpec, Representation, Validation } from '../../contracts/src/index.js';

const MAX_QUANTITY = 999999;
const indexFor = new Map<number, number>(DENOMINATIONS.map((d, i) => [d, i]));

export function isRepresentation(value: unknown): value is Representation {
  return Array.isArray(value) && value.length === 6 && value.every((quantity) =>
    typeof quantity === 'number' && Number.isInteger(quantity) && quantity >= 0 && quantity <= MAX_QUANTITY);
}

export function representedTotal(vector: Representation): number {
  return Number(vector.reduce((total, quantity, index) => total + BigInt(quantity) * BigInt(DENOMINATIONS[index]), 0n));
}

export function crateCount(vector: Representation): number {
  return vector.reduce((total, quantity) => total + quantity, 0);
}

export function canonicalRepresentation(target: number): Representation {
  if (!Number.isInteger(target) || target < 0 || target > 999999) throw new Error('CONFIG_INVALID');
  let remaining = target;
  return DENOMINATIONS.map((denomination) => {
    const quantity = Math.floor(remaining / denomination);
    remaining %= denomination;
    return quantity;
  }) as unknown as Representation;
}

export function assertValidOrder(spec: Omit<OrderSpec, 'id'> | OrderSpec): void {
  if (!Number.isInteger(spec.target) || spec.target < 0 || spec.target > 999999 || spec.allowed.length === 0) throw new Error('CONFIG_INVALID');
  const allowed = [...spec.allowed];
  if (new Set(allowed).size !== allowed.length || allowed.some((d) => !indexFor.has(d))) throw new Error('CONFIG_INVALID');
  if (spec.minimumRequired && (spec.exactTypes !== null || spec.distinctRepresentations !== 1)) throw new Error('CONFIG_INVALID');
  if (!isRepresentable(spec.target, allowed)) throw new Error('CONFIG_INVALID');
}

export function isRepresentable(target: number, allowed: readonly Denomination[]): boolean {
  let remainder = target;
  for (const denomination of [...allowed].sort((a, b) => b - a)) remainder %= denomination;
  return remainder === 0;
}

/** Greedy is optimal for the fixed power-of-ten denominations with unlimited crates. */
export function greedyMinimum(target: number, allowed: readonly Denomination[]): number {
  if (!isRepresentable(target, allowed)) throw new Error('CONFIG_INVALID');
  let remaining = target;
  let count = 0;
  for (const denomination of [...allowed].sort((a, b) => b - a)) {
    const quantity = Math.floor(remaining / denomination);
    count += quantity;
    remaining -= quantity * denomination;
  }
  return count;
}

function hasForbiddenQuantity(vector: Representation, allowed: readonly Denomination[]): boolean {
  const allowedSet = new Set(allowed);
  return vector.some((quantity, index) => quantity > 0 && !allowedSet.has(DENOMINATIONS[index]));
}

function positiveTypes(vector: Representation): number { return vector.filter((quantity) => quantity > 0).length; }
function sameVector(a: Representation, b: Representation): boolean { return a.every((value, index) => value === b[index]); }

export function validateRepresentation(spec: OrderSpec, representationA: unknown, representationB: unknown = null): Validation {
  try { assertValidOrder(spec); } catch {
    return invalid();
  }
  if (!isRepresentation(representationA) || (spec.distinctRepresentations === 2 && !isRepresentation(representationB)) ||
      (spec.distinctRepresentations === 1 && representationB !== null && !isRepresentation(representationB))) return invalid();
  const a = representationA;
  const vectors = representationB === null ? [a] : [a, representationB as Representation];
  const totals = vectors.map(representedTotal);
  const counts = vectors.map(crateCount);
  const valueMatches = totals.every((total) => total === spec.target);
  const restrictionsMet = vectors.every((vector) => !hasForbiddenQuantity(vector, spec.allowed));
  const canonicalMet = !spec.canonicalRequired || vectors.every((vector) => sameVector(vector, canonicalRepresentation(spec.target)));
  const typesMet = spec.exactTypes === null || vectors.every((vector) => positiveTypes(vector) === spec.exactTypes);
  const distinctMet = spec.distinctRepresentations === 1 || !sameVector(a, representationB as Representation);
  const minimum = greedyMinimum(spec.target, spec.allowed);
  const minimumMet = !spec.minimumRequired || counts.every((count) => count === minimum);
  const objectiveMet = valueMatches && restrictionsMet && canonicalMet && typesMet && distinctMet && minimumMet;
  let feedbackCode: Validation['feedbackCode'] = 'SHIPMENT_CORRECT';
  if (!valueMatches) feedbackCode = totals.some((total) => total < spec.target) ? 'UNDERPRODUCTION' : 'OVERPRODUCTION';
  else if (!restrictionsMet) feedbackCode = 'MACHINE_UNAVAILABLE';
  else if (!canonicalMet) feedbackCode = 'STANDARD_REQUIRED';
  else if (!typesMet) feedbackCode = 'TYPE_COUNT';
  else if (!distinctMet) feedbackCode = 'SAME_REPRESENTATION';
  else if (!minimumMet) feedbackCode = 'CAN_REPACK';
  return { schemaValid: true, valueMatches, restrictionsMet, objectiveMet, shipmentAccepted: objectiveMet,
    representedTotals: totals, crateCounts: counts, minimumCrates: minimum, feedbackCode };
}

function invalid(): Validation {
  return { schemaValid: false, valueMatches: false, restrictionsMet: false, objectiveMet: false,
    shipmentAccepted: false, representedTotals: [], crateCounts: [], minimumCrates: null, feedbackCode: 'INVALID_INPUT' };
}

export function generateOrder(seed: number, slotIndex: number, difficultyBand: DifficultyBand = LEVEL_ONE_SLOTS[slotIndex]?.defaultBand ?? 'easy'): OrderSpec {
  const slot = LEVEL_ONE_SLOTS[slotIndex];
  if (!slot) throw new Error('CONFIG_INVALID');
  const [minimumDigit, maximumDigit] = DIGIT_RANGES[difficultyBand];
  const digit = minimumDigit + Math.abs(seed * 31 + slotIndex * 17) % (maximumDigit - minimumDigit + 1);
  return { id: `order-${seed}-${slotIndex}-${difficultyBand}`, target: digit * slot.place, allowed: DENOMINATIONS,
    canonicalRequired: true, minimumRequired: false, exactTypes: null, distinctRepresentations: 1,
    difficultyBand, primarySkill: slot.skillId };
}

/** Deterministic level generator; every branch supplies a whole-crate witness. */
export function generateLevelOrder(levelId: string, seed: number, slotIndex: number, difficultyBand: DifficultyBand = 'easy'): OrderSpec {
  const level = levelById(levelId); if (!level) throw new Error('CONFIG_INVALID');
  if (level.stage === 1) {
    const place = DENOMINATIONS[(level.ordinal + slotIndex + 1) % DENOMINATIONS.length];
    const digit = [1, 3, 6, 9][(seed + slotIndex + level.ordinal) % 4];
    return { id: `${levelId}-${seed}-${slotIndex}`, target: digit * place, allowed: DENOMINATIONS, canonicalRequired: true, minimumRequired: false, exactTypes: null, distinctRepresentations: 1, difficultyBand, primarySkill: `pv.${place}`, mode: 'standard' };
  }
  if (level.stage === 2) {
    const targets = [1203, 23040, 506020, 423892, 918273];
    return { id: `${levelId}-${seed}-${slotIndex}`, target: targets[(seed + slotIndex + level.ordinal) % targets.length], allowed: DENOMINATIONS, canonicalRequired: true, minimumRequired: false, exactTypes: null, distinctRepresentations: 1, difficultyBand, primarySkill: level.primarySkill, mode: 'standard' };
  }
  if (level.stage === 3) {
    const units = level.ordinal === 15 ? [1000, 100, 10, 1, 1000] : [10000, 1000, 100, 10, 1];
    const unit = units[slotIndex]; const quotient = level.ordinal === 15 ? 120 + ((seed + slotIndex) % 80) : 10 + ((seed + slotIndex) % 90);
    return { id: `${levelId}-${seed}-${slotIndex}`, target: unit * quotient, allowed: [unit] as Denomination[], canonicalRequired: false, minimumRequired: false, exactTypes: null, distinctRepresentations: 1, difficultyBand, primarySkill: level.primarySkill, mode: 'single' };
  }
  if (level.stage === 4) {
    const allowed = slotIndex % 2 ? [1000, 10] : [100, 1]; const minimum = Math.min(...allowed);
    const target = (1000 + (seed % 300)) * minimum;
    return { id: `${levelId}-${seed}-${slotIndex}`, target, allowed: allowed as Denomination[], canonicalRequired: false, minimumRequired: false, exactTypes: null, distinctRepresentations: 1, difficultyBand, primarySkill: level.primarySkill, mode: 'restricted' };
  }
  if (level.stage === 5) {
    const allowed = [10000, 1000, 10, 1] as Denomination[];
    return { id: `${levelId}-${seed}-${slotIndex}`, target: 458123, allowed, canonicalRequired: false, minimumRequired: false, exactTypes: null, distinctRepresentations: 1, difficultyBand, primarySkill: level.primarySkill, mode: 'forbidden' };
  }
  if (level.mode === 'exactTypes') return { id: `${levelId}-${seed}-${slotIndex}`, target: level.ordinal === 24 ? 100 : 111, allowed: DENOMINATIONS, canonicalRequired: false, minimumRequired: false, exactTypes: level.ordinal === 24 ? 2 : 3, distinctRepresentations: 1, difficultyBand, primarySkill: level.primarySkill, mode: 'exactTypes' };
  if (level.mode === 'twoWays') return { id: `${levelId}-${seed}-${slotIndex}`, target: 100, allowed: DENOMINATIONS, canonicalRequired: false, minimumRequired: false, exactTypes: null, distinctRepresentations: 2, difficultyBand, primarySkill: level.primarySkill, mode: 'twoWays' };
  const allowed = level.ordinal === 23 || level.ordinal === 28 ? [1000, 100, 1] as Denomination[] : DENOMINATIONS;
  return { id: `${levelId}-${seed}-${slotIndex}`, target: level.ordinal === 23 ? 5212 : 346, allowed, canonicalRequired: false, minimumRequired: level.mode === 'minimum' || level.mode === 'repack', exactTypes: null, distinctRepresentations: 1, difficultyBand, primarySkill: level.primarySkill, mode: level.mode };
}

/** Server/test witness helper; it is never sent to a learner as an answer. */
export function witnessFor(order: OrderSpec): Representation {
  if (order.exactTypes === 2) return [0, 0, 0, 0, 9, 10];
  if (order.exactTypes === 3) return [0, 0, 0, 1, 1, 1];
  return DENOMINATIONS.map((denomination) => {
    if (!order.allowed.includes(denomination)) return 0;
    let remainder = order.target;
    for (const larger of order.allowed.filter((value) => value > denomination)) remainder %= larger;
    return Math.floor(remainder / denomination);
  }) as unknown as Representation;
}

export function alternateWitnessFor(order: OrderSpec): Representation | null {
  if (order.distinctRepresentations !== 2) return null;
  return [0, 0, 0, 0, 10, 0];
}
