import type { Page } from "@playwright/test";

export async function fillStudentLogin(page: Page) {
  for (const [label, value] of [
    ["Class code", "FACTORY5"],
    ["Username", "ava"],
    ["Six-digit PIN", "123456"],
  ]) {
    const field = page.getByLabel(label, { exact: true });
    if (!(await field.inputValue())) await field.fill(value);
  }
}
export async function loginStudent(page: Page) {
  await fillStudentLogin(page);
  await page.getByRole("button", { name: "Student login" }).click();
}
