import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import { User } from "@domain/user/User.js";
import { UserStatus } from "@domain/user/UserStatus.js";
import { UserValidator } from "./UserValidator.js";

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

export class UserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async createUser(input: CreateUserInput): Promise<User> {
    UserValidator.validateCreate(input);

    const now = new Date();
    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = new User();
    user.id = randomUUID();
    user.firstName = input.firstName.trim();
    user.lastName = input.lastName.trim();
    user.password = passwordHash;
    user.status = input.status ?? UserStatus.ACTIVE;
    user.loginsCounter = 0;
    user.createdAt = now;
    user.updatedAt = now;

    return this.userRepository.create(user);
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<User> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new Error("User not found");
    }

    UserValidator.validateUpdate(existing, input);

    const now = new Date();
    const inputPatch = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    ) as UpdateUserInput;

    const updated = Object.assign(new User(), existing, inputPatch, {
      createdAt: existing.createdAt,
      updatedAt: now,
      password: existing.password,
    });

    return this.userRepository.update(updated);
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<{ data: User[]; total: number }> {
    return this.userRepository.findAll(page, limit);
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async deleteUser(id: string): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new Error("User not found");
    }
    await this.userRepository.delete(id);
  }
}
