import { ApiError, apiFetch } from "@/services/api";
import type { Session, User } from "@/types/auth";

export type SignUpResult = {
  user: User;
  session: Session;
};

export async function signUp(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): Promise<SignUpResult> {
  console.log("[authService.signUp] início POST /api/users", { email, firstName, lastName });
  const data = await apiFetch<{ user: User; session: Session | null }>("/api/users", {
    method: "POST",
    body: JSON.stringify({ firstName, lastName, email, password }),
    skipSessionHeader: true,
  });
  console.log("[authService.signUp] resposta", {
    userId: data.user?.id,
    sessionId: data.session?.id ?? null,
  });
  if (!data.session) {
    throw new ApiError(
      "Account created but no session is available. Please sign in.",
      201,
      data,
    );
  }
  return { user: data.user, session: data.session };
}

export async function signIn(email: string, password: string): Promise<Session> {
  console.log("[authService.signIn] início POST /api/auth/signin", { email });
  const session = await apiFetch<Session>("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipSessionHeader: true,
  });
  console.log("[authService.signIn] ok", { sessionId: session.id, userId: session.userId });
  return session;
}

export async function signOut(): Promise<void> {
  console.log("[authService.signOut] DELETE /api/sessions/current");
  await apiFetch<unknown>("/api/sessions/current", {
    method: "DELETE",
  });
  console.log("[authService.signOut] concluído");
}

export async function getMe(options?: {
  suppressAuthRedirect?: boolean;
}): Promise<User> {
  console.log("[authService.getMe] GET /api/users/me", {
    suppressAuthRedirect: options?.suppressAuthRedirect,
  });
  const user = await apiFetch<User>("/api/users/me", {
    suppressAuthRedirect: options?.suppressAuthRedirect,
  });
  console.log("[authService.getMe] ok", { userId: user.id });
  return user;
}

export async function getUserById(userId: string): Promise<User> {
  return apiFetch<User>(`/api/users/${encodeURIComponent(userId)}`, {
    method: "GET",
  });
}
