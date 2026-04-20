"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/services/api";
import * as authService from "@/services/authService";
import {
  useSessionStore,
  useSessionStoreHydrated,
} from "@/store/sessionStore";

type Mode = "signin" | "signup";

type ServerSessionProbe = "pending" | "none" | "present";

async function establishSession(email: string, password: string) {
  console.log("[auth/establishSession] 1) signIn");
  const session = await authService.signIn(email, password);
  console.log("[auth/establishSession] 2) setSession na store", { sessionId: session.id });
  useSessionStore.getState().setSession(session.id, {
    id: session.userId,
    firstName: "",
    lastName: "",
  });
  console.log("[auth/establishSession] 3) getMe");
  const user = await authService.getMe();
  console.log("[auth/establishSession] 4) setUser na store", { userId: user.id });
  useSessionStore.getState().setUser({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
  });
}

export default function AuthPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isHydrated = useSessionStoreHydrated();
  const [serverSession, setServerSession] =
    useState<ServerSessionProbe>("pending");
  const sessionId = useSessionStore((s) => s.sessionId);
  const sessionUser = useSessionStore((s) => s.user);
  const [mode, setMode] = useState<Mode>("signup");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isHydrated) return;
    const { sessionId: sid, user } = useSessionStore.getState();
    if (!sid?.trim() && !user?.id) {
      setServerSession("none");
      return;
    }
    let cancelled = false;
    setServerSession("pending");
    console.log("[auth/probe] sessão existente na store → getMe (redirect se OK)");
    void authService
      .getMe()
      .then(() => {
        if (cancelled) return;
        console.log("[auth/probe] getMe OK → /dashboard");
        setServerSession("present");
        router.replace("/dashboard");
      })
      .catch((err) => {
        if (cancelled) return;
        console.log("[auth/probe] getMe falhou, clearSession", err);
        useSessionStore.getState().clearSession();
        setServerSession("none");
      });
    return () => {
      cancelled = true;
    };
  }, [mounted, isHydrated, sessionId, sessionUser?.id, router]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    console.log("[auth/handleSignIn] submit", { email });
    try {
      await establishSession(email, password);
      console.log("[auth/handleSignIn] router.replace(/dashboard)");
      router.replace("/dashboard");
    } catch (err) {
      console.log("[auth/handleSignIn] erro", err);
      setError(err instanceof ApiError ? err.message : "Could not sign in.");
    } finally {
      setPending(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      console.log("[auth/handleSignUp] passwords não coincidem");
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    console.log("[auth/handleSignUp] submit", { email, firstName, lastName });
    try {
      const { user, session } = await authService.signUp(
        firstName,
        lastName,
        email,
        password,
      );
      console.log("[auth/handleSignUp] signUp OK → setSession", {
        userId: user.id,
        sessionId: session.id,
      });
      useSessionStore.getState().setSession(session.id, {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      });
      console.log("[auth/handleSignUp] router.replace(/dashboard)");
      router.replace("/dashboard");
    } catch (err) {
      console.log("[auth/handleSignUp] erro", err);
      setError(err instanceof ApiError ? err.message : "Could not create account.");
    } finally {
      setPending(false);
    }
  }

  if (
    !mounted ||
    !isHydrated ||
    serverSession === "pending" ||
    serverSession === "present"
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-16 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            User management
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {mode === "signin"
              ? "Sign in to continue"
              : "Create an account to get started"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-8 shadow-sm shadow-slate-200/60 dark:border-slate-700 dark:bg-slate-900 dark:shadow-slate-950/40">
          <div className="mb-6 flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            <button
              type="button"
              data-testid="auth-tab-signin"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === "signin"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              data-testid="auth-tab-signup"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                mode === "signup"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
              }`}
            >
              Sign up
            </button>
          </div>

          {error ? (
            <div
              role="alert"
              data-testid="auth-error"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            >
              {error}
            </div>
          ) : null}

          {mode === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-4" data-testid="sign-in-form">
              <div>
                <label htmlFor="signin-email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <input
                  id="signin-email"
                  data-testid="sign-in-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-400 transition placeholder:text-slate-400 focus:border-slate-300 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-600"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label htmlFor="signin-password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <input
                  id="signin-password"
                  data-testid="sign-in-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none ring-slate-400 transition focus:border-slate-300 focus:ring-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-600"
                />
              </div>
              <button
                type="submit"
                data-testid="sign-in-submit"
                disabled={pending}
                className="mt-2 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {pending ? "Signing in…" : "Sign in"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4" data-testid="sign-up-form">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="su-fn" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    First name
                  </label>
                  <input
                    id="su-fn"
                    data-testid="sign-up-first-name"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-600"
                  />
                </div>
                <div>
                  <label htmlFor="su-ln" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Last name
                  </label>
                  <input
                    id="su-ln"
                    data-testid="sign-up-last-name"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-600"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="su-email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <input
                  id="su-email"
                  data-testid="sign-up-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-600"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label htmlFor="su-pw" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <input
                  id="su-pw"
                  data-testid="sign-up-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-600"
                />
              </div>
              <div>
                <label htmlFor="su-pw2" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Confirm password
                </label>
                <input
                  id="su-pw2"
                  data-testid="sign-up-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-600"
                />
              </div>
              <button
                type="submit"
                data-testid="sign-up-submit"
                disabled={pending}
                className="mt-2 w-full rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {pending ? "Creating account…" : "Create account"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link
            href="/"
            className="font-medium text-slate-700 underline-offset-4 hover:underline dark:text-slate-300"
          >
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
