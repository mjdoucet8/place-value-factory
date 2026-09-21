import {
  DENOMINATIONS,
  type Denomination,
  type OrderSpec,
  type Representation,
  type Validation,
} from "../../contracts/src/index.js";
import {
  DIGIT_RANGES,
  LEVEL_ONE_SLOTS,
  STAGE_GATE_SKILLS,
  levelById,
  placeValueSkill,
  type DifficultyBand,
} from "../../config/src/index.js";

export { DENOMINATIONS } from "../../contracts/src/index.js";
export type {
  Denomination,
  OrderSpec,
  Representation,
  Validation,
} from "../../contracts/src/index.js";

const MAX_QUANTITY = 999999;
const indexFor = new Map<number, number>(DENOMINATIONS.map((d, i) => [d, i]));

export function isRepresentation(value: unknown): value is Representation {
  return (
    Array.isArray(value) &&
    value.length === 6 &&
    value.every(
      (quantity) =>
        typeof quantity === "number" &&
        Number.isInteger(quantity) &&
        quantity >= 0 &&
        quantity <= MAX_QUANTITY,
    )
  );
}

export function representedTotal(vector: Representation): number {
  return Number(
    vector.reduce(
      (total, quantity, index) =>
        total + BigInt(quantity) * BigInt(DENOMINATIONS[index]),
      0n,
    ),
  );
}

export function crateCount(vector: Representation): number {
  return vector.reduce((total, quantity) => total + quantity, 0);
}

export function canonicalRepresentation(target: number): Representation {
  if (!Number.isInteger(target) || target < 0 || target > 999999)
    throw new Error("CONFIG_INVALID");
  let remaining = target;
  return DENOMINATIONS.map((denomination) => {
    const quantity = Math.floor(remaining / denomination);
    remaining %= denomination;
    return quantity;
  }) as unknown as Representation;
}

export function assertValidOrder(
  spec: Omit<OrderSpec, "id"> | OrderSpec,
): void {
  if (
    !Number.isInteger(spec.target) ||
    spec.target < 0 ||
    spec.target > 999999 ||
    spec.allowed.length === 0
  )
    throw new Error("CONFIG_INVALID");
  const allowed = [...spec.allowed];
  if (
    new Set(allowed).size !== allowed.length ||
    allowed.some((d) => !indexFor.has(d))
  )
    throw new Error("CONFIG_INVALID");
  if (
    spec.minimumRequired &&
    (spec.exactTypes !== null || spec.distinctRepresentations !== 1)
  )
    throw new Error("CONFIG_INVALID");
  if (!isRepresentable(spec.target, allowed)) throw new Error("CONFIG_INVALID");
}

export function isRepresentable(
  target: number,
  allowed: readonly Denomination[],
): boolean {
  let remainder = target;
  for (const denomination of [...allowed].sort((a, b) => b - a))
    remainder %= denomination;
  return remainder === 0;
}

/** Greedy is optimal for the fixed power-of-ten denominations with unlimited crates. */
export function greedyMinimum(
  target: number,
  allowed: readonly Denomination[],
): number {
  if (!isRepresentable(target, allowed)) throw new Error("CONFIG_INVALID");
  let remaining = target;
  let count = 0;
  for (const denomination of [...allowed].sort((a, b) => b - a)) {
    const quantity = Math.floor(remaining / denomination);
    count += quantity;
    remaining -= quantity * denomination;
  }
  return count;
}

function hasForbiddenQuantity(
  vector: Representation,
  allowed: readonly Denomination[],
): boolean {
  const allowedSet = new Set(allowed);
  return vector.some(
    (quantity, index) => quantity > 0 && !allowedSet.has(DENOMINATIONS[index]),
  );
}

function positiveTypes(vector: Representation): number {
  return vector.filter((quantity) => quantity > 0).length;
}
function sameVector(a: Representation, b: Representation): boolean {
  return a.every((value, index) => value === b[index]);
}

