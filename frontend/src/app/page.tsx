"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as authService from "@/services/authService";
import {
  useSessionStore,
  useSessionStoreHydrated,
} from "@/store/sessionStore";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isHydrated = useSessionStoreHydrated();
  const sessionId = useSessionStore((s) => s.sessionId);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isHydrated) return;
    if (!sessionId?.trim()) {
      router.replace("/auth");
      return;
    }
    void authService
      .getMe()
      .then(() => router.replace("/dashboard"))
      .catch(() => {
        useSessionStore.getState().clearSession();
        router.replace("/auth");
      });
  }, [isHydrated, mounted, router, sessionId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <p className="text-sm text-slate-500 dark:text-slate-400">Redirecting…</p>
    </div>
  );
}
