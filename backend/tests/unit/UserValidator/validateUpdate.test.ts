import type { UpdateUserInput } from "@application/user/UserService.js";
import { UserValidator } from "@application/user/UserValidator.js";
import { UserStatus } from "@domain/user/UserStatus.js";
import { describe, expect, it } from "vitest";
import { UserBuilder } from "../../builders/UserBuilder.js";

describe("UserValidator.validateUpdate", () => {
  it.each([
    {
      description: "throws if inactive and firstName provided",
      user: () => UserBuilder.anInactiveUser().build(),
      input: { firstName: "Changed" } satisfies UpdateUserInput,
      expectThrow: true,
    },
    {
      description: "throws if inactive and lastName provided",
      user: () => UserBuilder.anInactiveUser().build(),
      input: { lastName: "Changed" } satisfies UpdateUserInput,
      expectThrow: true,
    },
    {
      description: "does not throw if inactive and only status provided",
      user: () => UserBuilder.anInactiveUser().build(),
      input: { status: UserStatus.ACTIVE } satisfies UpdateUserInput,
      expectThrow: false,
    },
    {
      description: "does not throw if inactive and only loginsCounter provided",
      user: () => UserBuilder.anInactiveUser().withLoginsCounter(1).build(),
      input: { loginsCounter: 42 } satisfies UpdateUserInput,
      expectThrow: false,
    },
    {
      description: "does not throw if active and firstName provided",
      user: () => UserBuilder.aUser().build(),
      input: { firstName: "New" } satisfies UpdateUserInput,
      expectThrow: false,
    },
  ])("$description", ({ user, input, expectThrow }) => {
    const u = user();
    if (expectThrow) {
      expect(() => UserValidator.validateUpdate(u, input)).toThrow(
        "Cannot update first name or last name for an inactive user",
      );
    } else {
      expect(() => UserValidator.validateUpdate(u, input)).not.toThrow();
    }
  });
});
