import type { CreateUserInput } from "@application/user/UserService.js";
import { UserValidator } from "@application/user/UserValidator.js";
import { describe, expect, it } from "vitest";

describe("UserValidator.validateCreate", () => {
  it.each([
    {
      firstName: "",
      lastName: "Doe",
      email: "jane@example.com",
      password: "secret12",
      error: "First name is required",
    },
    {
      firstName: "   ",
      lastName: "Doe",
      email: "jane@example.com",
      password: "secret12",
      error: "First name is required",
    },
    {
      firstName: "Jane",
      lastName: "",
      email: "jane@example.com",
      password: "secret12",
      error: "Last name is required",
    },
    {
      firstName: "Jane",
      lastName: "  \t ",
      email: "jane@example.com",
      password: "secret12",
      error: "Last name is required",
    },
    {
      firstName: "Jane",
      lastName: "Doe",
      email: "",
      password: "secret12",
      error: "Email is required",
    },
    {
      firstName: "Jane",
      lastName: "Doe",
      email: "   ",
      password: "secret12",
      error: "Email is required",
    },
    {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "",
      error: "Password is required",
    },
    {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "12345",
      error: "Password must be at least 6 characters",
    },
  ] as const)(
    "throws $error",
    ({ firstName, lastName, email, password, error }) => {
      expect(() =>
        UserValidator.validateCreate({
          firstName,
          lastName,
          email,
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
        email: "jane@example.com",
        password: "secret12",
      }),
    ).not.toThrow();
  });
});
