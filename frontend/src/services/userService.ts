import { apiFetch } from "@/services/api";
import type { User, UserStatus } from "@/types/auth";

export type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedResponse = {
  data: User[];
  meta: PaginationMeta;
};

const DEFAULT_LIMIT = 6;

export async function getUsers(
  page: number,
  limit: number = DEFAULT_LIMIT,
): Promise<PaginatedResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  return apiFetch<PaginatedResponse>(`/api/users?${params.toString()}`);
}

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  status?: UserStatus;
};

export async function createUser(data: CreateUserInput): Promise<User> {
  return apiFetch<User>("/api/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type UpdateUserInput = {
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  loginsCounter?: number;
};

export async function updateUser(
  id: string,
  data: UpdateUserInput,
): Promise<User> {
  return apiFetch<User>(`/api/users/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await apiFetch<unknown>(`/api/users/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
