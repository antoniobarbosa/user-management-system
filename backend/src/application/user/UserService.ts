import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import type { User } from "@domain/user/User.js";
import type { UserStatus } from "@domain/user/UserStatus.js";

export type CreateUserInput = {
  firstName: string;
  lastName: string;
  password: string;
  status?: UserStatus;
};

export type UpdateUserInput = {
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  loginsCounter?: number;
};

/**
 * Placeholder for TDD red phase; implementation follows in a later PR.
 */
export class UserService {
  constructor(private readonly _userRepository: IUserRepository) {}

  async createUser(_input: CreateUserInput): Promise<User> {
    throw new Error("Not implemented");
  }

  async updateUser(_id: string, _input: UpdateUserInput): Promise<User> {
    throw new Error("Not implemented");
  }

  async findAll(
    _page: number,
    _limit: number,
  ): Promise<{ data: User[]; total: number }> {
    throw new Error("Not implemented");
  }

  async findById(_id: string): Promise<User | null> {
    throw new Error("Not implemented");
  }

  async deleteUser(_id: string): Promise<void> {
    throw new Error("Not implemented");
  }
}
