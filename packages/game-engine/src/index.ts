import {
  DENOMINATIONS,
  type Denomination,
  type OrderSpec,
  type Representation,
  type Validation,
} from "../../contracts/src/index.js";
import {
  DIGIT_RANGES,
  LEVELS,
  LEVEL_ONE_SLOTS,
  STAGE_ONE_PLACES,
  STAGE_TWO_PLACES,
  STAGE_GATE_SKILLS,
  levelById,
  placeValueSkill,
  type DifficultyBand,
  type LevelMode,
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

/** Published V1 xorshift32 stream; generated orders store the original seed. */
export function xorshift32(seed: number): number {
  if (!Number.isInteger(seed) || seed < 1 || seed > 0xffffffff)
    throw new Error("CONFIG_INVALID");
  let value = seed >>> 0;
  value ^= value << 13;
  value >>>= 0;
  value ^= value >>> 17;
  value >>>= 0;
  value ^= value << 5;
  return value >>> 0;
}

function seededRange(
  seed: number,
  level: number,
  slot: number,
  low: number,
  high: number,
  drawIndex = 0,
) {
  const mixed =
    (seed ^
      Math.imul(level, 0x9e3779b9) ^
      Math.imul(slot + 1, 0x85ebca6b) ^
      Math.imul(drawIndex + 1, 0xc2b2ae35)) >>>
    0;
  const draw = xorshift32(mixed || 1);
  return Math.floor((draw / 2 ** 32) * (high - low + 1)) + low;
}

function assertSeedAndSlot(seed: number, slotIndex: number): void {
  if (!Number.isInteger(seed) || seed < 1 || seed > 0xffffffff)
    throw new Error("CONFIG_INVALID");
  if (!Number.isInteger(slotIndex) || slotIndex < 0 || slotIndex > 4)
    throw new Error("CONFIG_INVALID");
}

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
    !Array.isArray(spec.allowed) ||
    spec.allowed.length === 0 ||
    typeof spec.canonicalRequired !== "boolean" ||
    typeof spec.minimumRequired !== "boolean" ||
    ![null, 2, 3].includes(spec.exactTypes) ||
    ![1, 2].includes(spec.distinctRepresentations)
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
    (spec.exactTypes !== null ||
      spec.distinctRepresentations !== 1 ||
      spec.target === 0)
  )
    throw new Error("CONFIG_INVALID");
  if (
    (spec.canonicalRequired &&
      (spec.minimumRequired ||
        spec.exactTypes !== null ||
        spec.distinctRepresentations !== 1)) ||
    (spec.exactTypes !== null && spec.distinctRepresentations !== 1) ||
    (spec.mode !== undefined &&
      ![
        "standard",
        "single",
        "restricted",
        "forbidden",
        "minimum",
        "exactTypes",
        "twoWays",
        "repack",
        "mixed",
      ].includes(spec.mode)) ||
    (spec.mode === "minimum" && !spec.minimumRequired) ||
    (spec.mode === "exactTypes" && spec.exactTypes === null) ||
    (spec.mode === "twoWays" && spec.distinctRepresentations !== 2) ||
    (spec.mode === "standard" && !spec.canonicalRequired) ||
    (spec.mode === "single" &&
      (spec.allowed.length !== 1 || spec.canonicalRequired))
  )
    throw new Error("CONFIG_INVALID");
  if (
    spec.target === 0 &&
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
  if (!restrictionsMet) feedbackCode = "MACHINE_UNAVAILABLE";
  else if (!valueMatches)
    feedbackCode = totals.some((total) => total < spec.target)
      ? "UNDERPRODUCTION"
      : "OVERPRODUCTION";
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
    // Do not disclose the minimum answer while the learner's total is wrong.
    minimumCrates: valueMatches ? minimum : null,
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
  assertSeedAndSlot(seed, slotIndex);
  if (!(difficultyBand in DIGIT_RANGES)) throw new Error("CONFIG_INVALID");
  const slot = LEVEL_ONE_SLOTS[slotIndex];
  if (!slot) throw new Error("CONFIG_INVALID");
  const [minimumDigit, maximumDigit] = DIGIT_RANGES[difficultyBand];
  const digit =
    minimumDigit +
    (Math.abs(seed * 31 + slotIndex * 17) % (maximumDigit - minimumDigit + 1));
  return {
    id: `order-${seed}-${slotIndex}-${difficultyBand}`,
    target: digit * slot.place,
    allowed: [slot.place],
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
  availableThrough = 30,
  recentSignatures: readonly string[] = [],
): OrderSpec {
  assertSeedAndSlot(seed, slotIndex);
  if (
    !Number.isInteger(availableThrough) ||
    availableThrough < 1 ||
    availableThrough > 30
  )
    throw new Error("CONFIG_INVALID");
  if (!(difficultyBand in DIGIT_RANGES)) throw new Error("CONFIG_INVALID");
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
    const recent = new Set(recentSignatures.slice(-10));
    const practiceOrder = (digit: number, idSeed: string): OrderSpec => ({
      id: `practice-${skillId}-${idSeed}-${slotIndex}`,
      target: digit * place,
      allowed: DENOMINATIONS,
      canonicalRequired: true,
      minimumRequired: false,
      exactTypes: null,
      distinctRepresentations: 1,
      difficultyBand,
      primarySkill: skillId,
      mode: "standard",
    });
    for (let attempt = 0; attempt < 100; attempt++) {
      const candidateSeed =
        attempt === 0
          ? seed
          : xorshift32((seed ^ Math.imul(attempt, 0x9e3779b9)) >>> 0 || 1);
      const digit = low + (xorshift32(candidateSeed) % (high - low + 1));
      const order = practiceOrder(digit, String(candidateSeed));
      if (
        validateRepresentation(order, canonicalRepresentation(order.target))
          .shipmentAccepted &&
        !recent.has(orderSignature(order))
      )
        return order;
    }
    const fallback = practiceOrder(low, `fallback-${difficultyBand}`);
    if (
      validateRepresentation(fallback, canonicalRepresentation(fallback.target))
        .shipmentAccepted
    )
      return fallback;
    throw new Error("CONFIG_INVALID");
  }
  const level = practiceBlueprintFor(skillId, availableThrough);
  return generateLevelOrder(
    level.id,
    seed,
    slotIndex,
    difficultyBand,
    recentSignatures,
  );
}

