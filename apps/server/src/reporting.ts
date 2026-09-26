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

export function buildStudentReport(input: {
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
}) {
  const { student, attempts, from, to, now, includeTransfer } = input;
  const responses = attempts
    .flatMap((a) => a.responses)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const grouped = new Map<string, Response[]>();
  for (const record of responses) {
    if (!includeTransfer && isTransferOrder(record.order)) continue;
    const group = grouped.get(record.order.id) ?? [];
    group.push(record);
    grouped.set(record.order.id, group);
  }
  const groups = [...grouped.values()].filter(
    (group) =>
      Date.parse(group[0].at) >= from.getTime() &&
      Date.parse(group[0].at) < to.getTime(),
  );
  const accepted = (group: Response[]) =>
    group.some((r) => r.validation.shipmentAccepted);
  const firstWrong = groups.filter((g) => !g[0].validation.objectiveMet);
  const ids = new Set(groups.map((g) => g[0].order.id));
  const allEvidence = attempts.flatMap((a) => a.evidence);
  const evidence = allEvidence.filter((e) => !e.orderId || ids.has(e.orderId));
  const supportCounts = Object.fromEntries(
    ["H1", "H2", "H3"].map((step) => [
      step,
      new Set(
        attempts
          .flatMap((a) => a.supportEvents)
          .filter((s) => s.step === step && ids.has(s.orderId))
          .map((s) => s.orderId),
      ).size,
    ]),
  );
  const misconceptionCounts = [
    "PLACE_SHIFT",
    "ZERO_PLACEHOLDER",
    "FACTOR_TEN",
    "RENAMING_GAP",
  ].map((code) => {
    const exhibiting = groups.filter((g) =>
      g.some((r) =>
        [r.representationA, r.representationB].some((v) =>
          classifyResponse(r.order, v).includes(code),
        ),
      ),
    );
    const targeted = groups.filter((g) =>
      code === "FACTOR_TEN"
        ? g[0].order.allowed.length === 1
        : code === "RENAMING_GAP"
          ? g[0].order.allowed.length < 6
          : g[0].order.canonicalRequired,
    );
    return {
      code,
      orderN: exhibiting.length,
      targetedN: targeted.length,
      candidate: true,
      ruleVersion: "v1",
      showPattern: exhibiting.length >= 3,
    };
  });
  const skills = [...new Set(Object.values(STAGE_GATE_SKILLS).flat())]
    .sort()
    .map((skillId) => summarizeMastery(skillId, allEvidence, now));
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
  const representativeOrderIds = skills.flatMap(({ skillId }) => {
    const selected = groups
      .filter((g) => g[0].order.primarySkill === skillId)
      .reverse();
    const independent = new Set(
      allEvidence.filter((e) => e.independentFirst).map((e) => e.orderId),
    );
    return [
      ...selected.filter((g) => independent.has(g[0].order.id)).slice(0, 2),
      ...selected.filter((g) => !g[0].validation.objectiveMet).slice(0, 2),
    ].map((g) => g[0].order.id);
  });
  const submittedN = groups.length;
  const firstObjectiveCorrectN = groups.filter(
    (g) => g[0].validation.objectiveMet,
  ).length;
  const firstValueCorrectN = groups.filter(
    (g) => g[0].validation.valueMatches,
  ).length;
  const eventuallyCorrectN = groups.filter(accepted).length;
  const correctionSuccessN = firstWrong.filter(accepted).length;
  return {
    studentId: student.id,
    alias: student.alias,
    currentLevelId: input.currentLevelId,
    achievedTier: input.achievedTier,
    certifications: input.certifications,
    submittedN,
    firstObjectiveCorrectN,
    firstValueCorrectN,
    eventuallyCorrectN,
    firstWrongN: firstWrong.length,
    correctionSuccessN,
    firstObjectiveAccuracy: submittedN
      ? firstObjectiveCorrectN / submittedN
      : null,
    firstValueAccuracy: submittedN ? firstValueCorrectN / submittedN : null,
    eventualAccuracy: submittedN ? eventuallyCorrectN / submittedN : null,
    correctionAccuracy: firstWrong.length
      ? correctionSuccessN / firstWrong.length
      : null,
    evidenceLabel: submittedN ? "Evidence available" : "No evidence",
    pendingN: groups.filter(
      (g) =>
        !accepted(g) && !allEvidence.some((e) => e.orderId === g[0].order.id),
    ).length,
    primaryPracticeSkillId: input.primaryPracticeSkillId,
    lastActivityAt: responses.at(-1)?.at ?? null,
    skills,
    completedLevelIds: [
      ...new Set(
        attempts
          .filter((a) => a.completed && a.kind !== "practice")
          .map((a) => a.levelId),
      ),
    ],
    supportCounts,
    misconceptionCounts,
    trends,
    representativeOrderIds: [...new Set(representativeOrderIds)],
    evidence: groups.map((g) => ({
      orderId: g[0].order.id,
      target: g[0].order.target,
      vector: g[0].representationA,
      accepted: accepted(g),
      status: accepted(g)
        ? "shipped"
        : allEvidence.some((e) => e.orderId === g[0].order.id)
          ? "skipped"
          : "pending",
      role: isTransferOrder(g[0].order) ? "transfer" : "main",
      firstResponse: g[0],
      finalResponse: g.at(-1),
      supports: attempts
        .flatMap((a) => a.supportEvents)
        .filter((s) => s.orderId === g[0].order.id),
    })),
  };
}
