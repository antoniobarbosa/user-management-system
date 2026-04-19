import { apiFetch } from "@/services/api";
import type { Session, User } from "@/types/auth";

export async function signUp(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
): Promise<User> {
  return apiFetch<User>("/api/users", {
    method: "POST",
    skipSessionHeader: true,
    body: JSON.stringify({ firstName, lastName, email, password }),
  });
}

export async function signIn(email: string, password: string): Promise<Session> {
  return apiFetch<Session>("/api/auth/signin", {
    method: "POST",
    skipSessionHeader: true,
    body: JSON.stringify({ email, password }),
  });
}

export async function signOut(sessionId: string): Promise<void> {
  await apiFetch<unknown>(`/api/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
}

export async function getUserById(userId: string): Promise<User> {
  return apiFetch<User>(`/api/users/${encodeURIComponent(userId)}`, {
    method: "GET",
  });
}
