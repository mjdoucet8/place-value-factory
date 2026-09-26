import { describe, it, expect } from "vitest";
import {
  buildStudentReport,
  classifyResponse,
  reportWindow,
} from "../../apps/server/src/reporting.js";
import type { Attempt } from "../../apps/server/src/index.js";
import type { OrderSpec } from "../../packages/contracts/src/index.js";
const now = new Date("2026-09-26T12:00:00Z");
const order = (id: string): OrderSpec => ({
  id,
  target: 100,
  allowed: [100, 10, 1],
  canonicalRequired: false,
  minimumRequired: true,
  exactTypes: null,
  distinctRepresentations: 1,
  primarySkill: "reason.minimum",
});
const record = (
  id: string,
  correct: boolean,
  value = true,
  at = "2026-09-26T10:00:00Z",
) => ({
  order: order(id),
  representationA: correct ? [0, 0, 0, 1, 0, 0] : [0, 0, 0, 0, 10, 0],
  representationB: null,
  at,
  validation: {
    schemaValid: true,
    valueMatches: value,
    restrictionsMet: true,
    objectiveMet: correct,
    shipmentAccepted: correct,
    representedTotals: [100],
    crateCounts: [correct ? 1 : 10],
    minimumCrates: null,
    feedbackCode: correct ? "SHIPMENT_CORRECT" : "CAN_REPACK",
  },
});
const attempt = {
  id: "a",
  studentId: "student",
  levelId: "level-22",
  completed: true,
  kind: "path",
  responses: [
    record("corrected", false),
    record("corrected", true, true, "2026-09-26T10:01:00Z"),
    record("pending", false),
    record("optional-transfer", true),
    record("skipped", false),
  ],
  supportEvents: [
    { orderId: "corrected", step: "H1", at: now.toISOString() },
    { orderId: "corrected", step: "H2", at: now.toISOString() },
    { orderId: "optional-transfer", step: "H3", at: now.toISOString() },
  ],
  evidence: [
    {
      orderId: "corrected",
      skillId: "reason.minimum",
      score: 0.6,
      independentFirst: false,
      attemptId: "a",
      signature: "a",
      committedAt: now.toISOString(),
    },
    {
      orderId: "skipped",
      skillId: "reason.minimum",
      score: 0,
      independentFirst: false,
      attemptId: "a",
      signature: "b",
      committedAt: now.toISOString(),
    },
  ],
} as Attempt;
const input = {
  student: { id: "student", alias: "Fictional" },
  attempts: [attempt],
  from: new Date("2026-09-26T00:00:00Z"),
  to: new Date("2026-09-27T00:00:00Z"),
  now,
  includeTransfer: false,
  currentLevelId: "level-22",
  achievedTier: "Supervisor",
  certifications: ["stage-1"],
  primaryPracticeSkillId: "reason.minimum",
};
describe("exact report reconstruction", () => {
  it("counts orders, retains first objective/value flags, and separates pending, skip and transfer", () => {
    const report = buildStudentReport(input);
    expect(report).toMatchObject({
      submittedN: 3,
      firstObjectiveCorrectN: 0,
      firstValueCorrectN: 3,
      eventuallyCorrectN: 1,
      firstWrongN: 3,
      correctionSuccessN: 1,
      pendingN: 1,
      supportCounts: { H1: 1, H2: 1, H3: 0 },
      currentLevelId: "level-22",
    });
    expect(report.evidence.map((e) => e.status)).toEqual([
      "shipped",
      "pending",
      "skipped",
    ]);
    expect(report.evidence[0].vector).toEqual([0, 0, 0, 0, 10, 0]);
    expect(report.evidence[0].finalResponse?.representationA).toEqual([
      0, 0, 0, 1, 0, 0,
    ]);
    expect(
      buildStudentReport({ ...input, includeTransfer: true }),
    ).toMatchObject({
      submittedN: 4,
      firstObjectiveCorrectN: 1,
      eventuallyCorrectN: 2,
      supportCounts: { H3: 1 },
    });
  });
  it("assigns the entire correction history by the first response date and exposes no-evidence nulls", () => {
    const report = buildStudentReport({
      ...input,
      from: new Date("2026-09-26T10:00:30Z"),
    });
    expect(report).toMatchObject({
      submittedN: 0,
      firstObjectiveAccuracy: null,
      firstValueAccuracy: null,
      eventualAccuracy: null,
      correctionAccuracy: null,
      evidenceLabel: "No evidence",
    });
    expect(report.skills).toHaveLength(19);
    expect(report.skills.find((s) => s.skillId === "pv.ones")).toMatchObject({
      score: null,
      status: "unknown",
      sampleN: 0,
    });
  });
  it("calculates class-local exclusive date windows across daylight saving boundaries", () => {
    const window = reportWindow(
      new URLSearchParams("from=2026-03-08&to=2026-03-09"),
      "America/Moncton",
      now,
    );
    expect(window.from.toISOString()).toBe("2026-03-08T04:00:00.000Z");
    expect(window.to.toISOString()).toBe("2026-03-09T03:00:00.000Z");
    expect(() =>
      reportWindow(new URLSearchParams("from=2026-02-30"), "UTC", now),
    ).toThrow("INVALID_INPUT");
    expect(() =>
      reportWindow(
        new URLSearchParams("from=2026-10-01&to=2026-09-01"),
        "UTC",
        now,
      ),
    ).toThrow("INVALID_INPUT");
  });
  it("identifies only deterministic candidate patterns", () => {
    expect(
      classifyResponse(
        { ...order("z"), target: 506020, canonicalRequired: true },
        [0, 0, 0, 5, 6, 2],
      ),
    ).toContain("ZERO_PLACEHOLDER");
    expect(
      classifyResponse(
        { ...order("p"), target: 40, canonicalRequired: true },
        [0, 0, 0, 4, 0, 0],
      ),
    ).toContain("PLACE_SHIFT");
    expect(
      classifyResponse(
        { ...order("r"), target: 420000, allowed: [10000] },
        [0, 420, 0, 0, 0, 0],
      ),
    ).toContain("FACTOR_TEN");
    expect(
      classifyResponse({ ...order("f"), allowed: [10, 1] }, [0, 0, 0, 1, 0, 0]),
    ).toContain("RENAMING_GAP");
    expect(classifyResponse(order("malformed"), [NaN])).toEqual([]);
  });
});
