import { useSessionStore } from "@/store/sessionStore";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Relative to the Next.js origin; `next.config` rewrites `/api/*` to the backend. */
function resolveUrl(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function handleUnauthorizedResponse(): void {
  if (typeof window === "undefined") return;
  useSessionStore.getState().clearSession();
  if (window.location.pathname !== "/auth") {
    window.location.href = "/auth";
  }
}

export type ApiFetchOptions = RequestInit & {
  /** Omit `x-session-id` (e.g. sign-in / sign-up before a session exists in the store). */
  skipSessionHeader?: boolean;
};

export async function apiFetch<T>(
  path: string,
  init: ApiFetchOptions = {},
): Promise<T> {
  const { skipSessionHeader, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);

  if (!headers.has("Content-Type") && rest.body != null) {
    headers.set("Content-Type", "application/json");
  }

  if (!skipSessionHeader) {
    const sessionId = useSessionStore.getState().sessionId?.trim();
    if (sessionId) {
      headers.set("x-session-id", sessionId);
    }
  }

  const response = await fetch(resolveUrl(path), {
    ...rest,
    credentials: "include",
    headers,
  });

  const text = await response.text();
  let json: unknown = undefined;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      json = text;
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      handleUnauthorizedResponse();
    }
    const message =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : response.statusText || "Request failed";
    throw new ApiError(message, response.status, json);
  }

  return json as T;
}
