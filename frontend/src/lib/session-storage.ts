import { UM_SESSION_STORAGE_KEY } from "@/lib/session-constants";

const LEGACY_USER_KEY = "um_user";

export function removeLegacyUserStorage(): void {
  try {
    localStorage.removeItem(LEGACY_USER_KEY);
  } catch {
    /* ignore */
  }
}

/** Clears persisted user profile (session id is not stored here — see Zustand store). */
export function clearPersistedUser(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(UM_SESSION_STORAGE_KEY);
    removeLegacyUserStorage();
  } catch {
    /* ignore */
  }
}
