"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { UM_SESSION_STORAGE_KEY } from "@/lib/session-constants";
import { removeLegacyUserStorage } from "@/lib/session-storage";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
};

/**
 * `sessionId` lives only in memory (not persisted): the backend may set an HttpOnly cookie
 * on another origin/port, so the browser sends `x-session-id` from this store on API calls.
 * `user` is a persisted profile hint; it is cleared on hydration when there is no session.
 */
type SessionStore = {
  sessionId: string | null;
  user: SessionUser | null;
  setSession: (sessionId: string, user: SessionUser) => void;
  setUser: (user: SessionUser) => void;
  clearSession: () => void;
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      sessionId: null,
      user: null,
      setSession(sessionId, user) {
        set({ sessionId, user });
      },
      setUser(user) {
        set({ user });
      },
      clearSession() {
        set({ sessionId: null, user: null });
        if (typeof document !== "undefined") {
          removeLegacyUserStorage();
        }
      },
    }),
    {
      name: UM_SESSION_STORAGE_KEY,
      version: 3,
      migrate: (persisted) => {
        if (persisted && typeof persisted === "object" && "user" in persisted) {
          return { user: (persisted as { user: SessionUser | null }).user };
        }
        return { user: null };
      },
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
      }),
    },
  ),
);

function clearPersistedUserWithoutSession(): void {
  const { sessionId, user } = useSessionStore.getState();
  if (!sessionId?.trim() && user != null) {
    useSessionStore.setState({ user: null });
    removeLegacyUserStorage();
  }
}

if (typeof window !== "undefined") {
  if (useSessionStore.persist.hasHydrated()) {
    clearPersistedUserWithoutSession();
  } else {
    useSessionStore.persist.onFinishHydration(() => {
      clearPersistedUserWithoutSession();
    });
  }
}

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
