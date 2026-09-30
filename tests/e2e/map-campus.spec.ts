import { expect, test } from "@playwright/test";

test("approved campus scenery keeps every level live, reachable and aligned through resizing", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1747, height: 1050 });
  await page.goto("/dev/place-value-factory/states?fixture=map");
  const scene = page.locator(".factory-map-art");
  await expect(scene).toHaveJSProperty("naturalWidth", 1747);
  await expect(scene).toHaveJSProperty("naturalHeight", 900);
  await expect(page.locator(".level-node")).toHaveCount(30);
  await expect(page.locator(".station-medal")).toHaveCount(2);
  await expect(page.locator('.level-node[aria-current="step"]')).toContainText(
    "12",
  );
  await expect(
    page.locator('[data-level-id="level-13"] .node-stars'),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-level-id="level-1"] .node-stars'),
  ).toHaveAttribute("aria-label", "3 earned stars");

  for (const [width, height] of [
    [1747, 1050],
    [1366, 768],
    [768, 1024],
    [390, 844],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const art = document
            .querySelector(".factory-map-art")!
            .getBoundingClientRect();
          const nodes = Array.from(
            document.querySelectorAll<HTMLButtonElement>(".level-node"),
          );
          const labels = nodes.map((node) => node.getAttribute("aria-label"));
          return (
            Math.abs(art.width / art.height - 1747 / 900) < 0.001 &&
            new Set(labels).size === 30 &&
            nodes.every((node) => {
              const box = node.getBoundingClientRect();
              const hit = document.elementFromPoint(
                box.x + box.width / 2,
                box.y + box.height / 2,
              );
              return (
                hit?.closest("button") === node &&
                box.left >= art.left &&
                box.right <= art.right &&
                box.top >= art.top &&
                box.bottom <= art.bottom
              );
            })
          );
        }),
      )
      .toBe(true);
  }

  await page.setViewportSize({ width: 1366, height: 768 });
  const locked = page.getByRole("button", { name: /Locked — Level 13:/ });
  await locked.focus();
  await expect(locked).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText(
    "Complete Level 12 first",
  );
  await expect(page.locator('.level-node[aria-current="step"]')).toContainText(
    "12",
  );
  await page.getByRole("button", { name: "Level list", exact: true }).click();
  await expect(scene).toHaveCount(0);
  await expect(page.locator(".level-list li")).toHaveCount(30);
  await expect(page.locator(".zone-building")).toHaveCount(5);
  await page
    .getByRole("button", { name: "Factory world", exact: true })
    .click();
  await expect(scene).toBeVisible();
  await expect(page.locator(".level-node")).toHaveCount(30);
  await page.screenshot({
    path: "/tmp/math-factory-campus-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
});
