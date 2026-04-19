import type { User } from "@domain/user/User.js";
import { UserStatus } from "@domain/user/UserStatus.js";
import type { CreateUserInput, UpdateUserInput } from "./UserService.js";

export class UserValidator {
  static validateCreate(input: CreateUserInput): void {
    if (!input.firstName?.trim()) {
      throw new Error("First name is required");
    }
    if (!input.lastName?.trim()) {
      throw new Error("Last name is required");
    }
    if (!String(input.email ?? "").trim()) {
      throw new Error("Email is required");
    }
    if (!input.password) {
      throw new Error("Password is required");
    }
    if (input.password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }
  }

  static validateUpdate(user: User, input: UpdateUserInput): void {
    if (
      user.status === UserStatus.INACTIVE &&
      (input.firstName !== undefined || input.lastName !== undefined)
    ) {
      throw new Error(
        "Cannot update first name or last name for an inactive user",
      );
    }
  }
}
