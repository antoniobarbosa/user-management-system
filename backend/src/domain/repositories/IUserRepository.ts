import type { User } from "../user/User.js";

export interface IUserRepository {
  create(user: User): Promise<User>;
  findAll(
    page: number,
    limit: number,
  ): Promise<{ data: User[]; total: number }>;
  findById(id: string): Promise<User | null>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
}
