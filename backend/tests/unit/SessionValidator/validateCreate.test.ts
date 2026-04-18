import { SessionValidator } from "@application/session/SessionValidator.js";
import type { User } from "@domain/user/User.js";
import { UserStatus } from "@domain/user/UserStatus.js";
import { describe, expect, it } from "vitest";
import { UserBuilder } from "../../builders/UserBuilder.js";

describe("SessionValidator.validateCreate", () => {
  it.each([
    {
      description: "throws User not found if user is null",
      user: (): User | null => null,
      expectThrow: true,
      message: "User not found",
    },
    {
      description: "throws User is inactive if user status is INACTIVE",
      user: (): User | null => UserBuilder.anInactiveUser().build(),
      expectThrow: true,
      message: "User is inactive",
    },
    {
      description: "does not throw if user is ACTIVE",
      user: (): User | null =>
        UserBuilder.aUser().withStatus(UserStatus.ACTIVE).build(),
      expectThrow: false,
      message: null,
    },
  ])("$description", ({ user, expectThrow, message }) => {
    const u = user();
    if (expectThrow) {
      expect(() => SessionValidator.validateCreate(u)).toThrow(message!);
    } else {
      expect(() => SessionValidator.validateCreate(u)).not.toThrow();
    }
  });
});