export function practiceBlueprintFor(
  skillId: string,
  availableThrough: number,
) {
  const pureBlueprints: Record<string, readonly number[]> = {
    "pv.ones": [1, 3, 4],
    "pv.tens": [1, 3, 4],
    "pv.hundreds": [1, 3, 4],
    "pv.thousands": [2, 3],
    "pv.tenThousands": [2, 4],
    "pv.hundredThousands": [2, 3, 4],
    "standard.decompose": [5, 6, 7],
    "standard.zero": [8],
    "rename.100000_10000": [10],
    "rename.10000_1000": [11],
    "rename.1000_100": [12],
    "rename.100_10": [13],
    "rename.10_1": [14],
    "rename.multi": [15],
    "compose.allowed": [16, 17, 18],
    "compose.forbidden": [19, 20, 21],
    "reason.minimum": [22, 23, 28],
    "reason.exactTypes": [24, 25],
    "reason.multiple": [26, 27],
  };
  const ordinal = pureBlueprints[skillId]
    ?.filter((number) => number <= availableThrough)
    .sort((a, b) => b - a)[0];
  const level = ordinal ? levelById(`level-${ordinal}`) : undefined;
  if (!level) throw new Error("CONFIG_INVALID");
  return level;
}

/** Deterministic level generator; every branch supplies a whole-crate witness. */
function constructLevelOrder(
  levelId: string,
  seed: number,
  slotIndex: number,
  difficultyBand: DifficultyBand = "easy",
): OrderSpec {
  assertSeedAndSlot(seed, slotIndex);
  if (!(difficultyBand in DIGIT_RANGES)) throw new Error("CONFIG_INVALID");
  const level = levelById(levelId);
  if (!level) throw new Error("CONFIG_INVALID");
  if (level.stage === 1) {
    const configuredSlot = LEVEL_ONE_SLOTS[slotIndex];
    const place = STAGE_ONE_PLACES[level.ordinal]?.[slotIndex];
    if (!place) throw new Error("CONFIG_INVALID");
    const [low, high] = DIGIT_RANGES[difficultyBand];
    const digit = seededRange(seed, level.ordinal, slotIndex, low, high);
    return {
      id: `${levelId}-${seed}-${slotIndex}`,
      target: digit * place,
      allowed: DENOMINATIONS,
      canonicalRequired: true,
      minimumRequired: false,
      exactTypes: null,
      distinctRepresentations: 1,
      difficultyBand,
      primarySkill:
        level.ordinal === 1 ? configuredSlot.skillId : placeValueSkill(place),
      mode: "standard",
    };
  }
  if (level.stage === 2) {
    const places = STAGE_TWO_PLACES[level.ordinal]?.[slotIndex];
    if (!places) throw new Error("CONFIG_INVALID");
    const [low, high] = DIGIT_RANGES[difficultyBand];
    const target = places.reduce(
      (sum, place, index) =>
        sum +
        place * seededRange(seed, level.ordinal, slotIndex, low, high, index),
      0,
    );
    return {
      id: `${levelId}-${seed}-${slotIndex}`,
      target,
      allowed: DENOMINATIONS,
      canonicalRequired: true,
      minimumRequired: false,
      exactTypes: null,
      distinctRepresentations: 1,
      difficultyBand,
      primarySkill:
        level.ordinal === 9 && slotIndex === 4
          ? "standard.decompose"
          : level.primarySkill,
      mode: "standard",
    };
  }
  if (level.stage === 3) {
    const unit =
      level.ordinal === 15
        ? ([1000, 100, 10, 1, 1000] as const)[slotIndex]
        : ([10000, 1000, 100, 10, 1] as const)[level.ordinal - 10];
    if (!unit) throw new Error("CONFIG_INVALID");
    const [low, high] =
      level.ordinal === 15
        ? difficultyBand === "easy"
          ? [100, 299]
          : difficultyBand === "medium"
            ? [300, 699]
            : [700, 999]
        : difficultyBand === "easy"
          ? [10, 29]
          : difficultyBand === "medium"
            ? [30, 69]
            : [70, 99];
    const quotient = seededRange(seed, level.ordinal, slotIndex, low, high);
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
    const allowed: Denomination[] =
      level.ordinal === 16
        ? slotIndex % 2
          ? [1000, 10]
          : [100, 1]
        : level.ordinal === 17
          ? slotIndex % 2
            ? [100000, 1000, 10]
            : [10000, 100, 1]
          : (
              [
                [10000, 100, 1],
                [100000, 1000, 10],
                [100000, 10000, 1],
                [10000, 100, 10, 1],
                [1000, 100, 10, 1],
              ] as Denomination[][]
            )[slotIndex];
    if (!allowed) throw new Error("CONFIG_INVALID");
    const target =
      level.ordinal === 18 && slotIndex === 0
        ? 529521
        : level.ordinal === 16
          ? allowed[0] * seededRange(seed, level.ordinal, slotIndex, 1, 7) +
            allowed[1] * seededRange(seed, level.ordinal, slotIndex, 1, 9, 1)
          : allowed.reduce(
              (sum, place, index) =>
                sum +
                place *
                  seededRange(seed, level.ordinal, slotIndex, 1, 6, index),
              0,
            );
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
      mode: "restricted",
    };
  }
  if (level.stage === 5) {
    const forbiddenByLevel: Record<
      number,
      readonly (readonly Denomination[])[]
    > = {
      19: [[10000], [1000], [100], [10], [10000]],
      20: [
        [100000, 100],
        [10000, 100],
        [1000, 10],
        [100000, 1000],
        [10000, 10],
      ],
      21: [[100000, 100], [10000], [1000, 10], [100, 10], [100000, 10000]],
    };
    const forbidden = forbiddenByLevel[level.ordinal]?.[slotIndex];
    if (!forbidden) throw new Error("CONFIG_INVALID");
    const allowed = DENOMINATIONS.filter((place) => !forbidden.includes(place));
    const target =
      level.ordinal === 20 && slotIndex === 0
        ? 458123
        : DENOMINATIONS.reduce(
            (sum, place, index) =>
              sum +
              place * seededRange(seed, level.ordinal, slotIndex, 1, 6, index),
            0,
          );
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
  const challengeMode: LevelMode =
    level.ordinal >= 29
      ? (
          [
            "minimum",
            "exactTypes",
            "exactTypes",
            "twoWays",
            "restricted",
          ] as const
        )[slotIndex]
      : level.mode;
  if (!challengeMode) throw new Error("CONFIG_INVALID");
  const digit = (draw: number) =>
    seededRange(seed, level.ordinal, slotIndex, 1, 9, draw);
  const primarySkill =
    challengeMode === "exactTypes"
      ? "reason.exactTypes"
      : challengeMode === "twoWays"
        ? "reason.multiple"
        : challengeMode === "restricted"
          ? "compose.allowed"
          : "reason.minimum";
  if (challengeMode === "exactTypes") {
    const exactTypes =
      level.ordinal === 24 || (level.ordinal >= 29 && slotIndex === 1) ? 2 : 3;
    const target =
      exactTypes === 2
        ? (level.ordinal === 30
            ? 100000
            : level.ordinal === 24
              ? 1000
              : 10000) *
            digit(0) +
          digit(1)
        : (level.ordinal === 30 ? 100000 : 10000) * digit(0) +
          100 * digit(1) +
          10 * digit(2) +
          digit(3);
    return {
      id: `${levelId}-${seed}-${slotIndex}`,
      target,
      allowed: DENOMINATIONS,
      canonicalRequired: false,
      minimumRequired: false,
      exactTypes,
      distinctRepresentations: 1,
      difficultyBand,
      primarySkill,
      mode: "exactTypes",
    };
  }
  if (challengeMode === "twoWays") {
    const target =
      level.ordinal === 27
        ? digit(0) * 1000 + digit(1) * 100
        : (level.ordinal === 30 ? 100000 : level.ordinal === 29 ? 10000 : 100) *
          digit(0);
    return {
      id: `${levelId}-${seed}-${slotIndex}`,
      target,
      allowed: level.ordinal === 27 ? [1000, 100, 10] : DENOMINATIONS,
      canonicalRequired: false,
      minimumRequired: false,
      exactTypes: null,
      distinctRepresentations: 2,
      difficultyBand,
      primarySkill,
      mode: "twoWays",
    };
  }
  const allowed: Denomination[] =
    level.ordinal === 23 || level.ordinal === 28
      ? [1000, 100, 1]
      : challengeMode === "restricted"
        ? level.ordinal === 30
          ? [100000, 1000, 10, 1]
          : [10000, 100, 1]
        : [...DENOMINATIONS];
  const target =
    level.ordinal === 23
      ? 1000 * digit(0) + 100 * digit(1) + digit(2)
      : level.ordinal === 28
        ? 1000 * digit(0) + 100 * digit(1) + 10 * digit(2) + digit(3)
        : challengeMode === "restricted"
          ? level.ordinal === 30
            ? 100000 * digit(0) + 1000 * digit(1) + 10 * digit(2) + digit(3)
            : 10000 * digit(0) + 100 * digit(1) + digit(2)
          : seededRange(
              seed,
              level.ordinal,
              slotIndex,
              level.ordinal === 30 ? 100000 : level.ordinal === 22 ? 100 : 1000,
              level.ordinal === 22 ? 99999 : 999999,
            );
  return {
    id: `${levelId}-${seed}-${slotIndex}`,
    target,
    allowed,
    canonicalRequired: false,
    minimumRequired: challengeMode === "minimum" || challengeMode === "repack",
    exactTypes: null,
    distinctRepresentations: 1,
    difficultyBand,
    primarySkill,
    mode: challengeMode,
    ...(challengeMode === "repack"
      ? { sourceRepresentation: canonicalRepresentation(target) }
      : {}),
  };
}

