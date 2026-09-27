import { test, expect } from "@playwright/test";

test("reviews all gallery fixtures, assets and reflow at desktop and narrow widths", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dev/place-value-factory/states");
  const states = await page
    .locator(".fixture-toolbar option")
    .evaluateAll((options) =>
      options.map((option) => (option as HTMLOptionElement).value),
    );
  expect(states.length).toBeGreaterThan(20);
  for (const width of [1366, 390, 320]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
    for (const state of states) {
      await page.goto(`/dev/place-value-factory/states?fixture=${state}`);
      await expect(page.locator("main")).toBeVisible();
      await page
        .locator("img")
        .evaluateAll((images) =>
          Promise.all(
            images.map((image) => (image as HTMLImageElement).decode()),
          ),
        );
      expect(
        await page
          .locator("img")
          .evaluateAll((images) =>
            images.every(
              (image) => (image as HTMLImageElement).naturalWidth > 0,
            ),
          ),
        `${state} images`,
      ).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${state} at ${width}px`,
      ).toBe(true);
      if (page.url().includes("fixture=calm")) {
        await page.locator("#quantity-0").fill("2");
        await expect(
          page.getByLabel("Total 200 000", { exact: true }),
        ).toBeVisible();
      }
    }
  }
});

test("captures reviewed major compositions at four viewport sizes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const [name, width, height] of [
    ["desktop", 1366, 768],
    ["laptop", 1280, 720],
    ["landscape", 1024, 768],
    ["portrait", 768, 1024],
    ["narrow", 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    for (const fixture of ["map", "calm", "results-three"]) {
      await page.goto(`/dev/place-value-factory/states?fixture=${fixture}`);
      await page.evaluate(() => document.fonts.ready);
      await page
        .locator("img")
        .evaluateAll((images) =>
          Promise.all(
            images.map((image) => (image as HTMLImageElement).decode()),
          ),
        );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `test-results/review-${fixture}-${name}.png`,
        fullPage: true,
        animations: "disabled",
      });
      if (fixture === "calm") {
        const overlaps = await page
          .locator(".machine")
          .evaluateAll((machines) =>
            machines.some((machine) => {
              const crate = machine
                .querySelector(".machine-crate")
                ?.getBoundingClientRect();
              const exchange = machine
                .querySelector(".exchange")
                ?.getBoundingClientRect();
              return crate && exchange && crate.bottom > exchange.top;
            }),
          );
        expect(overlaps).toBe(false);
      }
    }
  }
});

test("has 30 live map nodes, a keyboard list, locked explanations and earned-only cosmetics", async ({
  page,
}) => {
  await page.goto("/dev/place-value-factory/states?fixture=map");
  await expect(page.locator(".level-node")).toHaveCount(30);
  await expect(page.locator('.level-node[aria-current="step"]')).toHaveText(
    "12",
  );
  await expect(page.locator(".zone-cosmetic")).toHaveCount(2);
  await expect(
    page.locator('[data-zone="receiving"] .zone-cosmetic'),
  ).toHaveAttribute("src", /cosmetic-sign/);
  await expect(
    page.locator('[data-zone="packing"] .zone-cosmetic'),
  ).toHaveAttribute("src", /cosmetic-crane/);
  await page.getByRole("button", { name: /Locked — Level 13:/ }).click();
  await expect(page.getByRole("status")).toContainText(
    "Complete Level 12 first",
  );
  await page.getByRole("button", { name: "Level list", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".level-list li")).toHaveCount(30);
  await expect(
    page.getByRole("button", { name: "View mission", exact: true }),
  ).toHaveCount(1);
});
