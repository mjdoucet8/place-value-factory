import { expect, test } from "@playwright/test";

test("audits visible text across student, teacher and gallery states", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dev/place-value-factory/states");
  const states = await page.locator(".fixture-toolbar option").evaluateAll((options) =>
    options.map((option) => (option as HTMLOptionElement).value),
  );
  const findings: Record<string, unknown>[] = [];
  const audit = () => page.evaluate(() => {
      const rgb = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 4).map(Number);
      const lum = ([r, g, b]: number[]) => [r, g, b].map((n) => {
        const v = n / 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      }).reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i], 0);
      const ratio = (a: number[], b: number[]) => {
        const [light, dark] = [lum(a), lum(b)].sort((x, y) => y - x);
        return (light + 0.05) / (dark + 0.05);
      };
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const low: { text: string; selector: string; ratio: number; fg: string; bg: string }[] = [];
      const imageBacked: { text: string; selector: string }[] = [];
      let checked = 0;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.textContent?.trim();
        const element = node.parentElement;
        if (!text || !element || element.closest("script,style,option,[aria-hidden='true']")) continue;
        const box = element.getBoundingClientRect();
        if (!box.width || !box.height || getComputedStyle(element).visibility === "hidden") continue;
        const fgStyle = getComputedStyle(element);
        if (fgStyle.opacity === "0" || fgStyle.display === "none") continue;
        let ancestor: Element | null = element;
        let bg = "";
        let image = false;
        let gradientColors: number[][] = [];
        while (ancestor) {
          const style = getComputedStyle(ancestor);
          if (style.backgroundImage.includes("url(")) { image = true; break; }
          if (style.backgroundImage !== "none") {
            gradientColors = [...style.backgroundImage.matchAll(/rgb\(\d+, \d+, \d+\)/g)].map(([value]) => rgb(value));
            gradientColors.push(...[...style.backgroundImage.matchAll(/#[0-9a-fA-F]{6}/g)].map(([hex]) =>
              [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)),
            ));
            if (gradientColors.length) break;
          }
          const color = rgb(style.backgroundColor);
          if (color.length >= 3 && (color[3] === undefined || color[3] >= 0.99)) {
            bg = style.backgroundColor;
            break;
          }
          ancestor = ancestor.parentElement;
        }
        const selector = `${element.tagName.toLowerCase()}${element.className && typeof element.className === "string" ? "." + element.className.trim().split(/\s+/).join(".") : ""}`;
        if (image || (!bg && !gradientColors.length)) imageBacked.push({ text: text.slice(0, 60), selector });
        if (!bg && !gradientColors.length) continue;
        const score = Math.min(...(gradientColors.length ? gradientColors : [rgb(bg)]).map((color) => ratio(rgb(fgStyle.color), color)));
        checked++;
        const size = parseFloat(fgStyle.fontSize);
        const weight = Number(fgStyle.fontWeight) || 400;
        const threshold = size >= 24 || (size >= 18.66 && weight >= 700) ? 3 : 4.5;
        if (score < threshold) low.push({ text: text.slice(0, 60), selector, ratio: Math.round(score * 100) / 100, fg: fgStyle.color, bg: bg || "gradient" });
      }
      return { checked, low, imageBacked };
    });
  for (const state of states) {
    await page.goto(`/dev/place-value-factory/states?fixture=${state}`);
    if (["map", "calm", "busy", "help", "results-three"].includes(state))
      await page.screenshot({ path: `/tmp/pvf-visual-${state}.png`, fullPage: true, animations: "disabled" });
    const result = await audit();
    findings.push({ state, ...result });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const state of ["map", "calm", "results-three"]) {
    await page.goto(`/dev/place-value-factory/states?fixture=${state}`);
    await page.screenshot({ path: `/tmp/pvf-visual-${state}-narrow.png`, fullPage: true, animations: "disabled" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${state} narrow reflow`).toBe(true);
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  findings.push({ state: "login", ...(await audit()) });
  await page.locator("summary").filter({ hasText: "Teacher login" }).click();
  await page.getByRole("button", { name: "Teacher login", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Teacher evidence" })).toBeVisible();
  await page.screenshot({ path: "/tmp/pvf-visual-teacher.png", fullPage: true, animations: "disabled" });
  findings.push({ state: "teacher", ...(await audit()) });
  await page.setViewportSize({ width: 320, height: 720 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "teacher 320px reflow").toBe(true);
  await page.screenshot({ path: "/tmp/pvf-visual-teacher-narrow.png", fullPage: true, animations: "disabled" });
  console.log(`VISUAL_AUDIT ${JSON.stringify(findings)}`);
  expect(findings.length).toBeGreaterThan(20);
  for (const finding of findings) {
    expect(finding.low, `${finding.state} low-contrast text`).toEqual([]);
    expect(finding.imageBacked, `${finding.state} text directly over artwork`).toEqual([]);
  }
});

test("checks whether Chromium keyboard zoom changes native viewport metrics", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/dev/place-value-factory/states?fixture=calm");
  const before = await page.evaluate(() => ({ width: innerWidth, dpr: devicePixelRatio, scale: visualViewport?.scale }));
  await page.keyboard.press("Control+Equal");
  await page.keyboard.press("Control+Equal");
  const after = await page.evaluate(() => ({ width: innerWidth, dpr: devicePixelRatio, scale: visualViewport?.scale, scrollWidth: document.documentElement.scrollWidth }));
  console.log(`NATIVE_ZOOM ${JSON.stringify({ before, after })}`);
  test.skip(after.width === before.width && after.dpr === before.dpr && after.scale === before.scale,
    "Chromium automation does not expose a changed native browser zoom in this environment; CSS zoom has a separate test.");
  expect(after.scrollWidth).toBeLessThanOrEqual(after.width + 1);
});