/** Generate only after the independent mathematical validator accepts a witness. */
export function generateLevelOrder(
  levelId: string,
  seed: number,
  slotIndex: number,
  difficultyBand: DifficultyBand = "easy",
  recentSignatures: readonly string[] = [],
): OrderSpec {
  assertSeedAndSlot(seed, slotIndex);
  if (!(difficultyBand in DIGIT_RANGES)) throw new Error("CONFIG_INVALID");
  if (
    !Array.isArray(recentSignatures) ||
    recentSignatures.some((s) => typeof s !== "string")
  )
    throw new Error("CONFIG_INVALID");
  const recent = new Set(recentSignatures.slice(-10));
  // Construction is deterministic. Retry with deterministic seed draws if a
  // future blueprint edit produces an invalid witness or a recent signature.
  for (let attempt = 0; attempt < 100; attempt++) {
    const candidateSeed =
      attempt === 0
        ? seed
        : xorshift32((seed ^ Math.imul(attempt, 0x9e3779b9)) >>> 0 || 1);
    const order = constructLevelOrder(
      levelId,
      candidateSeed,
      slotIndex,
      difficultyBand,
    );
    if (validGeneratedOrder(order) && !recent.has(orderSignature(order)))
      return order;
  }
  // Signature avoidance relaxes only after all 100 candidates are exhausted.
  const fallback = validatedFallbacks.get(
    `${levelId}:${slotIndex}:${difficultyBand}`,
  );
  if (fallback) return fallback;
  throw new Error("CONFIG_INVALID");
}

