import {
  SESSION_COOKIE_NAME,
  UM_SESSION_STORAGE_KEY,
} from "@/lib/session-constants";

const LEGACY_USER_KEY = "um_user";

/**
 * Reads `sessionId` from `um_session`: Zustand `persist` shape
 * (`{ state: { sessionId, user }, version }`) or legacy `{ id, userId, ... }`.
 */
export function readSessionIdFromPersistedStore(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(UM_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (data && typeof data === "object" && "state" in data) {
      const sid = (data as { state?: { sessionId?: unknown } }).state
        ?.sessionId;
      return typeof sid === "string" && sid.trim() ? sid : null;
    }
    if (data && typeof data === "object" && "id" in data) {
      const sid = (data as { id?: unknown }).id;
      return typeof sid === "string" && sid.trim() ? sid : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function writeSessionIdCookie(sessionId: string): void {
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function clearSessionIdCookie(): void {
  document.cookie = `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function removeLegacyUserStorage(): void {
  try {
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch {
    /* ignore */
  }
}

/** Clears persisted session + cookie (same keys as Zustand `clearSession`). Safe for `api.ts` without importing the store. */
export function clearPersistedSessionAndCookie(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(UM_SESSION_STORAGE_KEY);
    removeLegacyUserStorage();
  } catch {
    /* ignore */
  }
  if (typeof document !== "undefined") clearSessionIdCookie();
}
