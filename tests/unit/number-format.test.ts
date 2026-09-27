import { describe, expect, it } from "vitest";
import { formatNumber } from "../../apps/web/src/formatNumber.js";

describe("website number formatting", () => {
  it("uses spaces between thousands groups without changing smaller numbers", () => {
    expect(formatNumber(999)).toBe("999");
    expect(formatNumber(1_000)).toBe("1 000");
    expect(formatNumber(420_000)).toBe("420 000");
    expect(formatNumber(1_234_567)).toBe("1 234 567");
  });
});
