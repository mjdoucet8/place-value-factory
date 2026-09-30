import { describe, expect, it } from "vitest";
import {
  FICTIONAL_MVP_CLASS_CODE,
  defaultClassCode,
} from "../../apps/web/src/loginDefaults.js";

describe("student login defaults", () => {
  it("prefills the live fictional MVP class while retaining the local fixture class", () => {
    expect(defaultClassCode(false)).toBe(FICTIONAL_MVP_CLASS_CODE);
    expect(defaultClassCode(false)).toBe("b0183617e9");
    expect(defaultClassCode(true)).toBe("FACTORY5");
  });
});
