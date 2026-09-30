import { FICTIONAL_MVP_ACCESS } from "../../../packages/config/src/index.js";

export function defaultStudentLogin(development: boolean) {
  return development
    ? { classCode: "FACTORY5", username: "ava", pin: "123456" }
    : FICTIONAL_MVP_ACCESS;
}
