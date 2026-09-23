import { describe, it, expect } from "vitest";
import { STAGE_GATE_SKILLS } from "../../packages/config/src/index.js";
import { studentSkillLabel } from "../../apps/web/src/studentCopy.js";
describe("student-facing skill labels", () => {
  it("names all nineteen configured skills without internal identifiers or generic fallback", () => {
    const skills = Object.values(STAGE_GATE_SKILLS).flat();
    expect(skills).toHaveLength(19);
    const labels = skills.map(studentSkillLabel);
    expect(new Set(labels).size).toBe(19);
    for (const label of labels) {
      expect(label).not.toContain(".");
      expect(label).not.toContain("_");
      expect(label).not.toBe("Place-value practice");
    }
  });
});
