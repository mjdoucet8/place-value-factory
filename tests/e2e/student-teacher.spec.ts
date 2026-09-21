import { expect, test, type Page } from "@playwright/test";

async function fillCanonicalOrder(page: Page) {
  const target = Number(
    (await page.locator(".current-order strong").innerText()).replace(/,/g, ""),
  );
  let remainder = target;
  for (const [index, value] of [100000, 10000, 1000, 100, 10, 1].entries()) {
    const quantity = Math.floor(remainder / value);
    remainder %= value;
    await page.locator(`#quantity-${index}`).fill(String(quantity));
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
    .getByRole("button", { name: "Start", exact: true })
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
