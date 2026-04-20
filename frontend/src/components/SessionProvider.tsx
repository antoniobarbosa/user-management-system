"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/services/api";
import * as authService from "@/services/authService";
import { useSessionStore, useSessionStoreHydrated } from "@/store/sessionStore";

function httpStatusOf(error: unknown): number | undefined {
  if (error instanceof ApiError) return error.status;
  if (typeof error !== "object" || error === null) return undefined;
  if (!("status" in error)) return undefined;
  const s = (error as { status: unknown }).status;
  return typeof s === "number" ? s : undefined;
}

/**
 * Validates the current session on load via `GET /api/users/me` (cookie + optional
 * `x-session-id`). Covers stale cookies after DB reset, refresh with HttpOnly cookie,
 * and invalid sessions (401 → clear + `/auth`).
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const redirectedRef = useRef(false);
  const storeHydrated = useSessionStoreHydrated();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!storeHydrated) return;

    let cancelled = false;

    void (async () => {
      try {
        const user = await authService.getMe({ suppressAuthRedirect: true });
        if (cancelled) return;
        redirectedRef.current = false;
        useSessionStore.getState().setUser({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      } catch (e: unknown) {
        if (cancelled) return;
        const status = httpStatusOf(e);
        if (status === 401) {
          if (!redirectedRef.current) {
            redirectedRef.current = true;
            useSessionStore.getState().clearSession();
            router.replace("/auth");
          }
          return;
        }
      } finally {
        if (!cancelled) {
          setChecked(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [storeHydrated, router]);

  if (!storeHydrated || !checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800 dark:border-slate-600 dark:border-t-slate-200"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  return <>{children}</>;
}
