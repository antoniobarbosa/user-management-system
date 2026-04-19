/**
 * Must match backend `SESSION_COOKIE_NAME` (see `backend/.../sessionCookie.ts`).
 * `__Host-` prefix in production requires Secure + Path=/ (no Domain).
 */
export const SESSION_COOKIE_NAME =
  process.env.NEXT_PUBLIC_SESSION_COOKIE_NAME ??
  (process.env.NODE_ENV === "production" ? "__Host-session" : "session");

/** `localStorage` key for Zustand `persist` in `sessionStore.ts` (user profile only). */
export const UM_SESSION_STORAGE_KEY = "um_session";
