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
    if (!storeHydrated) {
      console.log("[SessionProvider] aguardando hidratação da store");
      return;
    }

    const { sessionId: sidBefore } = useSessionStore.getState();
    console.log("[SessionProvider] verificando sessão, sessionId?", Boolean(sidBefore?.trim()));

    let cancelled = false;

    void (async () => {
      try {
        const user = await authService.getMe({ suppressAuthRedirect: true });
        if (cancelled) {
          console.log("[SessionProvider] getMe cancelado (unmount)");
          return;
        }
        redirectedRef.current = false;
        useSessionStore.getState().setUser({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        });
        console.log("[SessionProvider] getMe OK, userId:", user.id);
      } catch (e: unknown) {
        if (cancelled) return;
        const status = httpStatusOf(e);
        console.log("[SessionProvider] getMe falhou", { status, e });
        if (status === 401) {
          if (!redirectedRef.current) {
            redirectedRef.current = true;
            useSessionStore.getState().clearSession();
            console.log("[SessionProvider] 401 → router.replace(/auth)");
            router.replace("/auth");
          } else {
            console.log("[SessionProvider] 401 ignorado (redirect já disparado)");
          }
          return;
        }
      } finally {
        if (!cancelled) {
          console.log("[SessionProvider] check concluído, checked=true");
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
