import { test, expect } from "@playwright/test";
import { witnessFor } from "../../packages/game-engine/src/index.js";

test("teacher navigates complete evidence by keyboard, retains filters and recovers from report errors", async ({
  page,
}) => {
  test.setTimeout(60_000);
  expect(
    (await fetch("http://127.0.0.1:3102/__reset", { method: "POST" })).status,
  ).toBe(204);
  const request = async (path: string, body?: any) => {
    const response = await fetch(`http://127.0.0.1:3101/api/v1${path}`, {
      method: body ? "POST" : "GET",
      headers: {
        "x-session": "student-ava",
        "content-type": "application/json",
        ...(body?.commandId ? { "idempotency-key": body.commandId } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    expect(response.ok).toBe(true);
    return response.json();
  };
  for (let attempt = 0; attempt < 7; attempt++) {
    const profile = await request("/profile");
    let snapshot = await request("/games/place-value-factory/attempts", {
      commandId: `browser-start-${attempt}`,
      profileRevision: profile.revision,
      tabId: "report-test",
      levelId: "level-1",
      kind: attempt ? "replay" : "path",
    });
    for (let slot = 0; slot < 5; slot++) {
      const result = await request(
        `/games/place-value-factory/attempts/${snapshot.attemptId}/orders/${snapshot.activeOrder.id}/responses`,
        {
          commandId: `browser-answer-${attempt}-${slot}`,
          expectedRevision: snapshot.revision,
          leaseEpoch: snapshot.leaseEpoch,
          tabId: "report-test",
          representationA: witnessFor(snapshot.activeOrder),
        },
      );
      snapshot = result.snapshot;
    }
  }
  await page.goto("/");
  await page.locator("summary").filter({ hasText: "Teacher login" }).click();
  await page
    .getByRole("button", { name: "Teacher login", exact: true })
    .click();
  await expect(
    page.getByRole("table", { name: "Class learning summary", exact: true }),
  ).toBeVisible();
  const session = (await page.context().cookies()).find(
    (cookie) => cookie.name === "pvf_session",
  )!;
  await page.context().clearCookies();
  await page.context().addCookies([{ ...session, path: "/api/v1" }]);
  await page.reload();
  await expect(
    page.getByRole("table", { name: "Class learning summary", exact: true }),
  ).toBeVisible();
  expect(
    (await page.context().cookies())
      .filter((cookie) => cookie.name === "pvf_session")
      .map((cookie) => cookie.path),
  ).toEqual(["/api"]);
  const open = page.getByRole("button", { name: /View evidence for/ });
  await open.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Page 1 · 25 of 35 records/)).toBeVisible();
  const first = await page
    .locator("tr[data-order-id]")
    .evaluateAll((rows) =>
      rows.map((row) => row.getAttribute("data-order-id")),
    );
  const next = page.getByRole("button", { name: "Next evidence page" });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Page 2 · 10 of 35 records/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ava", exact: true }),
  ).toBeFocused();
  const second = await page
    .locator("tr[data-order-id]")
    .evaluateAll((rows) =>
      rows.map((row) => row.getAttribute("data-order-id")),
    );
  expect(new Set([...first, ...second]).size).toBe(35);
  await page.getByRole("button", { name: "Previous evidence page" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText(/Page 1 · 25 of 35 records/)).toBeVisible();
  await page.screenshot({
    path: "/tmp/pvf-reporting-keyboard-wide.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 720 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  ).toBe(true);
  const region = page.getByRole("region", { name: /Stored order evidence/ });
  await region.focus();
  await expect(region).toBeFocused();
  await page.screenshot({
    path: "/tmp/pvf-reporting-keyboard-narrow.png",
    fullPage: true,
  });
  // Explicit fault injection: readable stale-view error and refresh recovery.
  await page.route("**/api/v2/**/evidence?*", (route) =>
    route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "REPORT_CHANGED",
          message:
            "New activity changed this report. Refresh to read the latest evidence from page one.",
        },
      }),
    }),
  );
  await next.click();
  await expect(page.getByRole("alert")).toContainText("New activity");
  await page.unroute("**/api/v2/**/evidence?*");
  await page.getByRole("button", { name: "Refresh report" }).click();
  await open.click();
  await expect(page.getByText(/Page 1 · 25 of 35 records/)).toBeVisible();
  await page.getByLabel("From", { exact: true }).fill("2000-01-01");
  await page.getByLabel("To (exclusive)").fill("2000-01-02");
  await page.getByRole("button", { name: "Apply report filters" }).click();
  await expect(
    page.locator(".report-overview td[data-submitted]").first(),
  ).toHaveText("0");
  await open.click();
  await expect(
    page.getByText("No submitted orders in this date range."),
  ).toBeVisible();
  await expect(page.getByLabel("From", { exact: true })).toHaveValue(
    "2000-01-01",
  );
});
