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
  await expect(student.getByText("CURRENT ORDER", { exact: true })).toBeVisible();
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
    if (slot === 0) {
      await student.route("**/responses", (route) =>
        route.abort("connectionfailed"),
      );
      await student.getByRole("button", { name: "Ship order" }).click();
      await expect(
        student.getByRole("button", { name: "Try saving again" }),
      ).toBeVisible();
      await student.unroute("**/responses");
      await student.reload();
      await expect(student.getByText("Order 2 of 5")).toBeVisible();
      await student
        .getByRole("button", { name: "Take over this attempt" })
        .click();
      continue;
    }
    if (slot === 1) {
      await student.route("**/responses", async (route) => {
        await route.fetch();
        await route.abort("connectionfailed");
      });
      await student.getByRole("button", { name: "Ship order" }).click();
      await expect(
        student.getByRole("button", { name: "Try saving again" }),
      ).toBeVisible();
      await student.unroute("**/responses");
      await student.getByRole("button", { name: "Try saving again" }).click();
      await expect(student.getByText("Order 3 of 5")).toBeVisible();
      continue;
    }
    if (slot === 4) {
      await student.route("**/responses", async (route) => {
        await route.fetch();
        await route.abort("connectionfailed");
      });
      await student.getByRole("button", { name: "Ship order" }).click();
      await expect(
        student.getByRole("button", { name: "Try saving again" }),
      ).toBeVisible();
      await student.unroute("**/responses");
      await student.reload();
      await expect(
        student.getByRole("heading", { name: "Level complete!" }),
      ).toBeVisible();
      continue;
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
  await page.getByRole("button", { name: "View evidence for Pilot Learner" }).click();
  await expect(page.getByText("5 submitted orders · 5 accepted shipments")).toBeVisible();
  await expect(page.getByRole("table", { name: /Stored question and first\/final answers/ })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "First answer" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Final answer" })).toBeVisible();
  await page.screenshot({ path: "test-results/pilot-teacher-evidence.png", fullPage: true });
  await student.getByRole("button", { name: "Back to map" }).click();
  await expect(student.getByRole("button", { name: /View mission — Level 2/ })).toBeVisible();
  await student.getByRole("button", { name: "Progress" }).click();
  await student.getByRole("button", { name: /^Practice / }).click();
  for (let slot = 0; slot < 5; slot++) {
    let remaining = Number((await student.locator(".current-order strong").innerText()).replaceAll(",", ""));
    for (const [index, value] of [100000, 10000, 1000, 100, 10, 1].entries()) {
      const amount = Math.floor(remaining / value);
      remaining %= value;
      await student.locator(`#quantity-${index}`).fill(String(amount));
    }
    await student.getByRole("button", { name: "Ship order", exact: true }).click();
    if (slot < 4) await expect(student.getByText(`Order ${slot + 2} of 5`)).toBeVisible();
  }
  await expect(student.getByRole("heading", { name: "Great practicing!" })).toBeVisible();
  await expect(student.getByText("Practice builds your skills. Your map stars stay the same.")).toBeVisible();
  await page.reload();
  await page.getByLabel("Class", { exact: true }).selectOption({ label: className });
  await page.getByRole("button",{name:"View evidence for Pilot Learner"}).click();
  await expect(page.getByText("10 submitted orders · 10 accepted shipments")).toBeVisible();
  await student.getByRole("button", { name: "Back to map" }).click();
  await student.getByRole("button", { name: /Replay mission/ }).first().click();
  await expect(student.getByText("CURRENT ORDER", { exact: true })).toBeVisible();
  await student.route("**/responses", (route) => route.abort("connectionfailed"));
  let pendingTarget = Number((await student.locator(".current-order strong").innerText()).replaceAll(",", ""));
  for (const [index, value] of [100000, 10000, 1000, 100, 10, 1].entries()) {
    const amount = Math.floor(pendingTarget / value);
    pendingTarget %= value;
    await student.locator(`#quantity-${index}`).fill(String(amount));
  }
  await student.getByRole("button", { name: "Ship order" }).click();
  await expect(student.getByRole("button", { name: "Try saving again" })).toBeVisible();
  await page.locator("summary").filter({hasText:"Manage student access"}).click();
  await page
    .getByRole("button", { name: "Revoke access for Pilot Learner" })
    .click();
  await expect(
    page.getByText("Access revoked. Previous sessions have ended."),
  ).toBeVisible();
  await student.unroute("**/responses");
  await student.getByRole("button", { name: "Try saving again" }).click();
  await expect(student.getByText(/Your work is waiting to save/)).toBeVisible();
  await page.reload();
  await page.getByLabel("Class", { exact: true }).selectOption({ label: className });
  await page.getByRole("button",{name:"View evidence for Pilot Learner"}).click();
  await expect(page.getByText("10 submitted orders · 10 accepted shipments")).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: `Archive ${className}` }).click();
  await expect(page.getByText(/Class archived\. Student sessions have ended/)).toBeVisible();
  await page.getByRole("button",{name:"View evidence for Pilot Learner"}).click();
  await expect(page.getByText("10 submitted orders · 10 accepted shipments")).toBeVisible();
  await student.reload();
  await expect(
    student.getByRole("button", { name: "Student login" }),
  ).toBeVisible();
  expect(consoleErrors).toEqual([]);
  await student.close();
});