/** Stable student-history key for recent-order suppression. */
export function orderSignature(order: OrderSpec): string {
  return [
    order.target,
    [...order.allowed].sort((a, b) => b - a).join(","),
    order.mode ?? "",
    order.canonicalRequired ? "canonical" : "",
    order.minimumRequired ? "minimum" : "",
    order.exactTypes ?? "",
    order.distinctRepresentations,
    order.primarySkill ?? "",
  ].join("|");
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
  const first = witnessFor(order);
  for (let largerIndex = 0; largerIndex < DENOMINATIONS.length; largerIndex++) {
    const larger = DENOMINATIONS[largerIndex];
    if (first[largerIndex] < 1 || !order.allowed.includes(larger)) continue;
    for (
      let smallerIndex = largerIndex + 1;
      smallerIndex < DENOMINATIONS.length;
      smallerIndex++
    ) {
      const smaller = DENOMINATIONS[smallerIndex];
      if (!order.allowed.includes(smaller) || larger % smaller !== 0) continue;
      const exchanged = [...first] as number[];
      exchanged[largerIndex] -= 1;
      exchanged[smallerIndex] += larger / smaller;
      return exchanged as unknown as Representation;
    }
  }
  return null;
}

function validGeneratedOrder(order: OrderSpec): boolean {
  try {
    return validateRepresentation(
      order,
      witnessFor(order),
      alternateWitnessFor(order),
    ).shipmentAccepted;
  } catch {
    return false;
  }
}

