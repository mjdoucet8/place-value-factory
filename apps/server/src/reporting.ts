import {
  DENOMINATIONS,
  type OrderSpec,
  type Representation,
} from "../../../packages/contracts/src/index.js";
import { STAGE_GATE_SKILLS } from "../../../packages/config/src/index.js";
import {
  canonicalRepresentation,
  isRepresentation,
  representedTotal,
  summarizeMastery,
  eligibleEvidence,
} from "../../../packages/game-engine/src/index.js";
import type { Attempt } from "./index.js";

type Response = Attempt["responses"][number];
export const isTransferOrder = (order: OrderSpec) =>
  order.role === "transfer" || order.id.endsWith("-transfer");

/** Candidate flags describe exact observable vectors, never a diagnosis. */
export function classifyResponse(order: OrderSpec, vector: unknown): string[] {
  if (!isRepresentation(vector)) return [];
  const flags: string[] = [];
  const total = representedTotal(vector);
  const canonical = canonicalRepresentation(order.target);
  if (order.canonicalRequired && total !== order.target) {
    const nonzero = vector.flatMap((q, i) => (q > 0 ? [i] : []));
    for (const i of nonzero) {
      for (const next of [i - 1, i + 1]) {
        if (next < 0 || next > 5) continue;
        const shifted = [...vector];
        shifted[next] += shifted[i];
        shifted[i] = 0;
        if (shifted.every((q, j) => q === canonical[j]))
          flags.push("PLACE_SHIFT");
      }
    }
    if (
      String(order.target).includes("0") &&
      Number(String(order.target).replaceAll("0", "")) === total
    )
      flags.push("ZERO_PLACEHOLDER");
  }
  if (order.allowed.length === 1) {
    const index = DENOMINATIONS.indexOf(order.allowed[0]);
    const correct = order.target / order.allowed[0];
    if (
      correct > 0 &&
      (vector[index] === correct * 10 ||
        (Number.isInteger(correct / 10) && vector[index] === correct / 10))
    )
      flags.push("FACTOR_TEN");
  }
  if (
    total === order.target &&
    vector.some(
      (q, i) =>
        q > 0 && canonical[i] > 0 && !order.allowed.includes(DENOMINATIONS[i]),
    )
  )
    flags.push("RENAMING_GAP");
  return [...new Set(flags)];
}

