"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useSessionStore,
  useSessionStoreHydrated,
} from "@/store/sessionStore";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isHydrated = useSessionStoreHydrated();
  const isAuthenticated = useSessionStore((s) => s.sessionId !== null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isHydrated) return;
    router.replace(isAuthenticated ? "/dashboard" : "/auth");
  }, [isAuthenticated, isHydrated, mounted, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-sm text-slate-500">A redirecionar…</p>
    </div>
  );
}
