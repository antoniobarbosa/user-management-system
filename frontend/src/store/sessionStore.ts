"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UM_SESSION_STORAGE_KEY } from "@/lib/session-constants";
import {
  clearSessionIdCookie,
  removeLegacyUserStorage,
  writeSessionIdCookie,
} from "@/lib/session-storage";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
};

/** Authenticated when `useSessionStore((s) => s.sessionId !== null)`. */
type SessionStore = {
  sessionId: string | null;
  user: SessionUser | null;
  setSession: (sessionId: string, user: SessionUser) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      sessionId: null,
      user: null,
      setSession(sessionId, user) {
        set({ sessionId, user });
        if (typeof document !== "undefined") writeSessionIdCookie(sessionId);
      },
      clearSession() {
        set({ sessionId: null, user: null });
        if (typeof document !== "undefined") {
          clearSessionIdCookie();
          removeLegacyUserStorage();
        }
      },
    }),
    {
      name: UM_SESSION_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        sessionId: state.sessionId,
        user: state.user,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error || typeof document === "undefined") return;
        if (state?.sessionId) writeSessionIdCookie(state.sessionId);
        else clearSessionIdCookie();
      },
    },
  ),
);

/**
 * Becomes `true` only after the client effect runs — never during SSR.
 * Avoids hydration mismatches between server and the client’s first paint.
 */
export function useSessionStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (useSessionStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useSessionStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
  }, []);
  return hydrated;
}
