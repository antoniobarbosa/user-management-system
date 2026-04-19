import { ValidationError } from "@domain/errors.js";
import type { User } from "@domain/user/User.js";
import { UserStatus } from "@domain/user/UserStatus.js";
import type { CreateUserInput, UpdateUserInput } from "./UserService.js";

export class UserValidator {
  static validateCreate(input: CreateUserInput): void {
    if (!input.firstName?.trim()) {
      throw new ValidationError("First name is required");
    }
    if (!input.lastName?.trim()) {
      throw new ValidationError("Last name is required");
    }
    if (!String(input.email ?? "").trim()) {
      throw new ValidationError("Email is required");
    }
    if (!input.password) {
      throw new ValidationError("Password is required");
    }
    if (input.password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters");
    }
  }

  static validateUpdate(user: User, input: UpdateUserInput): void {
    if (
      user.status === UserStatus.INACTIVE &&
      (input.firstName !== undefined || input.lastName !== undefined)
    ) {
      throw new ValidationError(
        "Cannot update first name or last name for an inactive user",
      );
    }
  }
}
