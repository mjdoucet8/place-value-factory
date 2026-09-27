export const DENOMINATIONS = [100000, 10000, 1000, 100, 10, 1] as const;
export type Denomination = (typeof DENOMINATIONS)[number];
export type Representation = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
];
export type FeedbackCode =
  | "SHIPMENT_CORRECT"
  | "UNDERPRODUCTION"
  | "OVERPRODUCTION"
  | "MACHINE_UNAVAILABLE"
  | "STANDARD_REQUIRED"
  | "TYPE_COUNT"
  | "SAME_REPRESENTATION"
  | "CAN_REPACK"
  | "INVALID_INPUT";
export type DifficultyBand = "easy" | "medium" | "hard";

export interface OrderSpec {
  id: string;
  /** Additive issuance metadata; absent on historical v1-local orders. */
  attemptId?: string;
  slotIndex?: number;
  replacementIndex?: number;
  role?: "main" | "transfer";
  seed?: number;
  configVersion?: string;
  engineVersion?: string;
  forbidden?: readonly Denomination[];
  skillIds?: readonly string[];
  target: number;
  allowed: readonly Denomination[];
  canonicalRequired: boolean;
  minimumRequired: boolean;
  exactTypes: 2 | 3 | null;
  distinctRepresentations: 1 | 2;
  difficultyBand?: DifficultyBand;
  primarySkill?: string;
  mode?: string;
  /** A read-only starting decomposition shown only for a repack task. */
  sourceRepresentation?: Representation | null;
}

export interface Validation {
  schemaValid: boolean;
  valueMatches: boolean;
  restrictionsMet: boolean;
  objectiveMet: boolean;
  shipmentAccepted: boolean;
  representedTotals: number[];
  crateCounts: number[];
  minimumCrates: number | null;
  feedbackCode: FeedbackCode;
}

/** Additive teacher reporting v2. Evidence retains the v1 immutable response shape. */
export interface ReportQueryV2 {
  limit: number;
  cursor: string | null;
  viewRevision: string | null;
  includeTransfer: boolean;
}
export function parseReportQueryV2(
  params: URLSearchParams,
  detail: boolean,
): ReportQueryV2 {
  const allowed = new Set([
    "from",
    "to",
    "includeTransfer",
    "limit",
    "cursor",
    "viewRevision",
  ]);
  for (const key of params.keys())
    if (!allowed.has(key) || params.getAll(key).length !== 1)
      throw new Error("INVALID_INPUT");
  const limit = Number(params.get("limit") ?? (detail ? 25 : 100));
  if (!Number.isInteger(limit) || limit < 1 || limit > 100)
    throw new Error("INVALID_INPUT");
  const transfer = params.get("includeTransfer");
  if (transfer !== null && transfer !== "true" && transfer !== "false")
    throw new Error("INVALID_INPUT");
  const cursor = params.get("cursor"),
    viewRevision = params.get("viewRevision");
  if (
    (cursor !== null && (!cursor || cursor.length > 2048)) ||
    (viewRevision !== null && !/^[a-f0-9]{64}$/.test(viewRevision))
  )
    throw new Error("INVALID_INPUT");
  return { limit, cursor, viewRevision, includeTransfer: transfer === "true" };
}
export interface ReportPageV2<T> {
  studentId: string;
  includeTransfer: boolean;
  version: 2;
  timezone: string;
  from: string;
  to: string;
  asOf: string;
  viewRevision: string;
  totalN: number;
  evidence: T[];
  nextCursor: string | null;
}

export interface ReportEvidence {
  orderId: string;
  target: number;
  vector: unknown;
  accepted: boolean;
  status: "shipped" | "skipped" | "pending";
  role: "main" | "transfer";
  firstResponse: StoredReportResponse;
  finalResponse?: StoredReportResponse;
  supports: { orderId: string; step: "H1" | "H2" | "H3"; at: string }[];
}
export interface StoredReportResponse {
  order: OrderSpec;
  representationA: unknown;
  representationB: unknown;
  validation: Validation;
  at: string;
  commandId?: string;
  activeMs?: number;
}
export interface ClassReportSummaryV2<T> {
  version: 2;
  classId: string;
  timezone: string;
  from: string;
  to: string;
  asOf: string;
  includeTransfer: boolean;
  viewRevision: string;
  students: (T & { viewRevision: string })[];
  nextCursor: string | null;
}
