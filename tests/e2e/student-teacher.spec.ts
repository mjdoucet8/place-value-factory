import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async () => {
  const reset = await fetch("http://127.0.0.1:3102/__reset", {
    method: "POST",
  });
  expect(reset.status).toBe(204);
});

async function fillCanonicalOrder(page: Page) {
  const target = Number(
    (await page.locator(".current-order strong").innerText()).replace(/[ ,]/g, ""),
  );
  let remainder = target;
  for (const [index, value] of [100000, 10000, 1000, 100, 10, 1].entries()) {
    const input = page.locator(`#quantity-${index}`);
    if (await input.isDisabled()) continue;
    const quantity = Math.floor(remainder / value);
    remainder %= value;
    await input.fill(String(quantity));
  }
}

async function startFirstMission(page: Page) {
  await page
    .getByRole("button", { name: /View mission|Replay mission/ })
    .first()
    .click();
  await expect(page.getByText("CURRENT ORDER", { exact: true })).toBeVisible();
}

test("student completes five saved orders, settings, and optional transfer; teacher sees evidence", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  await expect(
    page.getByRole("heading", { name: "Factory Map" }),
  ).toBeVisible();
  await startFirstMission(page);
  await expect(page.getByText("CURRENT ORDER", { exact: true })).toBeVisible();
  await page.locator("#quantity-0").fill("2");
  await page.screenshot({
    path: "test-results/student-game.png",
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator("#quantity-0")).toHaveValue("2");
  const takeOver = page.getByRole("button", { name: "Take over this attempt" });
  if (await takeOver.isVisible()) await takeOver.click();
  await page.locator("#quantity-0").fill("1");
  await page.getByRole("button", { name: "Ship order" }).click();
  await expect(page.getByText("That is too many crates.")).toBeVisible();
  await expect(page.locator(".game-screen")).toHaveAttribute(
    "data-factory-alert",
    "true",
  );
  await expect(page.getByRole("alert")).toContainText("too many crates");
  await expect(page.locator("#quantity-0")).toHaveValue("1");
  for (let index = 0; index < 5; index++) {
    await fillCanonicalOrder(page);
    await page.getByRole("button", { name: "Ship order" }).click();
    if (index < 4) {
      await expect(page.getByText(`Order ${index + 2} of 5`)).toBeVisible();
      await expect(page.getByRole("button", { name: "Ship order" })).toBeEnabled();
    }
  }
  await expect(
    page.getByRole("heading", { name: "Level complete!" }),
  ).toBeVisible();
  await expect(page.getByText("First try")).toBeVisible();
  await expect(page.getByText("Orders solved")).toBeVisible();
  await expect(page.getByText("Factory score")).toBeVisible();
  await expect(page.getByText("Best streak")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Level complete!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try the extra challenge" }).click();
  await expect(page.getByText("CURRENT ORDER", { exact: true })).toBeVisible();
  await fillCanonicalOrder(page);
  await page.getByRole("button", { name: "Ship order" }).click();
  await expect(page.getByText("third star saved")).toBeVisible();
  await page.getByRole("button", { name: "Back to map" }).click();
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByLabel("Reduce motion").check();
  await page.getByRole("button", { name: "Save settings" }).click();
  await expect(
    page.getByRole("heading", { name: "Factory Map" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Progress" }).click();
  await expect(
    page.getByRole("heading", { name: "Factory Progress" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Practice/ })).toBeVisible();
  await page.getByRole("button", { name: "Back to map" }).click();

  const teacher = await browser.newPage();
  await teacher.goto("/");
  await teacher.locator("summary").filter({ hasText: "Teacher login" }).click();
  await teacher.getByRole("button", { name: "Teacher login" }).click();
  await expect(
    teacher.getByRole("heading", { name: "Teacher evidence" }),
  ).toBeVisible();
  await teacher.getByRole("button",{name:/View evidence for/}).first().click();
  await expect(teacher.getByText("accepted shipments")).toBeVisible();
  await teacher.close();
});

test("shows the packing guide only during Receiving or the first order", async ({ page }) => {
  for (const fixture of ["packing-guide-tutorial", "packing-guide-first"]) {
    await page.goto(`/dev/place-value-factory/states?fixture=${fixture}`);
    await expect(page.getByRole("region", { name: "Current crate representation" })).toBeVisible();
  }
  await page.goto("/dev/place-value-factory/states?fixture=calm");
  await expect(page.getByRole("region", { name: "Current crate representation" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ship order" })).toBeVisible();
  await expect(page.locator(".factory-console")).toHaveAttribute("data-packing-monitor", "false");
});

test("Warehouse completion reveals Shipping from its primary unlock button", async ({ page }) => {
  await page.goto("/dev/place-value-factory/states?fixture=results-warehouse");
  await expect(page.getByRole("heading", { name: "Warehouse Station Complete!" })).toBeVisible();
  await page.screenshot({ path: "/tmp/math-factory-warehouse-complete.png", fullPage: true, animations: "disabled" });
  await page.getByRole("button", { name: "Unlock Shipping Station" }).click();
  await expect(page).toHaveURL(/fixture=map-shipping-unlock/);
  const station = page.locator('[data-zone="shipping"]');
  await expect(station).toHaveAttribute("data-zone-state", "available");
  await expect(station).toHaveAttribute("data-zone-unlocking", "true");
  await expect(station.locator(".zone-building")).toHaveCSS("animation-name", "station-unlock-reveal");
  await expect(page.getByRole("button", { name: /View mission — Level 16/ })).toBeEnabled();
});

test("keeps the handoff-faithful gallery baselines stable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const fixture of ["map", "calm", "paused", "results-three"]) {
    await page.goto(`/dev/place-value-factory/states?fixture=${fixture}`);
    await page.locator("img").evaluateAll((images) =>
      Promise.all(
        images.map((image) => {
          const asset = image as HTMLImageElement;
          return asset.complete
            ? Promise.resolve()
            : new Promise((resolve) =>
                asset.addEventListener("load", resolve, { once: true }),
              );
        }),
      ),
    );
    await page.locator(".fixture-toolbar select").evaluate((select) => {
      (select as HTMLSelectElement).blur();
      select.style.outline = "none";
    });
    await expect(page).toHaveScreenshot(`handoff-${fixture}.png`, {
      animations: "disabled",
      fullPage: true,
    });
  }
});

test("fills wide screens with a larger factory map and fits small screens", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/dev/place-value-factory/states?fixture=map");
  const map = await page.locator(".map-screen").boundingBox();
  expect(map?.x).toBe(0);
  expect(map?.width).toBe(1920);
  expect((await page.locator(".factory-route").boundingBox())?.width).toBeGreaterThan(1500);
  expect((await page.locator(".zone-building").first().boundingBox())?.height).toBeGreaterThan(190);
  await page.screenshot({ path: "/tmp/math-factory-wide-map.png", fullPage: true, animations: "disabled" });
  for (const width of [1280, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole("button", { name: /Replay mission — Level 1:/ })).toBeVisible();
  }
  await page.screenshot({ path: "/tmp/math-factory-phone-map.png", fullPage: true, animations: "disabled" });
});

test("resumes a paused mission after the page reloads", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  await startFirstMission(page);
  await page.getByRole("button", { name: "Pause mission" }).click();
  await expect(
    page.getByRole("heading", { name: "Factory Map" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Mission paused" }),
  ).toBeVisible();
  await expect(page.locator(".paused-factory-scene")).toHaveCount(0);
  await page.getByRole("button", { name: "Resume mission" }).click();
  await expect(
    page.getByText("CURRENT ORDER", { exact: true }),
  ).toBeVisible();
});

test("returns to the map when pause finds an already completed attempt", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  await startFirstMission(page);
  await page.route("**/api/v1/games/place-value-factory/attempts/*/pause", async (route) => {
    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "NOT_FOUND", message: "Attempt not found." },
      }),
    });
  });
  await page.getByRole("button", { name: "Pause mission" }).click();
  await expect(page.getByRole("heading", { name: "Factory Map" })).toBeVisible();
  await expect(page.getByText("Could not pause")).toHaveCount(0);
});

