import { readSessionIdFromPersistedStore } from "@/lib/session-storage";

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

/** Caminhos relativos à origem do Next.js — o proxy em `next.config` encaminha `/api/*` para o backend. */
function resolveUrl(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function getSessionIdForRequest(): string | null {
  if (typeof window === "undefined") return null;
  return readSessionIdFromPersistedStore();
}

export type ApiFetchOptions = RequestInit & {
  /** Não envia o cabeçalho `x-session-id`. */
  skipSessionHeader?: boolean;
};

export async function apiFetch<T>(
  path: string,
  init: ApiFetchOptions = {},
): Promise<T> {
  const { skipSessionHeader, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);

  if (!skipSessionHeader) {
    const sid = getSessionIdForRequest();
    if (sid) headers.set("x-session-id", sid);
  }

  if (!headers.has("Content-Type") && rest.body != null) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(resolveUrl(path), {
    ...rest,
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
    const message =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : response.statusText || "Pedido falhou";
    throw new ApiError(message, response.status, json);
  }

  return json as T;
}

