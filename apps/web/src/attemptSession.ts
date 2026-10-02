import { api, ApiError } from "./api.js";

const claims = new Map<string, Promise<any>>();
const attemptPath = (id: string) => `/games/place-value-factory/attempts/${id}`;
const saveRetryError = (error: ApiError) =>
  new ApiError(
    "Your progress is safe. Please try that action again.",
    error.code,
    error.status,
  );
const changed = (error: unknown) =>
  error instanceof ApiError &&
  ["LEASE_LOST", "REVISION_CONFLICT"].includes(error.code);

/** Claim only on arrival, focus or a student action, never from a background heartbeat. */
export function claimAttempt(attemptId: string, tabId: string): Promise<any> {
  const key = `${attemptId}:${tabId}`;
  const existing = claims.get(key);
  if (existing) return existing;
  const claim = (async () => {
    for (let retry = 0; ; retry++) {
      const current = await api(attemptPath(attemptId));
      if (
        current.writerTabId === tabId &&
        Date.parse(current.leaseExpiresAt) > Date.now()
      )
        return current;
      const commandId = crypto.randomUUID();
      try {
        const result = await api(`${attemptPath(attemptId)}/lease/takeover`, {
          method: "POST",
          headers: { "idempotency-key": commandId },
          body: JSON.stringify({
            commandId,
            tabId,
            expectedRevision: current.revision,
            leaseEpoch: current.leaseEpoch,
          }),
        });
        return result.snapshot;
      } catch (error) {
        if (!changed(error)) throw error;
        if (retry >= 2) throw saveRetryError(error as ApiError);
      }
    }
  })().finally(() => claims.delete(key));
  claims.set(key, claim);
  return claim;
}

/** Replay the original receipt first. Rebase only an explicitly rejected command,
 * keeping its order ID and saving a fresh command key/payload before sending. */
export async function sendAttemptCommand(
  path: string,
  options: RequestInit,
  tabId: string,
  onRebase?: (payload: any) => Promise<void>,
) {
  let payload = JSON.parse(String(options.body));
  const match = path.match(/\/attempts\/([^/]+)(?:\/orders\/([^/]+))?/);
  for (let retry = 0; ; retry++) {
    try {
      const headers = new Headers(options.headers);
      headers.set("idempotency-key", payload.commandId);
      return await api(path, {
        ...options,
        headers,
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (!match || !changed(error)) throw error;
      if (retry >= 2) throw saveRetryError(error as ApiError);
      const current = await claimAttempt(match[1], tabId);
      if (match[2] && current.activeOrder?.id !== match[2])
        throw new ApiError(
          "This order has already moved forward. Loading your saved progress.",
          "ORDER_NOT_ACTIVE",
          409,
        );
      payload = {
        ...payload,
        commandId: crypto.randomUUID(),
        tabId,
        expectedRevision: current.revision,
        leaseEpoch: current.leaseEpoch,
      };
      await onRebase?.(payload);
    }
  }
}
