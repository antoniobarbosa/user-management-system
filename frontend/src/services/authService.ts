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
  const data = await apiFetch<{ user: User; session: Session | null }>("/api/users", {
    method: "POST",
    body: JSON.stringify({ firstName, lastName, email, password }),
    skipSessionHeader: true,
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
  return apiFetch<Session>("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipSessionHeader: true,
  });
}

export async function signOut(): Promise<void> {
  await apiFetch<unknown>("/api/sessions/current", {
    method: "DELETE",
  });
}

export async function getMe(): Promise<User> {
  return apiFetch<User>("/api/users/me");
}

export async function getUserById(userId: string): Promise<User> {
  return apiFetch<User>(`/api/users/${encodeURIComponent(userId)}`, {
    method: "GET",
  });
}