// Validate the complete fallback inventory when the engine loads. A future
// blueprint edit cannot silently issue a fallback with an invalid objective.
const validatedFallbacks = new Map<string, OrderSpec>();
for (const level of LEVELS)
  for (let slot = 0; slot < 5; slot++)
    for (const band of ["easy", "medium", "hard"] as const) {
      const order = constructLevelOrder(level.id, 0x6d2b79f5, slot, band);
      if (!validGeneratedOrder(order))
        throw new Error(`CONFIG_INVALID: fallback ${level.id}/${slot}/${band}`);
      validatedFallbacks.set(`${level.id}:${slot}:${band}`, order);
    }
for (const [skillId, place] of [
  ["pv.ones", 1],
  ["pv.tens", 10],
  ["pv.hundreds", 100],
  ["pv.thousands", 1000],
  ["pv.tenThousands", 10000],
  ["pv.hundredThousands", 100000],
] as const)
  for (const band of ["easy", "medium", "hard"] as const)
    for (let slot = 0; slot < 5; slot++) {
      const [low, high] = DIGIT_RANGES[band];
      const baseline = generatePracticeOrder(skillId, 1, slot, band);
      const recent = Array.from({ length: high - low + 1 }, (_, index) =>
        orderSignature({ ...baseline, target: (low + index) * place }),
      );
      const fallback = generatePracticeOrder(
        skillId,
        1,
        slot,
        band,
        30,
        recent,
      );
      if (!validGeneratedOrder(fallback))
        throw new Error(
          `CONFIG_INVALID: practice fallback ${skillId}/${slot}/${band}`,
        );
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
  if (lowScoreStreak >= 2 && state.remainingEasyOrders === 0)
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

/** Reconstruct the bounded scaffold from committed resolved evidence for a skill. */
export function scaffoldForSkill(
  skillId: string,
  records: readonly EvidenceRecord[],
): ScaffoldState {
  return records
    .map((record, index) => ({ record, index }))
    .filter(
      ({ record }) => record.skillId === skillId && record.eligible !== false,
    )
    .sort(
      (a, b) =>
        Date.parse(a.record.committedAt) - Date.parse(b.record.committedAt) ||
        a.index - b.index,
    )
    .reduce(
      (state, { record }) =>
        updateScaffold(state, record.score, record.independentFirst),
      { lowScoreStreak: 0, remainingEasyOrders: 0, independentSuccesses: 0 },
    );
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
    const leftAt =
      left.lastEvidenceAt === null
        ? Number.NEGATIVE_INFINITY
        : Date.parse(left.lastEvidenceAt);
    const rightAt =
      right.lastEvidenceAt === null
        ? Number.NEGATIVE_INFINITY
        : Date.parse(right.lastEvidenceAt);
    if (leftAt !== rightAt) return leftAt - rightAt;
    return left.skillId.localeCompare(right.skillId);
  });
  return candidates[0].skillId;
}

