import { expect, test } from "@playwright/test";

test.beforeEach(async () => {
  expect(
    (await fetch("http://127.0.0.1:3102/__reset", { method: "POST" })).status,
  ).toBe(204);
});

test("logout ends the session, blocks history access and preserves a paused mission's draft", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  await expect(
    page.getByRole("button", { name: "Settings", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /View mission — Level 1:/ }).click();
  await page.locator("#quantity-0").fill("2");
  const missionUrl = page.url();
  const target = await page.locator(".current-order strong").innerText();
  await page.getByRole("button", { name: "Pause mission" }).click();
  await expect(
    page.getByRole("button", { name: "Resume saved mission" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Log out", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/student\/login$/);
  await expect(page.getByLabel("Six-digit PIN")).toHaveValue("");
  await expect(page.getByLabel("Username", { exact: true })).toHaveValue("");
  expect(
    (await page.context().cookies()).some(
      (cookie) => cookie.name === "pvf_session",
    ),
  ).toBe(false);
  expect((await page.request.get("/api/v1/auth/session")).status()).toBe(401);
  expect((await page.request.get("/api/v1/profile")).status()).toBe(401);
  await page.goBack();
  await expect(page).toHaveURL(/\/student\/login$/);
  await expect(
    page.getByRole("button", { name: "Student login" }),
  ).toBeVisible();
  await expect(page.locator(".game-screen, .map-screen")).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Student login" }),
  ).toBeVisible();
  await page.goto(missionUrl);
  await expect(
    page.getByRole("button", { name: "Student login" }),
  ).toBeVisible();
  await page.getByLabel("Username", { exact: true }).fill("ava");
  await page.getByLabel("Six-digit PIN").fill("123456");
  await page.getByRole("button", { name: "Student login" }).click();
  await page.getByRole("button", { name: "Resume saved mission" }).click();
  await expect(page).toHaveURL(missionUrl);
  await page
    .getByRole("button", { name: "Resume mission", exact: true })
    .click();
  await expect(page.locator(".current-order strong")).toHaveText(target);
  await expect(page.locator("#quantity-0")).toHaveValue("2");
});

test("logout can be retried after a network failure and disables competing actions while pending", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  await page.route("**/api/v1/auth/session", (route) =>
    route.request().method() === "DELETE"
      ? route.abort("connectionfailed")
      : route.continue(),
  );
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Could not log out. Please check your connection and try again.",
  );
  await expect(
    page.getByRole("heading", { name: "Factory Map" }),
  ).toBeVisible();
  expect((await page.request.get("/api/v1/auth/session")).status()).toBe(200);
  await page.unroute("**/api/v1/auth/session");
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/v1/auth/session", async (route) => {
    if (route.request().method() === "DELETE") await pending;
    await route.continue();
  });
  await page.getByRole("button", { name: "Log out", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Logging out…" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Progress", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /View mission — Level 1:/ }),
  ).toBeDisabled();
  release();
  await expect(
    page.getByRole("button", { name: "Student login" }),
  ).toBeVisible();
});

test("the removed settings route opens the map for a signed-in student", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Student login" }).click();
  await expect(
    page.getByRole("heading", { name: "Factory Map" }),
  ).toBeVisible();
  await page.goto("/games/place-value-factory/settings");
  await expect(page).toHaveURL(/\/games\/place-value-factory$/);
  await expect(
    page.getByRole("heading", { name: "Factory Map" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Log out", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Factory settings" }),
  ).toHaveCount(0);
});
