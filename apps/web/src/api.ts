let csrfToken = "";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Authentication is cookie-based; actor IDs are never credentials. */
export async function api(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  headers.set("content-type", "application/json");
  headers.delete("x-session");
  if (csrfToken && !["GET", "HEAD"].includes(options.method ?? "GET"))
    headers.set("x-csrf-token", csrfToken);
  const response = await fetch(`/api/v1${path}`, {
    ...options,
    credentials: "same-origin",
    headers,
  });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok)
    throw new ApiError(
      body?.error?.message ?? "Request failed",
      body?.error?.code ?? "REQUEST_FAILED",
      response.status,
    );
  if (body?.csrfToken) csrfToken = body.csrfToken;
  if (path === "/auth/session" && options.method === "DELETE") csrfToken = "";
  return body;
}
