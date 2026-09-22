import { expect, test, type Page } from "@playwright/test";

async function fillCanonicalOrder(page: Page) {
  const target = Number(
    (await page.locator(".current-order strong").innerText()).replace(/,/g, ""),
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
  await expect(page.getByRole("heading", { name: /Level \d+/ })).toBeVisible();
  await page
    .getByRole("button", { name: /Start mission|Replay level/ })
    .click();
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
  await expect(page.getByText("CURRENT ORDER")).toBeVisible();
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
  await expect(page.locator("#quantity-0")).toHaveValue("1");
  for (let index = 0; index < 5; index++) {
    await fillCanonicalOrder(page);
    await page.getByRole("button", { name: "Ship order" }).click();
    if (index < 4)
      await expect(page.getByText(`Shipment ${index + 2} of 5`)).toBeVisible();
  }
  await expect(
    page.getByRole("heading", { name: "Level complete!" }),
  ).toBeVisible();
  await expect(page.getByText("First try")).toBeVisible();
  await expect(page.getByText("Eventually correct")).toBeVisible();
  await expect(page.getByText("This-level efficiency")).toBeVisible();
  await expect(page.getByText("Best streak")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Level complete!" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Try the extra challenge" }).click();
  await expect(page.getByText("CURRENT ORDER")).toBeVisible();
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
  await teacher.getByText("Teacher development login").click();
  await teacher.getByRole("button", { name: "Teacher login" }).click();
  await expect(
    teacher.getByRole("heading", { name: "Teacher evidence" }),
  ).toBeVisible();
  await expect(teacher.getByText("accepted shipments")).toBeVisible();
  await teacher.close();
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
  await expect(page.getByText("Saved — shipment accepted.")).toBeVisible();
});

test("a second tab takes over and the stale writer cannot ship", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  await startFirstMission(page);
  await expect(page.getByText("CURRENT ORDER")).toBeVisible();

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
  ).toBeVisible();
  const shipmentBefore = Number(
    (await secondTab.locator("header span").innerText()).match(/\d+/)?.[0],
  );

  await fillCanonicalOrder(page);
  await page.getByRole("button", { name: "Ship order" }).click();
  await expect(
    page.getByText(/Not saved — Another tab is editing/),
  ).toBeVisible();

  await fillCanonicalOrder(secondTab);
  await secondTab.getByRole("button", { name: "Ship order" }).click();
  await expect(
    secondTab.getByText(`Shipment ${shipmentBefore + 1} of 5`),
  ).toBeVisible();
  await secondTab.close();
});

test("help dialog traps focus and Escape restores its trigger", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  await startFirstMission(page);
  const trigger = page.getByRole("button", { name: "Open help" });
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
  await expect(page.getByText("CURRENT ORDER")).toBeVisible();
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
  await expect(page.getByText(/Not saved/)).toBeVisible();
  await page.unroute("**/responses");
  await page.reload();
  await expect(page.getByText("Saved shipment restored.")).toBeVisible();
  await expect(
    page.getByText(`Shipment ${shipmentBefore + 1} of 5`),
  ).toBeVisible();
});

test("renders deterministic advanced-mode visual fixtures", async ({
  page,
}) => {
  const states = [
    ["restricted", "Use only:"],
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
  await page.goto("/dev/place-value-factory/states?fixture=map-resume");
  await expect(
    page.getByRole("button", { name: "Resume saved mission" }),
  ).toBeVisible();
  await page.goto("/dev/place-value-factory/states?fixture=map");
  await expect(page.getByText("Complete Level 2 first")).toBeVisible();
  await page.goto("/dev/place-value-factory/states?fixture=progress");
  await expect(page.getByText("Still gathering evidence")).toBeVisible();
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
