import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const REQUEST_HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

const RESPONSE_HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

function backendBaseUrl(): string {
  const raw = process.env.API_URL?.trim();
  if (!raw) {
    throw new Error(
      "Set API_URL (e.g. API_URL=http://localhost:3001) for the /api proxy.",
    );
  }
  return raw.replace(/\/$/, "");
}

function buildTargetUrl(pathSegments: string[], search: string): string {
  const joined =
    pathSegments.length > 0
      ? pathSegments.map((s) => encodeURIComponent(s)).join("/")
      : "";
  const suffix = joined ? `/api/${joined}` : "/api";
  return `${backendBaseUrl()}${suffix}${search}`;
}

function forwardRequestHeaders(incoming: Headers): Headers {
  const out = new Headers();
  incoming.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (REQUEST_HOP_BY_HOP.has(lower)) return;
    if (lower === "host") return;
    out.append(key, value);
  });
  return out;
}

function forwardResponseHeaders(upstream: Headers): Headers {
  const out = new Headers();
  const withSetCookie = upstream as Headers & {
    getSetCookie?: () => string[];
  };
  const setCookies =
    typeof withSetCookie.getSetCookie === "function"
      ? withSetCookie.getSetCookie()
      : [];
  for (const cookie of setCookies) {
    out.append("set-cookie", cookie);
  }
  upstream.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "set-cookie") return;
    if (RESPONSE_HOP_BY_HOP.has(lower)) return;
    if (lower === "content-length") return;
    out.append(key, value);
  });
  return out;
}

async function resolvePathSegments(
  params: Promise<{ path?: string[] }> | { path?: string[] },
): Promise<string[]> {
  const resolved = await Promise.resolve(params);
  return resolved.path ?? [];
}

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> {
  const pathSegments = await resolvePathSegments(context.params);
  const targetUrl = buildTargetUrl(pathSegments, request.nextUrl.search);

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers: forwardRequestHeaders(request.headers),
  };

  if (request.method !== "GET" && request.method !== "HEAD" && request.body) {
    init.body = request.body;
    init.duplex = "half";
  }

  const upstream = await fetch(targetUrl, init);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: forwardResponseHeaders(upstream.headers),
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;
export const HEAD = proxy;
