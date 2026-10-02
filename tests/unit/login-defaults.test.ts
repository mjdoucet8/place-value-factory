import { expect, it } from "vitest";
import { defaultStudentLogin } from "../../apps/web/src/loginDefaults.js";

it("starts student login with no class, account or PIN filled in", () => {
  expect(defaultStudentLogin()).toEqual({ classCode: "", username: "", pin: "" });
});
