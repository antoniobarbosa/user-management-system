import type { User } from "@domain/user/User.js";
import { UserStatus } from "@domain/user/UserStatus.js";

export class SessionValidator {
  static validateCreate(user: User | null): void {
    if (!user) {
      throw new Error("User not found");
    }
    if (user.status === UserStatus.INACTIVE) {
      throw new Error("User is inactive");
    }
  }
}
