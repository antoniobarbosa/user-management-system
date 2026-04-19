import type { FastifyReply } from "fastify";

const IS_PROD = process.env.NODE_ENV === "production";

/** `__Host-` requires Secure and Path=/ (no Domain). Use plain `session` in development over HTTP. */
export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME ?? (IS_PROD ? "__Host-session" : "session");

const COOKIE_SECURE =
  process.env.SESSION_COOKIE_SECURE === "1" ||
  (process.env.SESSION_COOKIE_SECURE !== "0" && IS_PROD);

const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function sessionCookieSerializeOptions(): {
  path: "/";
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  maxAge: number;
} {
  return {
    path: "/",
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
  };
}

export function attachSessionCookie(reply: FastifyReply, sessionId: string): void {
  reply.setCookie(SESSION_COOKIE_NAME, sessionId, sessionCookieSerializeOptions());
}

export function clearSessionCookie(reply: FastifyReply): void {
  reply.clearCookie(SESSION_COOKIE_NAME, {
    path: "/",
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
  });
}