test("keeps play usable when browser storage cannot save a draft", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage disabled", "QuotaExceededError");
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  await startFirstMission(page);
  await expect(
    page.getByText(
      /Device storage is unavailable\. Your current draft stays in this tab/,
    ),
  ).toBeVisible();
  await fillCanonicalOrder(page);
  await page.getByRole("button", { name: "Ship order" }).click();
  await expect(page.getByText("Order 2 of 5")).toBeVisible();
  await expect(page.getByText("Saved — shipment accepted.")).toHaveCount(0);
});

test("saves directly with an explicit warning when IndexedDB is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, "indexedDB", { value: undefined }),
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  await startFirstMission(page);
  await fillCanonicalOrder(page);
  await page.getByRole("button", { name: "Ship order" }).click();
  await expect(page.getByText("Order 2 of 5")).toBeVisible();
  await expect(page.getByText(/Device storage is unavailable/)).toBeVisible();
});

test("a second tab takes over and the stale writer cannot ship", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  await startFirstMission(page);
  await expect(page.getByText("CURRENT ORDER", { exact: true })).toBeVisible();

  const secondTab = await page.context().newPage();
  await secondTab.goto("/");
  await expect(
    secondTab.getByRole("button", { name: "Take over this attempt" }),
  ).toBeVisible();
  await secondTab
    .getByRole("button", { name: "Take over this attempt" })
    .click();
  await expect(
    secondTab.getByText("This tab now controls the saved attempt."),
  ).toHaveCount(0);
  await expect(
    secondTab.getByRole("button", { name: "Take over this attempt" }),
  ).toHaveCount(0);
  const shipmentBefore = Number(
    (await secondTab.locator("header span").innerText()).match(/\d+/)?.[0],
  );

  await fillCanonicalOrder(page);
  await page.getByRole("button", { name: "Ship order" }).click();
  await expect(
    page.getByText(/shipment is waiting to save — Another tab is editing/),
  ).toBeVisible();

  await fillCanonicalOrder(secondTab);
  await secondTab.getByRole("button", { name: "Ship order" }).click();
  await expect(
    secondTab.getByText(/earlier tab's unsent crates were not added/),
  ).toBeVisible();
  await secondTab.getByRole("button", { name: "Ship order" }).click();
  await expect(
    secondTab.getByText(`Order ${shipmentBefore + 1} of 5`),
  ).toBeVisible();
  await secondTab.close();
});

