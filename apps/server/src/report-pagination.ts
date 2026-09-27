import { createHash } from "node:crypto";
import type { Attempt } from "./index.js";

export const fingerprint = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export function reportRevision(attempts: Attempt[], metadata: unknown) {
  return fingerprint([
    metadata,
    attempts
      .map((a) => [
        a.id,
        a.revision,
        a.reportFactRevision ?? null,
        ...(a.reportCounts ?? [
          a.responses.length,
          a.supportEvents.length,
          a.evidence.length,
        ]),
        a.completed,
        a.transferStar,
      ])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
  ]);
}
export function reportPage<T>(
  items: T[],
  key: (item: T) => string,
  input: {
    cursor: string | null;
    viewRevision: string | null;
    revision: string;
    binding: unknown;
    limit: number;
  },
) {
  const binding = fingerprint(input.binding);
  let last: string | null = null;
  if (input.cursor) {
    let value: any;
    try {
      value = JSON.parse(
        Buffer.from(input.cursor, "base64url").toString("utf8"),
      );
    } catch {
      throw new Error("INVALID_INPUT");
    }
    if (
      !value ||
      Object.keys(value).sort().join() !== "binding,last,revision" ||
      value.binding !== binding ||
      typeof value.last !== "string" ||
      typeof value.revision !== "string"
    )
      throw new Error("INVALID_INPUT");
    if (value.revision !== input.revision) throw new Error("REPORT_CHANGED");
    last = value.last;
  }
  if (input.viewRevision && input.viewRevision !== input.revision)
    throw new Error("REPORT_CHANGED");
  const index =
    last === null ? -1 : items.findIndex((item) => key(item) === last);
  if (last !== null && index < 0) throw new Error("INVALID_INPUT");
  const page = items.slice(index + 1, index + 1 + input.limit);
  return {
    items: page,
    nextCursor:
      index + 1 + page.length < items.length
        ? Buffer.from(
            JSON.stringify({
              binding,
              revision: input.revision,
              last: key(page.at(-1)!),
            }),
          ).toString("base64url")
        : null,
  };
}
