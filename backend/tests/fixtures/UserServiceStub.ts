import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import type { User } from "@domain/user/User.js";

/**
 * Stub for PR1 (tests only, red). PR `feat/user-service-impl` replaces this with
 * `src/application/user/UserService.ts` and tests import `@application/user/UserService.js`.
 */
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
