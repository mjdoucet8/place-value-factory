import { describe, expect, it } from "vitest";
import { defaultStudentLogin } from "../../apps/web/src/loginDefaults.js";

describe("student login defaults", () => {
  it("prefills a matching live demo login while retaining local fixtures", () => {
    expect(defaultStudentLogin(false)).toEqual({
      classCode: "doucet",
      username: "demo.student",
      pin: "123456",
    });
    expect(defaultStudentLogin(true)).toEqual({
      classCode: "FACTORY5",
      username: "ava",
      pin: "123456",
    });
  });
});
