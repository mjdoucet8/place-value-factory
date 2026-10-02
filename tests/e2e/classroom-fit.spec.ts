import { expect, test } from "@playwright/test";
import { loginStudent } from "./student-login.js";

test("student login is blank initially and after logout", async ({ page }) => {
  await page.goto("/");
  for (const label of ["Class code", "Username", "Six-digit PIN"])
    await expect(page.getByLabel(label, { exact: true })).toHaveValue("");
  await loginStudent(page);
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  for (const label of ["Class code", "Username", "Six-digit PIN"])
    await expect(page.getByLabel(label, { exact: true })).toHaveValue("");
});

test("gameplay, target and Ship button fit short screens without vertical scrolling", async ({
  page,
}) => {
  test.setTimeout(60_000);
  for (const [width, height] of [
    [1366, 600],
    [1280, 600],
    [1024, 600],
    [1024, 768],
    [768, 1024],
    [844, 390],
    [390, 844],
    [320, 568],
  ]) {
    await page.setViewportSize({ width, height });
    for (const fixture of [
      "packing-guide-first",
      "calm",
      "incorrect",
      "twoWays",
      "repack",
      "pending",
    ]) {
      await page.goto(`/dev/place-value-factory/states?fixture=${fixture}`);
      const ship = page.getByRole("button", { name: /^(Ship order|Saving…)$/ });
      await expect(ship).toBeInViewport({ ratio: 0.999 });
      await expect(page.locator(".current-order strong")).toBeInViewport({
        ratio: 0.999,
      });
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollHeight <= innerHeight + 1,
          ),
        )
        .toBe(true);
      const buttons = await page
        .locator(".factory-console button")
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const r = node.getBoundingClientRect();
            return {
              top: r.top,
              bottom: r.bottom,
              left: r.left,
              right: r.right,
            };
          }),
        );
      for (const button of buttons) {
        expect(
          button.bottom,
          `${fixture} at ${width}x${height}`,
        ).toBeLessThanOrEqual(height + 1);
        expect(button.left).toBeGreaterThanOrEqual(0);
        expect(button.right).toBeLessThanOrEqual(width + 1);
      }
    }
  }
  await page.setViewportSize({ width: 1366, height: 600 });
  await page.goto(
    "/dev/place-value-factory/states?fixture=packing-guide-first",
  );
  await page.screenshot({
    path: "/tmp/pvf-classroom-short-screen.png",
    fullPage: true,
  });
});
