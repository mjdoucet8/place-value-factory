import { loginStudent, fillStudentLogin } from "./student-login.js";
import { expect, test } from "@playwright/test";

test("names every machine input, preserves focus and reflows at 200% text zoom", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 640, height: 720 });
  await page.goto("/dev/place-value-factory/states?fixture=calm");
  for (const [index, name] of ["Hundred thousands", "Ten thousands", "Thousands", "Hundreds", "Tens", "Ones"].entries())
    await expect(page.locator(`#quantity-${index}`)).toHaveAccessibleName(`${name} crate quantity`);
  await page.locator("#quantity-0").focus();
  await expect(page.locator("#quantity-0")).toBeFocused();
  await expect(page.locator("#quantity-0")).toHaveCSS("outline-style", "solid");
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await expect(page.getByRole("button", { name: "Ship order" })).toBeVisible();
  await expect(page.locator(".machines .machine")).toHaveCount(6);
  await page.goto("/dev/place-value-factory/states?fixture=busy");
  await expect(page.locator(".busy-scenery")).toBeHidden();
});

test("teacher report stays keyboard readable at narrow width", async ({ page }) => {
  const reset = await fetch("http://127.0.0.1:3102/__reset", { method: "POST" });
  expect(reset.status).toBe(204);
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  await page.locator("summary").filter({ hasText: "Teacher login" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Teacher login", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Teacher evidence" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
  await page.getByRole("button", { name: /View evidence for/ }).first().focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("No submitted orders in this date range.")).toBeVisible();
  const region = page.getByRole("region", { name: /Stored order evidence/ }).first();
  await expect(region).toHaveAttribute("tabindex", "0");
  await region.focus();
  await expect(region).toBeFocused();
});

test("core text and action colors meet local WCAG contrast ratios", async ({ page }) => {
  await page.goto("/dev/place-value-factory/states?fixture=calm");
  const ratios = await page.evaluate(() => {
    const channels = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number).map((number) => {
      const channel = number / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    const luminance = (value: string) => {
      const [red, green, blue] = channels(value);
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    };
    const ratio = (foreground: string, background: string) => {
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    };
    return [
      ["primary", document.querySelector<HTMLButtonElement>(".game-screen button:not(.secondary)")!, 4.5],
      ["secondary", document.querySelector<HTMLButtonElement>(".game-screen button.secondary")!, 4.5],
      ["order text", document.querySelector<HTMLElement>(".current-order")!, 4.5],
    ].map(([name, element, target]) => {
      const style = getComputedStyle(element as HTMLElement);
      return { name, ratio: ratio(style.color, style.backgroundColor), target };
    });
  });
  for (const item of ratios)
    expect(item.ratio, String(item.name)).toBeGreaterThanOrEqual(Number(item.target));
});

test("quantity keyboard navigation and Enter ship work on a saved mission", async ({ page }) => {
  const reset = await fetch("http://127.0.0.1:3102/__reset", { method: "POST" });
  expect(reset.status).toBe(204);
  await page.goto("/");
  await loginStudent(page);
  await page.getByRole("button", { name: /View mission/ }).first().click();
  await expect(page.getByText("CURRENT ORDER", { exact: true })).toBeVisible();
  const openQuantities = page.locator('.machines input[id^="quantity-"]:not([disabled])');
  await expect(page.getByRole("button", { name: "Ship order" })).toBeEnabled();
  await expect(openQuantities.first()).toBeEnabled();
  await openQuantities.first().focus();
  await openQuantities.first().fill("1");
  await expect(page.getByRole("button", { name: "Trade 1 for 10 smaller" }).first()).toBeEnabled();
  await page.keyboard.press("Tab");
  await expect(openQuantities.nth(1)).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(openQuantities.first()).toBeFocused();
  let remainder = Number((await page.locator(".current-order strong").innerText()).replace(/[ ,]/g, ""));
  for (const [index, value] of [100000,10000,1000,100,10,1].entries()) {
    if (!(await page.locator(`#quantity-${index}`).isEnabled())) continue;
    const quantity = Math.floor(remainder / value);
    remainder %= value;
    await page.locator(`#quantity-${index}`).fill(String(quantity));
  }
  const sceneGeometry = () =>
    page.locator(".game-screen").evaluate((screen) => {
      const line = screen.querySelector<HTMLElement>(".production-line")!;
      const backdrop = screen.closest<HTMLElement>(".game-viewport")!;
      const backdropStyle = getComputedStyle(backdrop);
      const backdropRect = backdrop.getBoundingClientRect();
      const screenRect = screen.getBoundingClientRect();
      return {
        screenHeight: screenRect.height,
        screenLeft: screenRect.left,
        screenWidth: screenRect.width,
        documentHeight: document.documentElement.scrollHeight,
        documentClientWidth: document.documentElement.clientWidth,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        scrollbarGutter: getComputedStyle(document.documentElement).scrollbarGutter,
        lineHeight: line.getBoundingClientRect().height,
        lineScrollWidth: line.scrollWidth,
        backdropPosition: backdropStyle.position,
        backdropImage: backdropStyle.backgroundImage,
        backdropSize: backdropStyle.backgroundSize,
        backdropRect: {
          top: backdropRect.top,
          left: backdropRect.left,
          width: backdropRect.width,
          height: backdropRect.height,
        },
      };
    });
  const idleGeometry = await sceneGeometry();
  expect(idleGeometry.backdropPosition).toBe("relative");
  expect(idleGeometry.documentHeight).toBeLessThanOrEqual(idleGeometry.viewportHeight + 1);
  await openQuantities.last().press("Enter");
  await expect(page.locator(".production-line")).toHaveAttribute(
    "data-shipment-motion",
    "departing",
  );
  await expect(page.getByText("Saved — shipment accepted.")).toHaveCount(0);
  const departingGeometry = await sceneGeometry();
  await expect(page.locator(".production-line")).toHaveAttribute(
    "data-shipment-motion",
    "arriving",
  );
  await expect(page.getByText("Saved — shipment accepted.")).toHaveCount(0);
  const arrivingGeometry = await sceneGeometry();
  await expect(page.getByText("Order 2 of 5")).toBeVisible();
  await expect(page.locator(".production-line")).toHaveAttribute(
    "data-shipment-motion",
    "idle",
  );
  const settledGeometry = await sceneGeometry();
  expect(departingGeometry).toEqual(idleGeometry);
  expect(arrivingGeometry).toEqual(idleGeometry);
  expect(settledGeometry).toEqual(idleGeometry);
  await expect(page.getByText("Saved — shipment accepted.")).toHaveCount(0);
});

test("student can finish five orders and open the next mission by keyboard", async ({ page }) => {
  const reset = await fetch("http://127.0.0.1:3102/__reset", { method: "POST" });
  expect(reset.status).toBe(204);
  await page.goto("/");
  await fillStudentLogin(page);
  await page.getByRole("button", { name: "Student login" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Factory Map" })).toBeVisible();
  await page.getByRole("button", { name: /View mission/ }).first().focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("CURRENT ORDER", { exact: true })).toBeVisible();
  for (let slot = 0; slot < 5; slot++) {
    const target = Number((await page.locator(".current-order strong").innerText()).replace(/[ ,]/g, ""));
    await page.getByRole("button", { name: "Help" }).focus();
    const enabled = page.locator('.machines input[id^="quantity-"]:not([disabled])');
    let reached = false;
    for (let step = 0; step < 24; step++) {
      await page.keyboard.press("Tab");
      reached = await enabled.first().evaluate((node) => document.activeElement === node);
      if (reached) break;
    }
    expect(reached, `order ${slot + 1} quantity reachable by Tab`).toBe(true);
    let remainder = target;
    for (let index = 0; index < await enabled.count(); index++) {
      const input = enabled.nth(index);
      await expect(input).toBeFocused();
      const place = [100000, 10000, 1000, 100, 10, 1][Number((await input.getAttribute("id"))?.split("-")[1])];
      const quantity = Math.floor(remainder / place);
      remainder %= place;
      await page.keyboard.press("Control+A");
      await page.keyboard.type(String(quantity));
      if (index < await enabled.count() - 1) {
        let nextInput = false;
        for (let tab = 0; tab < 8; tab++) {
          await page.keyboard.press("Tab");
          nextInput = await enabled.nth(index + 1).evaluate((node) => document.activeElement === node);
          if (nextInput) break;
        }
        expect(nextInput, `order ${slot + 1} next quantity reachable by Tab`).toBe(true);
      }
    }
    await page.keyboard.press("Enter");
    if (slot < 4) await expect(page.getByText(`Order ${slot + 2} of 5`)).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Level complete!" })).toBeVisible();
  await page.getByRole("button", { name: "Play next mission" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("CURRENT ORDER", { exact: true })).toBeVisible();
  await expect(page.getByText("Level 2", { exact: true })).toBeVisible();
});

test("login failure is announced and associated with credential fields", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Six-digit PIN").fill("000000");
  await loginStudent(page);
  await expect(page.getByRole("alert")).toContainText(/did not match/i);
  for (const label of ["Class code", "Username", "Six-digit PIN"])
    await expect(page.getByLabel(label, { exact: true })).toHaveAttribute("aria-describedby", "login-error");
});

test("local quantity input reaches the displayed total within the browser target", async ({ page }) => {
  await page.goto("/dev/place-value-factory/states?fixture=packing-guide-first");
  await page.evaluate(() => {
    const input = document.querySelector<HTMLInputElement>("#quantity-0")!;
    const total = document.querySelector<HTMLElement>(".representation-monitor strong")!;
    const samples: number[] = [];
    let started = 0;
    input.addEventListener("input", () => { started = performance.now(); });
    new MutationObserver(() => {
      if (started) { samples.push(performance.now() - started); started = 0; }
    }).observe(total, { childList: true, characterData: true, subtree: true });
    (window as any).__displaySamples = samples;
  });
  for (let count = 1; count <= 30; count++) {
    await page.locator("#quantity-0").fill(String(count));
    await expect(page.getByLabel(`Total ${String(count * 100000).replace(/\B(?=(\d{3})+(?!\d))/g, " ")}`)).toBeVisible();
  }
  const samples = await page.evaluate(() => (window as any).__displaySamples as number[]);
  expect(samples).toHaveLength(30);
  const sorted = [...samples].sort((a, b) => a - b);
  console.log(`INPUT_DISPLAY_METRICS ${JSON.stringify({ samples: samples.length, p50Ms: sorted[Math.ceil(sorted.length * 0.5) - 1], p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1] })}`);
  expect(sorted[Math.ceil(sorted.length * 0.95) - 1]).toBeLessThan(100);
});
