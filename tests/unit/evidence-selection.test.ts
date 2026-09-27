import { describe, expect, it } from "vitest";
import { eligibleEvidence, type EvidenceRecord } from "../../packages/game-engine/src/index.js";

// Frozen pre-optimization behavior: an independent reference for selection,
// including stable ties and deduplication relative to the last accepted record.
function originalSelection(records: readonly EvidenceRecord[]) {
  const latestFirst = [...records].filter((r) => r.eligible !== false)
    .sort((a, b) => Date.parse(b.committedAt) - Date.parse(a.committedAt));
  const seen = new Map<string, number>();
  return latestFirst.filter((r) => {
    const timestamp = Date.parse(r.committedAt);
    const prior = seen.get(r.signature);
    if (prior !== undefined && prior - timestamp < 86_400_000) return false;
    seen.set(r.signature, timestamp);
    return true;
  }).slice(0, 12);
}
const row = (id: number, hours: number, signature = String(id), eligible?: boolean): EvidenceRecord => ({
  skillId: "pv.ones", score: id % 2, independentFirst: true,
  attemptId: String(id), signature, eligible,
  committedAt: new Date(Date.UTC(2026, 0, 20) + hours * 3_600_000).toISOString(),
});

describe("evidence selection parity", () => {
  it("preserves exact-day boundaries, accepted-record deduplication and stable ties", () => {
    const records = [row(1, 48, "same"), row(2, 25, "same"), row(3, 24, "same"),
      row(4, 0, "same"), row(5, 48, "other"), row(6, 48, "other"), row(7, 49, "same", false)];
    expect(eligibleEvidence(records).map((r) => r.attemptId)).toEqual(["1", "5", "3", "4"]);
    expect(eligibleEvidence(records)).toEqual(originalSelection(records));
  });
  it("matches historical selection for shuffled, duplicate-rich evidence without modifying inputs", () => {
    let seed = 38291;
    const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
    for (let sample = 0; sample < 160; sample++) {
      const records = Array.from({ length: random() % 700 }, (_, i) =>
        Object.freeze(row(i, random() % 150, `signature-${random() % 23}`, random() % 5 ? undefined : false)));
      Object.freeze(records);
      const result = eligibleEvidence(records);
      expect(result).toEqual(originalSelection(records));
      expect(result.length).toBeLessThanOrEqual(12);
      for (const selected of result) expect(records).toContain(selected);
    }
  });
});