/** Fixed V1 focus/focus/review/focus/stretch practice blueprint. */
export function schedulePracticeSkills(
  requiredSkillIds: readonly string[],
  evidence: readonly EvidenceRecord[],
  eligibleSkillIds: readonly string[],
  now: Date = new Date(),
): string[] {
  const eligible = [...new Set(eligibleSkillIds)];
  const required = requiredSkillIds.filter((skill) => eligible.includes(skill));
  const focus = nextPracticeSkill(
    required.length ? required : eligible,
    evidence,
    now,
  );
  if (!focus) throw new Error("CONFIG_INVALID");
  const summaries = eligible.map((skillId) =>
    summarizeMastery(skillId, evidence, now),
  );
  const secure = summaries.filter((summary) => summary.status === "secure");
  secure.sort((a, b) => {
    const aStale = a.needsRefresh ? 0 : 1;
    const bStale = b.needsRefresh ? 0 : 1;
    if (aStale !== bStale) return aStale - bStale;
    const aAt =
      a.lastEvidenceAt === null
        ? Number.NEGATIVE_INFINITY
        : Date.parse(a.lastEvidenceAt);
    const bAt =
      b.lastEvidenceAt === null
        ? Number.NEGATIVE_INFINITY
        : Date.parse(b.lastEvidenceAt);
    return aAt - bAt || a.skillId.localeCompare(b.skillId);
  });
  const review =
    secure[0]?.skillId ??
    eligible
      .filter((skill) => skill !== focus)
      .map((skillId) => summarizeMastery(skillId, evidence, now))
      .sort(
        (a, b) => a.sampleN - b.sampleN || a.skillId.localeCompare(b.skillId),
      )[0]?.skillId ??
    focus;
  const stretch =
    eligible.find((skill) => skill !== focus && skill !== review) ?? focus;
  return [focus, focus, review, focus, stretch];
}