export function validateRepresentation(
  spec: OrderSpec,
  representationA: unknown,
  representationB: unknown = null,
): Validation {
  try {
    assertValidOrder(spec);
  } catch {
    return invalid();
  }
  if (
    !isRepresentation(representationA) ||
    (spec.distinctRepresentations === 2 &&
      !isRepresentation(representationB)) ||
    (spec.distinctRepresentations === 1 &&
      representationB !== null &&
      !isRepresentation(representationB))
  )
    return invalid();
  const a = representationA;
  const vectors =
    representationB === null ? [a] : [a, representationB as Representation];
  const totals = vectors.map(representedTotal);
  const counts = vectors.map(crateCount);
  const valueMatches = totals.every((total) => total === spec.target);
  const restrictionsMet = vectors.every(
    (vector) => !hasForbiddenQuantity(vector, spec.allowed),
  );
  const canonicalMet =
    !spec.canonicalRequired ||
    vectors.every((vector) =>
      sameVector(vector, canonicalRepresentation(spec.target)),
    );
  const typesMet =
    spec.exactTypes === null ||
    vectors.every((vector) => positiveTypes(vector) === spec.exactTypes);
  const distinctMet =
    spec.distinctRepresentations === 1 ||
    !sameVector(a, representationB as Representation);
  const minimum = greedyMinimum(spec.target, spec.allowed);
  const minimumMet =
    !spec.minimumRequired || counts.every((count) => count === minimum);
  const objectiveMet =
    valueMatches &&
    restrictionsMet &&
    canonicalMet &&
    typesMet &&
    distinctMet &&
    minimumMet;
  let feedbackCode: Validation["feedbackCode"] = "SHIPMENT_CORRECT";
  if (!valueMatches)
    feedbackCode = totals.some((total) => total < spec.target)
      ? "UNDERPRODUCTION"
      : "OVERPRODUCTION";
  else if (!restrictionsMet) feedbackCode = "MACHINE_UNAVAILABLE";
  else if (!canonicalMet) feedbackCode = "STANDARD_REQUIRED";
  else if (!typesMet) feedbackCode = "TYPE_COUNT";
  else if (!distinctMet) feedbackCode = "SAME_REPRESENTATION";
  else if (!minimumMet) feedbackCode = "CAN_REPACK";
  return {
    schemaValid: true,
    valueMatches,
    restrictionsMet,
    objectiveMet,
    shipmentAccepted: objectiveMet,
    representedTotals: totals,
    crateCounts: counts,
    minimumCrates: minimum,
    feedbackCode,
  };
}

function invalid(): Validation {
  return {
    schemaValid: false,
    valueMatches: false,
    restrictionsMet: false,
    objectiveMet: false,
    shipmentAccepted: false,
    representedTotals: [],
    crateCounts: [],
    minimumCrates: null,
    feedbackCode: "INVALID_INPUT",
  };
}

export function generateOrder(
  seed: number,
  slotIndex: number,
  difficultyBand: DifficultyBand = LEVEL_ONE_SLOTS[slotIndex]?.defaultBand ??
    "easy",
): OrderSpec {
  const slot = LEVEL_ONE_SLOTS[slotIndex];
  if (!slot) throw new Error("CONFIG_INVALID");
  const [minimumDigit, maximumDigit] = DIGIT_RANGES[difficultyBand];
  const digit =
    minimumDigit +
    (Math.abs(seed * 31 + slotIndex * 17) % (maximumDigit - minimumDigit + 1));
  return {
    id: `order-${seed}-${slotIndex}-${difficultyBand}`,
    target: digit * slot.place,
    allowed: DENOMINATIONS,
    canonicalRequired: true,
    minimumRequired: false,
    exactTypes: null,
    distinctRepresentations: 1,
    difficultyBand,
    primarySkill: slot.skillId,
  };
}

/** A targeted practice order retains one immutable primary skill. */
export function generatePracticeOrder(
  skillId: string,
  seed: number,
  slotIndex: number,
  difficultyBand: DifficultyBand = "easy",
): OrderSpec {
  const placeBySkill: Record<string, Denomination> = {
    "pv.ones": 1,
    "pv.tens": 10,
    "pv.hundreds": 100,
    "pv.thousands": 1000,
    "pv.tenThousands": 10000,
    "pv.hundredThousands": 100000,
  };
  const place = placeBySkill[skillId];
  if (place) {
    const [low, high] = DIGIT_RANGES[difficultyBand];
    const digit = low + (Math.abs(seed + slotIndex) % (high - low + 1));
    return {
      id: `practice-${skillId}-${seed}-${slotIndex}`,
      target: digit * place,
      allowed: DENOMINATIONS,
      canonicalRequired: true,
      minimumRequired: false,
      exactTypes: null,
      distinctRepresentations: 1,
      difficultyBand,
      primarySkill: skillId,
      mode: "standard",
    };
  }
  const level = LEVELS_FOR_PRACTICE(skillId);
  return generateLevelOrder(level.id, seed, slotIndex, difficultyBand);
}

function LEVELS_FOR_PRACTICE(skillId: string) {
  const level = [
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
  ].indexOf(skillId);
  return level >= 0
    ? (levelById(`level-${level < 2 ? 5 + level * 3 : level + 8}`) ??
        levelById("level-1")!)
    : levelById("level-1")!;
}

