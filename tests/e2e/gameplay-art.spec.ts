import { loginStudent } from "./student-login.js";
import { expect, test, type Page } from "@playwright/test";

const places = [100000, 10000, 1000, 100, 10, 1];

async function startMission(page: Page) {
  const reset = await fetch("http://127.0.0.1:3102/__reset", {
    method: "POST",
  });
  expect(reset.status).toBe(204);
  await page.goto("/");
  await loginStudent(page);
  await page
    .getByRole("button", { name: /View mission/ })
    .first()
    .click();
  await expect(page.getByText("CURRENT ORDER", { exact: true })).toBeVisible();
}

async function packOrder(page: Page) {
  let remainder = Number(
    (await page.locator(".current-order strong").innerText()).replace(
      /[ ,]/g,
      "",
    ),
  );
  for (const [index, value] of places.entries()) {
    const input = page.locator(`#quantity-${index}`);
    if (await input.isDisabled()) continue;
    await input.fill(String(Math.floor(remainder / value)));
    remainder %= value;
  }
}

test("independent art loads and live counts fit the crate panels at every screen size", async ({
  page,
}) => {
  await page.goto("/dev/place-value-factory/states?fixture=calm");
  const sprites = page.locator(".workstation-art img");
  await expect(sprites).toHaveCount(12);
  const files = await sprites.evaluateAll(async (images) => {
    await Promise.all(
      images.map((image) => (image as HTMLImageElement).decode()),
    );
    return images.map((image) => (image as HTMLImageElement).src);
  });
  expect(new Set(files).size).toBe(12);
  expect(files.filter((file) => file.includes("/crate-"))).toHaveLength(6);
  expect(files.filter((file) => file.includes("/dispenser-"))).toHaveLength(6);

  await page
    .getByRole("button", {
      name: "Add one Hundred thousands crate",
      exact: true,
    })
    .click();
  await expect(page.locator("#quantity-0")).toHaveValue("1");
  await page
    .getByRole("button", { name: "Trade 1 for 10 smaller" })
    .first()
    .click();
  await expect(page.locator("#quantity-0")).toHaveValue("0");
  await expect(page.locator("#quantity-1")).toHaveValue("10");
  await page
    .getByRole("button", {
      name: "Remove one Ten thousands crate",
      exact: true,
    })
    .click();
  await expect(page.locator("#quantity-1")).toHaveValue("9");

  for (const [width, height] of [
    [1920, 1080],
    [1366, 768],
    [1024, 768],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    for (let index = 0; index < 6; index++)
      await page.locator(`#quantity-${index}`).fill("999999");
    const fit = await page.locator(".editable-crate").evaluateAll((crates) =>
      crates.map((crate) => {
        const box = crate.getBoundingClientRect();
        const input = crate.querySelector("input")!;
        const field = input.getBoundingClientRect();
        const style = getComputedStyle(input);
        const context = document.createElement("canvas").getContext("2d")!;
        context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const textWidth = context.measureText(input.value).width;
        const innerWidth =
          input.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight);
        return {
          textWidth,
          innerWidth,
          left: (field.left - box.left) / box.width,
          right: (field.right - box.left) / box.width,
          top: (field.top - box.top) / box.height,
          bottom: (field.bottom - box.top) / box.height,
        };
      }),
    );
    for (const plate of fit) {
      expect(plate.textWidth).toBeLessThanOrEqual(plate.innerWidth);
      expect(plate.left).toBeGreaterThan(0.2);
      expect(plate.right).toBeLessThan(0.8);
      expect(plate.top).toBeGreaterThan(0.4);
      expect(plate.bottom).toBeLessThan(0.87);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.locator("#quantity-5").focus();
    await expect(page.locator("#quantity-5")).toBeInViewport();
  }
  await page.goto("/dev/place-value-factory/states?fixture=restricted");
  await expect(page.locator(".machine-closed-badge")).toHaveCount(4);
  await expect(page.locator("#quantity-0")).toBeDisabled();
  await expect(page.locator("#quantity-2")).toBeEnabled();
});

test("saved shipments carry separate crates and their fields fully off the belt while dispensers stay fixed", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1920, height: 940 });
  await startMission(page);
  await packOrder(page);
  await page
    .locator(".workstation-art img")
    .evaluateAll((images) =>
      Promise.all(images.map((image) => (image as HTMLImageElement).decode())),
    );
  // Record the actual CSS animation endpoints during a real saved order.
  await page.evaluate(() => {
    const samples: unknown[] = [];
    (window as any).__crateTravel = samples;
    const positions = () =>
      Array.from(document.querySelectorAll(".machine-artwork")).map((el) =>
        el.getBoundingClientRect().toJSON(),
      );
    (window as any).__stationaryDispensers = positions();
    document.addEventListener("animationend", (event) => {
      const animation = event as AnimationEvent;
      const target = animation.target as HTMLElement;
      if (!target.matches(".illustrated-machine:first-child .editable-crate"))
        return;
      samples.push({
        name: animation.animationName,
        dispensers: positions(),
        crates: Array.from(document.querySelectorAll(".editable-crate")).map(
          (el) => ({
            left: el.getBoundingClientRect().left,
            countLeft: el.querySelector("input")!.getBoundingClientRect().left,
            count: el.querySelector("input")!.value,
          }),
        ),
        viewport: innerWidth,
      });
    });
  });
  const sceneGeometry = () =>
    page.evaluate(async () => {
      // Let both React layout and the viewport ResizeObserver settle.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      return {
        scale:
          document.querySelector<HTMLElement>(".game-viewport")!.dataset.scale,
        boxes: [
          ".game-screen",
          ".game-screen > header",
          ".current-order",
          ".production-line",
          ".factory-console",
        ].map((selector) =>
          document.querySelector(selector)!.getBoundingClientRect().toJSON(),
        ),
      };
    });
  const idleGeometry = await sceneGeometry();
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/orders/*/responses", async (route) => {
    await held;
    await route.continue();
  });
  await page.getByRole("button", { name: "Ship order" }).click();
  await expect(page.getByRole("button", { name: "Saving…" })).toBeDisabled();
  await expect(page.locator(".production-line")).toHaveAttribute(
    "data-shipment-motion",
    "idle",
  );
  try {
    expect(await sceneGeometry()).toEqual(idleGeometry);
    // Resizing must still work even while the network reply is held.
    await page.setViewportSize({ width: 1024, height: 600 });
    const smallGeometry = await sceneGeometry();
    expect(smallGeometry.boxes[0].width).toBeLessThan(
      idleGeometry.boxes[0].width,
    );
    await expect(page.getByRole("button", { name: "Saving…" })).toBeInViewport({
      ratio: 0.999,
    });
    expect(await sceneGeometry()).toEqual(smallGeometry);
    await page.setViewportSize({ width: 1920, height: 940 });
    expect(await sceneGeometry()).toEqual(idleGeometry);
  } finally {
    release();
  }
  await expect(page.getByText("Order 2 of 5")).toBeVisible();
  await expect(page.locator(".production-line")).toHaveAttribute(
    "data-shipment-motion",
    "idle",
  );
  const evidence = await page.evaluate(() => ({
    samples: (window as any).__crateTravel,
    dispensers: (window as any).__stationaryDispensers,
  }));
  expect(evidence.samples.map((item: any) => item.name)).toEqual([
    "shipment-crates-depart",
    "shipment-crates-arrive",
  ]);
  for (const sample of evidence.samples)
    expect(sample.dispensers).toEqual(evidence.dispensers);
  for (const crate of evidence.samples[0].crates) {
    expect(crate.left).toBeGreaterThan(evidence.samples[0].viewport);
    expect(crate.countLeft).toBeGreaterThan(evidence.samples[0].viewport);
  }
  for (const crate of evidence.samples[1].crates) expect(crate.count).toBe("0");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
});

test("reduced motion ships correctly without moving the equipment", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await startMission(page);
  await packOrder(page);
  await page.evaluate(() => {
    (window as any).__crateAnimations = [];
    document.addEventListener("animationstart", (event) => {
      const animation = event as AnimationEvent;
      if (animation.animationName.startsWith("shipment-crates"))
        (window as any).__crateAnimations.push(animation.animationName);
    });
  });
  await page.getByRole("button", { name: "Ship order" }).click();
  await expect(page.getByText("Order 2 of 5")).toBeVisible();
  await expect(page.locator(".production-line")).toHaveAttribute(
    "data-shipment-motion",
    "idle",
  );
  await expect(page.locator("#quantity-0")).toHaveValue("0");
  expect(await page.evaluate(() => (window as any).__crateAnimations)).toEqual(
    [],
  );
});
