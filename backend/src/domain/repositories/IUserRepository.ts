import type { PaginationMeta } from "../shared/buildPaginationMeta.js";
import type { User } from "../user/User.js";

export interface IUserRepository {
  create(user: User): Promise<User>;
  findAll(
    page: number,
    limit: number,
  ): Promise<{ data: User[]; meta: PaginationMeta }>;
  findById(id: string): Promise<User | null>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