/** Deterministic level generator; every branch supplies a whole-crate witness. */
export function generateLevelOrder(
  levelId: string,
  seed: number,
  slotIndex: number,
  difficultyBand: DifficultyBand = "easy",
): OrderSpec {
  const level = levelById(levelId);
  if (!level) throw new Error("CONFIG_INVALID");
  if (level.stage === 1) {
    const configuredSlot =
      level.ordinal === 1 ? LEVEL_ONE_SLOTS[slotIndex] : undefined;
    const place =
      configuredSlot?.place ??
      DENOMINATIONS[(level.ordinal + slotIndex + 1) % DENOMINATIONS.length];
    const [low, high] = DIGIT_RANGES[difficultyBand];
    const digit = low + ((seed + slotIndex + level.ordinal) % (high - low + 1));
    return {
      id: `${levelId}-${seed}-${slotIndex}`,
      target: digit * place,
      allowed: DENOMINATIONS,
      canonicalRequired: true,
      minimumRequired: false,
      exactTypes: null,
      distinctRepresentations: 1,
      difficultyBand,
      primarySkill: configuredSlot?.skillId ?? placeValueSkill(place),
      mode: "standard",
    };
  }
  if (level.stage === 2) {
    const targets = [1203, 23040, 506020, 423892, 918273];
    return {
      id: `${levelId}-${seed}-${slotIndex}`,
      target: targets[(seed + slotIndex + level.ordinal) % targets.length],
      allowed: DENOMINATIONS,
      canonicalRequired: true,
      minimumRequired: false,
      exactTypes: null,
      distinctRepresentations: 1,
      difficultyBand,
      primarySkill: level.primarySkill,
      mode: "standard",
    };
  }
  if (level.stage === 3) {
    const units =
      level.ordinal === 15
        ? [1000, 100, 10, 1, 1000]
        : [10000, 1000, 100, 10, 1];
    const unit = units[slotIndex];
    const quotient =
      level.ordinal === 15
        ? 120 + ((seed + slotIndex) % 80)
        : 10 + ((seed + slotIndex) % 90);
    return {
      id: `${levelId}-${seed}-${slotIndex}`,
      target: unit * quotient,
      allowed: [unit] as Denomination[],
      canonicalRequired: false,
      minimumRequired: false,
      exactTypes: null,
      distinctRepresentations: 1,
      difficultyBand,
      primarySkill: level.primarySkill,
      mode: "single",
    };
  }
  if (level.stage === 4) {
    const allowed = slotIndex % 2 ? [1000, 10] : [100, 1];
    const minimum = Math.min(...allowed);
    const target = (1000 + (seed % 300)) * minimum;
    return {
      id: `${levelId}-${seed}-${slotIndex}`,
      target,
      allowed: allowed as Denomination[],
      canonicalRequired: false,
      minimumRequired: false,
      exactTypes: null,
      distinctRepresentations: 1,
      difficultyBand,
      primarySkill: level.primarySkill,
      mode: "restricted",
    };
  }
  if (level.stage === 5) {
    const allowed = [10000, 1000, 10, 1] as Denomination[];
    const target = 458123;
    return {
      id: `${levelId}-${seed}-${slotIndex}`,
      target,
      allowed,
      canonicalRequired: false,
      minimumRequired: false,
      exactTypes: null,
      distinctRepresentations: 1,
      difficultyBand,
      primarySkill: level.primarySkill,
      mode: level.mode,
      ...(level.mode === "repack"
        ? { sourceRepresentation: canonicalRepresentation(target) }
        : {}),
    };
  }
  if (level.mode === "exactTypes") {
    const tens = 1 + ((seed + slotIndex) % 9);
    const ones = 1 + ((seed * 3 + slotIndex) % 9);
    const hundreds = 1 + ((seed * 5 + slotIndex) % 9);
    return {
      id: `${levelId}-${seed}-${slotIndex}`,
      target:
        level.ordinal === 24
          ? tens * 10 + ones
          : hundreds * 100 + tens * 10 + ones,
      allowed: DENOMINATIONS,
      canonicalRequired: false,
      minimumRequired: false,
      exactTypes: level.ordinal === 24 ? 2 : 3,
      distinctRepresentations: 1,
      difficultyBand,
      primarySkill: level.primarySkill,
      mode: "exactTypes",
    };
  }
  if (level.mode === "twoWays") {
    const target = (1 + ((seed + slotIndex) % 9)) * 100;
    return {
      id: `${levelId}-${seed}-${slotIndex}`,
      target,
      allowed: DENOMINATIONS,
      canonicalRequired: false,
      minimumRequired: false,
      exactTypes: null,
      distinctRepresentations: 2,
      difficultyBand,
      primarySkill: level.primarySkill,
      mode: "twoWays",
    };
  }
  const allowed =
    level.ordinal === 23 || level.ordinal === 28
      ? ([1000, 100, 1] as Denomination[])
      : DENOMINATIONS;
  const target =
    level.ordinal === 23
      ? 5212
      : level.ordinal === 28
        ? 346
        : 346 + ((seed + slotIndex) % 40) * 10;
  return {
    id: `${levelId}-${seed}-${slotIndex}`,
    target,
    allowed,
    canonicalRequired: false,
    minimumRequired: level.mode === "minimum" || level.mode === "repack",
    exactTypes: null,
    distinctRepresentations: 1,
    difficultyBand,
    primarySkill: level.primarySkill,
    mode: level.mode,
    ...(level.mode === "repack"
      ? { sourceRepresentation: canonicalRepresentation(target) }
      : {}),
  };
}