test("help dialog traps focus and Escape restores its trigger", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  await startFirstMission(page);
  const trigger = page.getByRole("button", { name: "Help" });
  await trigger.click();
  await expect(
    page.getByRole("dialog", { name: "Step-by-step help" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("recovers a shipment whose server reply was dropped after commit", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  if (
    await page.getByRole("button", { name: "Resume saved mission" }).isVisible()
  )
    await page.getByRole("button", { name: "Resume saved mission" }).click();
  else await startFirstMission(page);
  await expect(page.getByText("CURRENT ORDER", { exact: true })).toBeVisible();
  const takeOver = page.getByRole("button", { name: "Take over this attempt" });
  if (await takeOver.isVisible()) await takeOver.click();
  const shipmentBefore = Number(
    (await page.locator("header span").innerText()).match(/\d+/)?.[0],
  );
  let dropped = false;
  await page.route("**/responses", async (route) => {
    if (dropped) return route.continue();
    dropped = true;
    await route.fetch();
    await route.abort("connectionfailed");
  });
  await fillCanonicalOrder(page);
  await page.getByRole("button", { name: "Ship order" }).click();
  await expect(
    page.getByText(/Your shipment is waiting to save/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Try saving again" }),
  ).toBeVisible();
  await page.unroute("**/responses");
  await page.reload();
  await expect(page.getByText("Saved shipment restored.")).toBeVisible();
  await expect(
    page.getByText(`Order ${shipmentBefore + 1} of 5`),
  ).toBeVisible();
});

test("replays an IndexedDB shipment after disconnect before commit", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  await startFirstMission(page);
  await page.route("**/responses", (route) => route.abort("connectionfailed"));
  await fillCanonicalOrder(page);
  await page.getByRole("button", { name: "Ship order" }).click();
  await expect(
    page.getByRole("button", { name: "Try saving again" }),
  ).toBeVisible();
  const queued = await page.evaluate(
    () =>
      new Promise<any[]>((resolve, reject) => {
        const open = indexedDB.open("place-value-factory-outbox-v1");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const tx = open.result.transaction("pending-commands", "readonly");
          const read = tx.objectStore("pending-commands").getAll();
          read.onsuccess = () => resolve(read.result);
          read.onerror = () => reject(read.error);
          tx.oncomplete = () => open.result.close();
        };
      }),
  );
  expect(queued).toHaveLength(1);
  expect(queued[0].kind).toBe("response");
  expect(queued[0].payload.commandId).toBeTruthy();
  await page.unroute("**/responses");
  await page.reload();
  await expect(page.getByText("Saved shipment restored.")).toBeVisible();
  await expect(page.getByText("Order 2 of 5")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Order 2 of 5")).toBeVisible();
});

test("retries the same queued shipment when the connection returns", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  await startFirstMission(page);
  await page.route("**/responses", (route) => route.abort("connectionfailed"));
  await fillCanonicalOrder(page);
  await page.getByRole("button", { name: "Ship order" }).click();
  await expect(
    page.getByRole("button", { name: "Try saving again" }),
  ).toBeVisible();
  await page.unroute("**/responses");
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.getByText("Order 2 of 5")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Try saving again" }),
  ).toHaveCount(0);
});

test("restores a queued help step before the next shipment", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  await startFirstMission(page);
  await page.route("**/hints", (route) => route.abort("connectionfailed"));
  await page.getByRole("button", { name: "Help", exact: true }).click();
  await page.getByRole("button", { name: "Get H1 help" }).click();
  await expect(page.getByText(/help request is waiting to save/)).toBeVisible();
  await page.unroute("**/hints");
  await page.reload();
  await expect(page.getByText("Saved help restored.")).toBeVisible();
  await page.getByRole("button", { name: "Help", exact: true }).click();
  await expect(
    page.getByText(/One crate in a place is worth ten crates/),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Get H2 help" })).toBeVisible();
});

test("does not silently merge queued crates after another tab takes control", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  await startFirstMission(page);
  await page.route("**/responses", (route) => route.abort("connectionfailed"));
  await fillCanonicalOrder(page);
  const firstQuantity = await page.locator("#quantity-4").inputValue();
  await page.getByRole("button", { name: "Ship order" }).click();
  await expect(
    page.getByRole("button", { name: "Try saving again" }),
  ).toBeVisible();
  const other = await page.context().newPage();
  await other.addInitScript(() =>
    Object.defineProperty(window, "indexedDB", { value: undefined }),
  );
  await other.goto("/");
  await other.getByRole("button", { name: "Take over this attempt" }).click();
  await page.unroute("**/responses");
  await page.getByRole("button", { name: "Try saving again" }).click();
  await expect(
    page.getByText(/lost control before those crates were saved/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Take over this attempt" }).click();
  await expect(page.locator("#quantity-4")).toHaveValue(firstQuantity);
  await expect(
    page.getByText(/Unsaved crates are ready for review/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Ship order" }).click();
  await expect(page.getByText("Order 2 of 5")).toBeVisible();
  await other.close();
});

test("renders deterministic advanced-mode visual fixtures", async ({
  page,
}) => {
  const states = [
    ["restricted", "Use only thousands (1 000) and tens (10)."],
    ["minimum", "Use the fewest crates"],
    ["exactTypes", "Use exactly 2 crate sizes"],
    ["twoWays", "Representation B"],
    ["repack", "Read-only source crates"],
    ["takeover", "Take over this attempt"],
    ["storage", "Device storage is unavailable"],
  ] as const;
  for (const [fixture, expected] of states) {
    await page.goto(`/dev/place-value-factory/states?fixture=${fixture}`);
    await expect(
      page.getByText(expected, { exact: false }).first(),
    ).toBeVisible();
  }
  await page.goto("/dev/place-value-factory/states?fixture=results-three");
  await expect(page.getByLabel("3 earned stars")).toBeVisible();
  await page.goto("/dev/place-value-factory/states?fixture=results-station");
  await expect(
    page.getByRole("heading", { name: "Shipping Station Complete!" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Unlock Packing Station" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Play next mission" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Unlock Packing Station" }).click();
  await expect(page).toHaveURL(/fixture=map-unlock/);
  await expect(page.getByRole("status", { name: "" })).toContainText(
    "Packing Station unlocked!",
  );
  const packingStation = page.locator('[data-zone="packing"]');
  await expect(packingStation).toHaveAttribute("data-zone-state", "available");
  await expect(packingStation).toHaveAttribute("data-zone-unlocking", "true");
  await expect(packingStation.locator(".zone-building")).toHaveCSS(
    "animation-name",
    "station-unlock-reveal",
  );
  await page.goto("/dev/place-value-factory/states?fixture=map-resume");
  await expect(
    page.getByRole("button", { name: "Resume saved mission" }),
  ).toBeVisible();
  const currentLevel = await page.locator(".map-current-level").boundingBox();
  const guide = await page.locator(".map-welcome").boundingBox();
  const mapButtons = await page
    .getByRole("group", { name: "Map presentation" })
    .boundingBox();
  const resumeBanner = await page.locator(".resume-banner").boundingBox();
  expect(currentLevel && guide && mapButtons && resumeBanner).toBeTruthy();
  expect(currentLevel!.x + currentLevel!.width).toBeLessThan(guide!.x);
  expect(guide!.x + guide!.width).toBeLessThan(mapButtons!.x);
  expect(resumeBanner!.height).toBeLessThan(80);
  await page.goto("/dev/place-value-factory/states?fixture=map");
  await page.getByRole("button", { name: /Locked — Level 13:/ }).click();
  await expect(page.getByRole("status")).toContainText(
    "Complete Level 12 first",
  );
  await page.goto("/dev/place-value-factory/states?fixture=progress");
  await expect(page.getByText("Still gathering evidence")).toBeVisible();
  await page.goto("/dev/place-value-factory/states?fixture=incorrect");
  await expect(page.locator(".game-screen")).toHaveAttribute(
    "data-factory-alert",
    "true",
  );
  await expect(page.getByRole("alert")).toContainText("more crates");
  await expect(page.locator(".game-screen")).toHaveCSS(
    "animation-name",
    "factory-emergency-frame",
  );
  await page.evaluate(() => {
    document.documentElement.dataset.motion = "reduced";
  });
  await expect(page.locator(".game-screen")).toHaveCSS("animation-name", "none");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dev/place-value-factory/states?fixture=calm");
  await expect(page.getByRole("button", { name: "Ship order" })).toBeVisible();
  await expect(page.locator(".machine")).toHaveCount(6);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/dev/place-value-factory/states?fixture=loading");
  await expect(page.locator(".skeleton").first()).toHaveCSS(
    "animation-name",
    "none",
  );
});

test("loads original art and keeps gallery controls responsive", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: null });
  const fixtures = [
    "map",
    "map-resume",
    "progress",
    "calm",
    "busy",
    "restricted",
    "minimum",
    "exactTypes",
    "twoWays",
    "repack",
    "incorrect",
    "pending",
    "offline",
    "storage",
    "takeover",
    "paused",
    "help",
    "results-two",
    "results-three",
    "loading",
    "error",
    "empty",
  ];
  for (const fixture of fixtures) {
    await page.goto(`/dev/place-value-factory/states?fixture=${fixture}`);
    await expect(page.locator("main").first()).toBeVisible();
  }
  await page.goto("/dev/place-value-factory/states?fixture=map");
  await expect(page.locator(".zone-building")).toHaveCount(5);
  await expect(page.locator(".zone-building").first()).toHaveJSProperty(
    "naturalWidth",
    768,
  );
  await page.screenshot({
    path: "test-results/art-v1-map.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.goto("/dev/place-value-factory/states?fixture=busy");
  await expect(page.locator(".busy-scenery")).toHaveClass(/is-busy/);
  await expect(page.locator(".busy-scenery img").first()).toHaveJSProperty(
    "naturalWidth",
    512,
  );
  await page.screenshot({
    path: "test-results/art-v1-busy-game.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator(".busy-scenery")).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dev/place-value-factory/states?fixture=map");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/dev/place-value-factory/states?fixture=results-three");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto("/dev/place-value-factory/states?fixture=results-three");
  await page.screenshot({
    path: "test-results/art-v1-results.png",
    fullPage: true,
    animations: "disabled",
  });
});
