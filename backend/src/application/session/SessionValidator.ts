import { NotFoundError, ValidationError } from "@domain/errors.js";
import type { User } from "@domain/user/User.js";
import { UserStatus } from "@domain/user/UserStatus.js";

export class SessionValidator {
  static validateCreate(user: User | null): asserts user is User {
    if (!user) {
      throw new NotFoundError("User not found");
    }
    if (user.status === UserStatus.INACTIVE) {
      throw new ValidationError("User is inactive");
    }
  }
}