/** Server/test witness helper; it is never sent to a learner as an answer. */
export function witnessFor(order: OrderSpec): Representation {
  if (order.exactTypes === 2) {
    const tens = Math.floor(order.target / 10);
    return [0, 0, 0, 0, tens, order.target % 10] as Representation;
  }
  if (order.exactTypes === 3) {
    const hundreds = Math.floor(order.target / 100);
    const remainder = order.target % 100;
    return [
      0,
      0,
      0,
      hundreds,
      Math.floor(remainder / 10),
      remainder % 10,
    ] as Representation;
  }
  return DENOMINATIONS.map((denomination) => {
    if (!order.allowed.includes(denomination)) return 0;
    let remainder = order.target;
    for (const larger of order.allowed.filter((value) => value > denomination))
      remainder %= larger;
    return Math.floor(remainder / denomination);
  }) as unknown as Representation;
}

export function alternateWitnessFor(order: OrderSpec): Representation | null {
  if (order.distinctRepresentations !== 2) return null;
  return [0, 0, 0, 0, order.target / 10, 0] as Representation;
}

export type HintStep = "none" | "H1" | "H2" | "H3";
export type ResolutionFacts = {
  firstObjectiveCorrect: boolean;
  wrongSubmissions: number;
  highestHint: HintStep;
  skipped: boolean;
};
export type EvidenceRecord = {
  skillId: string;
  score: number;
  independentFirst: boolean;
  attemptId: string;
  signature: string;
  committedAt: string;
  eligible?: boolean;
};
export type MasteryStatus = "unknown" | "emerging" | "developing" | "secure";
export type MasterySummary = {
  skillId: string;
  score: number | null;
  sampleN: number;
  independentFirstN: number;
  distinctAttemptN: number;
  status: MasteryStatus;
  needsRefresh: boolean;
  practiceSuggested: boolean;
  lastEvidenceAt: string | null;
};
export type ScaffoldState = {
  lowScoreStreak: number;
  remainingEasyOrders: number;
  independentSuccesses: number;
};

/** Policy precedence is H3, retry, H1/H2, then an independent first success. */
export function evidenceScore(facts: ResolutionFacts): number {
  if (facts.skipped) return 0;
  if (facts.highestHint === "H3") return 0.25;
  if (facts.wrongSubmissions > 0) return 0.6;
  if (!facts.firstObjectiveCorrect) return 0;
  if (facts.highestHint === "H1" || facts.highestHint === "H2") return 0.8;
  return 1;
}

export function isIndependentFirst(facts: ResolutionFacts): boolean {
  return (
    !facts.skipped &&
    facts.firstObjectiveCorrect &&
    facts.wrongSubmissions === 0 &&
    facts.highestHint === "none"
  );
}

/** Deduplicate matching order signatures inside a rolling 24-hour evidence window. */
export function eligibleEvidence(
  records: readonly EvidenceRecord[],
): EvidenceRecord[] {
  const latestFirst = [...records]
    .filter((record) => record.eligible !== false)
    .sort((a, b) => Date.parse(b.committedAt) - Date.parse(a.committedAt));
  const seen = new Map<string, number>();
  return latestFirst
    .filter((record) => {
      const committedAt = Date.parse(record.committedAt);
      const prior = seen.get(record.signature);
      if (prior !== undefined && prior - committedAt < 24 * 60 * 60 * 1000)
        return false;
      seen.set(record.signature, committedAt);
      return true;
    })
    .slice(0, 12);
}