function localMidnight(date: string, timezone: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("INVALID_INPUT");
  const utc = Date.parse(`${date}T00:00:00.000Z`);
  if (
    !Number.isFinite(utc) ||
    new Date(utc).toISOString().slice(0, 10) !== date
  )
    throw new Error("INVALID_INPUT");
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  let instant = utc;
  for (let n = 0; n < 4; n++) {
    const p = Object.fromEntries(
      formatter
        .formatToParts(new Date(instant))
        .map((part) => [part.type, part.value]),
    );
    const represented = Date.UTC(
      Number(p.year),
      Number(p.month) - 1,
      Number(p.day),
      Number(p.hour),
      Number(p.minute),
      Number(p.second),
    );
    const correction = utc - represented;
    instant += correction;
    if (!correction) break;
  }
  return new Date(instant);
}
function localDate(now: Date, timezone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function plusDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
/** Date-only filters are class-local boundaries, with an exclusive end. */
export function reportWindow(
  params: URLSearchParams,
  timezone: string,
  now: Date,
) {
  try {
    const today = localDate(now, timezone);
    const parse = (value: string) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? localMidnight(value, timezone)
        : new Date(value);
    const from = parse(params.get("from") ?? plusDays(today, -6));
    const to = parse(params.get("to") ?? plusDays(today, 1));
    if (
      !Number.isFinite(from.getTime()) ||
      !Number.isFinite(to.getTime()) ||
      from >= to
    )
      throw new Error("INVALID_INPUT");
    return { from, to };
  } catch {
    throw new Error("INVALID_INPUT");
  }
}

export type ReportOrderFact = {
  orderId: string;
  attemptId: string;
  firstAt: string;
  lastAt: string;
  primarySkill: string;
  transfer: boolean;
  canonicalRequired: boolean;
  allowedN: number;
  firstObjective: boolean;
  firstValue: boolean;
  accepted: boolean;
  hasEvidence: boolean;
  independentFirst: boolean;
  flags: string[];
  supports: string[];
};
export type ReportAggregate = {
  submittedN: number; firstObjectiveCorrectN: number; firstValueCorrectN: number;
  eventuallyCorrectN: number; correctionSuccessN: number; pendingN: number;
  targeted: Record<string, number>; flags: Record<string, number>;
  representatives: Record<string, {independent: string[]; wrong: string[]}>;
  supportCounts: Record<string, number>; lastActivityAt: string | null;
  windowEvidence: Attempt["evidence"];
};
export type ReportFacts = { orders: ReportOrderFact[]; aggregate?: ReportAggregate };
type ReportInput = {
  student: { id: string; alias: string };
  attempts: Attempt[];
  from: Date;
  to: Date;
  now: Date;
  includeTransfer: boolean;
  currentLevelId: string;
  achievedTier: string;
  certifications: string[];
  primaryPracticeSkillId: string | null;
  summaryOnly?: boolean;
  facts?: ReportFacts;
};

/** Both v1 and v2 use this reducer; SQL facts change transport, not educational rules. */
function summarizeFacts(input: ReportInput, facts: ReportFacts) {
  const aggregate = facts.aggregate;
  const allEvidence = input.attempts
    .flatMap((a) => a.evidence)
    .sort(
      (a, b) =>
        a.committedAt.localeCompare(b.committedAt) ||
        (a.orderId ?? "").localeCompare(b.orderId ?? ""),
    );
  const groups = facts.orders
    .filter(
      (g) =>
        (input.includeTransfer || !g.transfer) &&
        Date.parse(g.firstAt) >= input.from.getTime() &&
        Date.parse(g.firstAt) < input.to.getTime(),
    )
    .sort(
      (a, b) =>
        a.firstAt.localeCompare(b.firstAt) ||
        a.orderId.localeCompare(b.orderId),
    );
  const ids = new Set(groups.map((g) => g.orderId));
  const evidence = aggregate?.windowEvidence ?? allEvidence.filter((e) => !e.orderId || ids.has(e.orderId));
  const skills = [...new Set(Object.values(STAGE_GATE_SKILLS).flat())]
    .sort()
    .map((id) => summarizeMastery(id, allEvidence, input.now));
  const trends = skills.map(({ skillId }) => {
    const recent = eligibleEvidence(
      evidence.filter((e) => e.skillId === skillId),
    );
    if (recent.length < 10)
      return { skillId, trend: null, sampleN: recent.length };
    const mean = (offset: number) =>
      recent.slice(offset, offset + 5).reduce((n, e) => n + e.score, 0) / 5;
    const last5 = mean(0),
      previous5 = mean(5),
      difference = last5 - previous5;
    return {
      skillId,
      trend:
        difference >= 0.15
          ? "improving"
          : difference <= -0.15
            ? "practice suggested"
            : "steady",
      sampleN: recent.length,
      last5,
      previous5,
    };
  });
  const codes = [
    "PLACE_SHIFT",
    "ZERO_PLACEHOLDER",
    "FACTOR_TEN",
    "RENAMING_GAP",
  ];
  const misconceptionCounts = codes.map((code) => {
    const orderN = aggregate?.flags[code] ?? groups.filter((g) => g.flags.includes(code)).length;
    const targetedN = aggregate?.targeted[code] ?? groups.filter((g) =>
      code === "FACTOR_TEN"
        ? g.allowedN === 1
        : code === "RENAMING_GAP"
          ? g.allowedN < 6
          : g.canonicalRequired,
    ).length;
    return {
      code,
      orderN,
      targetedN,
      candidate: true,
      ruleVersion: "v1",
      showPattern: orderN >= 3,
    };
  });
  const representativeOrderIds = skills.flatMap(({ skillId }) => {
    if (aggregate) { const selected = aggregate.representatives[skillId]; return selected ? [...selected.independent, ...selected.wrong] : []; }
    const selected = groups.filter((g) => g.primarySkill === skillId).reverse();
    return [
      ...selected.filter((g) => g.independentFirst).slice(0, 2),
      ...selected.filter((g) => !g.firstObjective).slice(0, 2),
    ].map((g) => g.orderId);
  });
  const submittedN = aggregate?.submittedN ?? groups.length,
    firstObjectiveCorrectN = aggregate?.firstObjectiveCorrectN ?? groups.filter((g) => g.firstObjective).length,
    firstValueCorrectN = aggregate?.firstValueCorrectN ?? groups.filter((g) => g.firstValue).length,
    eventuallyCorrectN = aggregate?.eventuallyCorrectN ?? groups.filter((g) => g.accepted).length,
    firstWrongN = submittedN - firstObjectiveCorrectN,
    correctionSuccessN = aggregate?.correctionSuccessN ?? groups.filter(
      (g) => !g.firstObjective && g.accepted,
    ).length;
  return {
    studentId: input.student.id,
    alias: input.student.alias,
    currentLevelId: input.currentLevelId,
    achievedTier: input.achievedTier,
    certifications: input.certifications,
    submittedN,
    firstObjectiveCorrectN,
    firstValueCorrectN,
    eventuallyCorrectN,
    firstWrongN,
    correctionSuccessN,
    firstObjectiveAccuracy: submittedN
      ? firstObjectiveCorrectN / submittedN
      : null,
    firstValueAccuracy: submittedN ? firstValueCorrectN / submittedN : null,
    eventualAccuracy: submittedN ? eventuallyCorrectN / submittedN : null,
    correctionAccuracy: firstWrongN ? correctionSuccessN / firstWrongN : null,
    evidenceLabel: submittedN ? "Evidence available" : "No evidence",
    pendingN: aggregate?.pendingN ?? groups.filter((g) => !g.accepted && !g.hasEvidence).length,
    primaryPracticeSkillId: input.primaryPracticeSkillId,
    lastActivityAt: aggregate ? aggregate.lastActivityAt : facts.orders.reduce<string | null>(
      (last, g) =>
        !last || Date.parse(g.lastAt) > Date.parse(last) ? g.lastAt : last,
      null,
    ),
    skills,
    completedLevelIds: [
      ...new Set(
        input.attempts
          .filter((a) => a.completed && a.kind !== "practice")
          .map((a) => a.levelId),
      ),
    ],
    supportCounts: aggregate?.supportCounts ?? Object.fromEntries(
      ["H1", "H2", "H3"].map((step) => [
        step,
        groups.filter((g) => g.supports.includes(step)).length,
      ]),
    ),
    misconceptionCounts,
    trends,
    representativeOrderIds: [...new Set(representativeOrderIds)],
  };
}

export function buildStudentReport(input: ReportInput) {
  if (input.summaryOnly && input.facts)
    return {
      ...summarizeFacts(input, input.facts),
      evidence: [] as ReturnType<typeof reportEvidence>,
    };
  const responses = input.attempts
    .flatMap((a) => a.responses)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const groups = new Map<string, Response[]>();
  for (const response of responses) {
    const group = groups.get(response.order.id) ?? [];
    group.push(response);
    groups.set(response.order.id, group);
  }
  const allEvidence = input.attempts.flatMap((a) => a.evidence);
  const evidenceIds = new Set(allEvidence.map((e) => e.orderId));
  const independentIds = new Set(
    allEvidence.filter((e) => e.independentFirst).map((e) => e.orderId),
  );
  const supports = new Map<string, Attempt["supportEvents"]>();
  for (const event of input.attempts.flatMap((a) => a.supportEvents)) {
    const events = supports.get(event.orderId) ?? [];
    events.push(event);
    supports.set(event.orderId, events);
  }
  const facts: ReportFacts = {
    orders: [...groups.values()].map((g) => ({
      orderId: g[0].order.id,
      attemptId: g[0].order.attemptId ?? "",
      firstAt: g[0].at,
      lastAt: g.at(-1)!.at,
      primarySkill: g[0].order.primarySkill ?? "",
      transfer: isTransferOrder(g[0].order),
      canonicalRequired: g[0].order.canonicalRequired,
      allowedN: g[0].order.allowed.length,
      firstObjective: g[0].validation.objectiveMet,
      firstValue: g[0].validation.valueMatches,
      accepted: g.some((r) => r.validation.shipmentAccepted),
      hasEvidence: evidenceIds.has(g[0].order.id),
      independentFirst: independentIds.has(g[0].order.id),
      flags: [
        ...new Set(
          g.flatMap((r) => [
            ...classifyResponse(r.order, r.representationA),
            ...classifyResponse(r.order, r.representationB),
          ]),
        ),
      ],
      supports: (supports.get(g[0].order.id) ?? []).map((s) => s.step),
    })),
  };
  const selected = [...groups.values()].filter(
    (g) =>
      (input.includeTransfer || !isTransferOrder(g[0].order)) &&
      Date.parse(g[0].at) >= input.from.getTime() &&
      Date.parse(g[0].at) < input.to.getTime(),
  );
  return {
    ...summarizeFacts(input, facts),
    evidence: input.summaryOnly
      ? []
      : reportEvidence(selected, evidenceIds, supports),
  };
}
function reportEvidence(
  groups: Response[][],
  evidenceIds: Set<string | undefined>,
  supports: Map<string, Attempt["supportEvents"]>,
) {
  return groups.map((g) => ({
    orderId: g[0].order.id,
    target: g[0].order.target,
    vector: g[0].representationA,
    accepted: g.some((r) => r.validation.shipmentAccepted),
    status: g.some((r) => r.validation.shipmentAccepted)
      ? "shipped"
      : evidenceIds.has(g[0].order.id)
        ? "skipped"
        : "pending",
    role: isTransferOrder(g[0].order) ? "transfer" : "main",
    firstResponse: g[0],
    finalResponse: g.at(-1),
    supports: supports.get(g[0].order.id) ?? [],
  }));
}
