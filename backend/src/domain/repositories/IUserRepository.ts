import type { User } from "../user/User.js";

export type PaginatedUsersMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export interface IUserRepository {
  create(user: User): Promise<User>;
  findAll(
    page: number,
    limit: number,
  ): Promise<{ data: User[]; meta: PaginatedUsersMeta }>;
  findById(id: string): Promise<User | null>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