export function summarizeMastery(
  skillId: string,
  records: readonly EvidenceRecord[],
  now: Date = new Date(),
): MasterySummary {
  const evidence = eligibleEvidence(
    records.filter((record) => record.skillId === skillId),
  );
  const lastEvidenceAt = evidence[0]?.committedAt ?? null;
  if (evidence.length === 0)
    return {
      skillId,
      score: null,
      sampleN: 0,
      independentFirstN: 0,
      distinctAttemptN: 0,
      status: "unknown",
      needsRefresh: false,
      practiceSuggested: false,
      lastEvidenceAt,
    };
  const weighted = evidence.reduce(
    (total, record, index) => total + record.score * 0.9 ** index,
    0,
  );
  const weights = evidence.reduce((total, _, index) => total + 0.9 ** index, 0);
  const score = weighted / weights;
  const independentFirstN = evidence.filter(
    (record) => record.independentFirst,
  ).length;
  const distinctAttemptN = new Set(evidence.map((record) => record.attemptId))
    .size;
  const newestFourIndependent = evidence
    .slice(0, 4)
    .filter((record) => record.independentFirst).length;
  const secure =
    score >= 0.85 &&
    evidence.length >= 8 &&
    independentFirstN >= 6 &&
    distinctAttemptN >= 2 &&
    newestFourIndependent >= 3;
  const status: MasteryStatus = secure
    ? "secure"
    : score < 0.5
      ? "emerging"
      : "developing";
  const needsRefresh =
    Date.parse(lastEvidenceAt) <= now.getTime() - 14 * 24 * 60 * 60 * 1000;
  return {
    skillId,
    score,
    sampleN: evidence.length,
    independentFirstN,
    distinctAttemptN,
    status,
    needsRefresh,
    practiceSuggested: status !== "secure" || needsRefresh,
    lastEvidenceAt,
  };
}

export function difficultyFor(status: MasteryStatus): DifficultyBand {
  return status === "secure"
    ? "hard"
    : status === "developing"
      ? "medium"
      : "easy";
}

/** Update the per-skill scaffold only when that skill receives resolved evidence. */
export function updateScaffold(
  state: ScaffoldState,
  score: number,
  independentFirst: boolean,
): ScaffoldState {
  const lowScoreStreak = score <= 0.6 ? state.lowScoreStreak + 1 : 0;
  const independentSuccesses =
    state.remainingEasyOrders > 0 && independentFirst
      ? state.independentSuccesses + 1
      : 0;
  if (independentSuccesses >= 2)
    return {
      lowScoreStreak: 0,
      remainingEasyOrders: 0,
      independentSuccesses: 0,
    };
  if (lowScoreStreak >= 2)
    return { lowScoreStreak, remainingEasyOrders: 3, independentSuccesses: 0 };
  return {
    lowScoreStreak,
    remainingEasyOrders: Math.max(0, state.remainingEasyOrders - 1),
    independentSuccesses,
  };
}

export function adaptedDifficulty(
  mastery: MasterySummary,
  scaffold: ScaffoldState,
): DifficultyBand {
  return scaffold.remainingEasyOrders > 0
    ? "easy"
    : difficultyFor(mastery.status);
}

export function stageGate(
  stage: number,
  evidence: readonly EvidenceRecord[],
  now: Date = new Date(),
) {
  const requiredSkillIds = STAGE_GATE_SKILLS[stage] ?? [];
  const summaries = requiredSkillIds.map((skillId) =>
    summarizeMastery(skillId, evidence, now),
  );
  return {
    requiredSkillIds,
    summaries,
    satisfied:
      requiredSkillIds.length > 0 &&
      summaries.every((summary) => summary.status === "secure"),
  };
}

/** Select the lowest-scoring unsecure prerequisite, with unknown evidence first. */
export function nextPracticeSkill(
  requiredSkillIds: readonly string[],
  evidence: readonly EvidenceRecord[],
  now: Date = new Date(),
): string | null {
  const candidates = requiredSkillIds
    .map((skillId) => summarizeMastery(skillId, evidence, now))
    .filter((summary) => summary.status !== "secure");
  if (candidates.length === 0) return null;
  candidates.sort((left, right) => {
    const leftUnknown = left.score === null ? 0 : 1;
    const rightUnknown = right.score === null ? 0 : 1;
    if (leftUnknown !== rightUnknown) return leftUnknown - rightUnknown;
    if ((left.score ?? 0) !== (right.score ?? 0))
      return (left.score ?? 0) - (right.score ?? 0);
    return left.skillId.localeCompare(right.skillId);
  });
  return candidates[0].skillId;
}
