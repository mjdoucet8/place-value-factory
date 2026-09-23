import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("teacher issues access, student ships, and teacher reviews and revokes it", async ({
  page,
  browser,
}) => {
  const credentialsPath = process.env.PVF_PILOT_CREDENTIALS;
  if (
    !credentialsPath?.match(
      /^\/tmp\/pvf-pilot-[A-Za-z0-9]+\/pilot-private.json$/,
    )
  )
    throw new Error(
      "Use private credentials from the isolated local pilot launcher.",
    );
  const credentials = JSON.parse(await readFile(credentialsPath, "utf8"));
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  await page.goto("/");
  await page.locator("summary").filter({ hasText: "Teacher login" }).click();
  await page.getByLabel("Teacher username").fill(credentials.username);
  await page.getByLabel("Teacher password").fill(credentials.password);
  await page
    .getByRole("button", { name: "Teacher login", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Teacher evidence" }),
  ).toBeVisible();
  const className = `Fictional Pilot ${Date.now()}`;
  await page.getByLabel("New class name").fill(className);
  await page.getByRole("button", { name: "Create class", exact: true }).click();
  await expect(page.getByLabel("Class", { exact: true })).toContainText(
    className,
  );
  await page.getByLabel("Student alias").fill("Pilot Learner");
  await page.getByLabel("Student username").fill("pilot-learner");
  await page.getByRole("button", { name: "Issue student access" }).click();
  await expect(page.locator(".access-issued strong")).toHaveText(/^\d{6}$/);
  const pin = await page.locator(".access-issued strong").innerText();
  const code = await page
    .getByText("Class code:")
    .locator("strong")
    .innerText();
  await page.getByRole("button", { name: "Hide PIN" }).click();
  await page.screenshot({
    path: "test-results/pilot-teacher.png",
    fullPage: true,
  });
  const student = await browser.newPage({
    viewport: { width: 1366, height: 768 },
  });
  student.on("pageerror", (error) => consoleErrors.push(error.message));
  await student.goto("/");
  await student.getByLabel("Class code").fill(code);
  await student.getByLabel("Username", { exact: true }).fill("pilot-learner");
  await student.getByLabel("Six-digit PIN").fill(pin);
  await student.getByRole("button", { name: "Student login" }).click();
  await expect(
    student.getByRole("heading", { name: "Factory Map" }),
  ).toBeVisible();
  await student.screenshot({
    path: "test-results/pilot-map.png",
    fullPage: true,
  });
  await student
    .getByRole("button", { name: /View mission|Replay mission/ })
    .first()
    .click();
  await student
    .getByRole("button", { name: /Start mission|Replay level/ })
    .click();
  await expect(student.getByText("CURRENT ORDER")).toBeVisible();
  await student.screenshot({
    path: "test-results/pilot-gameplay.png",
    fullPage: true,
  });
  for (let slot = 0; slot < 5; slot++) {
    let remaining = Number(
      (await student.locator(".current-order strong").innerText()).replaceAll(
        ",",
        "",
      ),
    );
    for (const [index, value] of [100000, 10000, 1000, 100, 10, 1].entries()) {
      const amount = Math.floor(remaining / value);
      remaining %= value;
      await student.locator(`#quantity-${index}`).fill(String(amount));
    }
    await student
      .getByRole("button", { name: "Ship order", exact: true })
      .click();
    if (slot < 4)
      await expect(student.getByText(`Order ${slot + 2} of 5`)).toBeVisible();
  }
  await expect(
    student.getByRole("heading", { name: "Level complete!" }),
  ).toBeVisible();
  await student.reload();
  await expect(
    student.getByRole("heading", { name: "Level complete!" }),
  ).toBeVisible();
  await student.screenshot({
    path: "test-results/pilot-results.png",
    fullPage: true,
  });
  await page.reload();
  await page
    .getByLabel("Class", { exact: true })
    .selectOption({ label: className });
  await expect(
    page.getByText("5 submitted orders · 5 accepted shipments"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Revoke access for Pilot Learner" })
    .click();
  await expect(
    page.getByText("Access revoked. Previous sessions have ended."),
  ).toBeVisible();
  await student.reload();
  await expect(
    student.getByRole("button", { name: "Student login" }),
  ).toBeVisible();
  expect(consoleErrors).toEqual([]);
  await student.close();
});
