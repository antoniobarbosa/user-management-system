import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import type { User } from "@domain/user/User.js";

/** Temporary stub for TDD red phase; replace with `src/application/user/UserService`. */
export class UserService {
  constructor(public readonly userRepository: IUserRepository) {}

  async createUser(
    _input: { firstName: string; lastName: string },
  ): Promise<User> {
    return {} as User;
  }

  async updateUser(
    _id: string,
    _input: { firstName?: string; lastName?: string },
  ): Promise<User> {
    return {} as User;
  }
}
