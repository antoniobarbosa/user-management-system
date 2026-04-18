import type { CreateUserInput } from "@application/user/UserService.js";
import { UserValidator } from "@application/user/UserValidator.js";
import { describe, expect, it } from "vitest";

describe("UserValidator.validateCreate", () => {
  it.each([
    {
      firstName: "",
      lastName: "Doe",
      password: "secret12",
      error: "First name is required",
    },
    {
      firstName: "   ",
      lastName: "Doe",
      password: "secret12",
      error: "First name is required",
    },
    {
      firstName: "Jane",
      lastName: "",
      password: "secret12",
      error: "Last name is required",
    },
    {
      firstName: "Jane",
      lastName: "  \t ",
      password: "secret12",
      error: "Last name is required",
    },
    {
      firstName: "Jane",
      lastName: "Doe",
      password: "",
      error: "Password is required",
    },
    {
      firstName: "Jane",
      lastName: "Doe",
      password: "12345",
      error: "Password must be at least 6 characters",
    },
  ] as const)(
    "throws $error",
    ({ firstName, lastName, password, error }) => {
      expect(() =>
        UserValidator.validateCreate({
          firstName,
          lastName,
          password,
        } as CreateUserInput),
      ).toThrow(error);
    },
  );

  it("does not throw if all inputs are valid", () => {
    expect(() =>
      UserValidator.validateCreate({
        firstName: "Jane",
        lastName: "Doe",
        password: "secret12",
      }),
    ).not.toThrow();
  });
});
