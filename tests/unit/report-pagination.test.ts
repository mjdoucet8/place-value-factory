import { expect, it } from "vitest";
import { reportPage } from "../../apps/server/src/report-pagination.js";
import { parseReportQueryV2 } from "../../packages/contracts/src/index.js";

it("paginates a stable roster exactly and rejects other contexts, changed revisions and invented keys", () => {
  const rows = ["a", "b", "c", "d", "e"];
  const input = {
    cursor: null,
    viewRevision: null,
    revision: "fixture",
    binding: ["teacher", "class", "filters", 2],
    limit: 2,
  };
  const first = reportPage(rows, (s) => s, input);
  const second = reportPage(rows, (s) => s, {
    ...input,
    cursor: first.nextCursor,
  });
  const third = reportPage(rows, (s) => s, {
    ...input,
    cursor: second.nextCursor,
  });
  expect([...first.items, ...second.items, ...third.items]).toEqual(rows);
  expect(third.nextCursor).toBeNull();
  expect(() =>
    reportPage(rows, (s) => s, {
      ...input,
      cursor: first.nextCursor,
      binding: ["other-teacher"],
    }),
  ).toThrow("INVALID_INPUT");
  expect(() =>
    reportPage(rows, (s) => s, {
      ...input,
      cursor: first.nextCursor,
      revision: "changed",
    }),
  ).toThrow("REPORT_CHANGED");
  expect(() =>
    reportPage(["z"], (s) => s, { ...input, cursor: first.nextCursor }),
  ).toThrow("INVALID_INPUT");
  expect(parseReportQueryV2(new URLSearchParams(), true)).toEqual({
    limit: 25,
    cursor: null,
    viewRevision: null,
    includeTransfer: false,
  });
  expect(() =>
    parseReportQueryV2(new URLSearchParams("limit=101"), true),
  ).toThrow();
});
