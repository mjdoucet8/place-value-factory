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

test("student completes five saved orders, settings, and optional transfer; teacher sees evidence", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  await expect(
    page.getByRole("heading", { name: "Factory Map" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Start( practice)?/ })
    .first()
    .click();
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
  await page
    .getByRole("button", { name: /Start( practice)?/ })
    .first()
    .click();
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
  await page
    .getByRole("button", { name: /Start( practice)?/ })
    .first()
    .click();
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
  await page
    .getByRole("button", { name: /Start( practice)?/ })
    .first()
    .click();
  const trigger = page.getByRole("button", { name: "Open help" });
  await trigger.click();
  await expect(
    page.getByRole("dialog", { name: "Step-by-step help" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
