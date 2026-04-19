import bcrypt from "bcrypt";
import type { User } from "@domain/user/User.js";
import { UserStatus } from "@domain/user/UserStatus.js";
import { UserService } from "@application/user/UserService.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MockUserRepositoryBuilder } from "../../builders/MockUserRepositoryBuilder.js";

describe("UserService.createUser", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  function userServiceWith(
    userRepo: ReturnType<MockUserRepositoryBuilder["build"]>,
  ) {
    return new UserService(userRepo);
  }

  it("sets createdAt and updatedAt to now", async () => {
    const fixedNow = new Date("2026-03-15T10:30:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    const mockRepo = new MockUserRepositoryBuilder()
      .withCreate(async (user: User) => user.duplicate())
      .build();
    const service = userServiceWith(mockRepo);

    const result = await service.createUser({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "secret12",
    });

    expect(result.createdAt).toEqual(fixedNow);
    expect(result.updatedAt).toEqual(fixedNow);

    vi.useRealTimers();
  });

  it("sets status to ACTIVE if not provided", async () => {
    const mockRepo = new MockUserRepositoryBuilder()
      .withCreate(async (user: User) => user.duplicate())
      .build();
    const service = userServiceWith(mockRepo);

    const result = await service.createUser({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "secret12",
    });

    expect(result.status).toBe(UserStatus.ACTIVE);
  });

  it("sets loginsCounter to 0", async () => {
    const mockRepo = new MockUserRepositoryBuilder()
      .withCreate(async (user: User) => user.duplicate())
      .build();
    const service = userServiceWith(mockRepo);

    const result = await service.createUser({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: "secret12",
    });

    expect(result.loginsCounter).toBe(0);
  });

  it("hashes password with bcrypt (hash ≠ plaintext and compare succeeds)", async () => {
    const plaintext = "myPassword1";
    const mockRepo = new MockUserRepositoryBuilder()
      .withCreate(async (user: User) => user.duplicate())
      .build();
    const service = userServiceWith(mockRepo);

    const result = await service.createUser({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
      password: plaintext,
    });

    expect(result.password).toBeDefined();
    expect(result.password).not.toBe(plaintext);
    expect(await bcrypt.compare(plaintext, result.password!)).toBe(true);
  });

  it("delegates validation to UserValidator", async () => {
    const mockRepo = new MockUserRepositoryBuilder().build();
    const service = userServiceWith(mockRepo);

    await expect(
      service.createUser({
        firstName: "",
        lastName: "Doe",
        email: "jane@example.com",
        password: "secret12",
      }),
    ).rejects.toThrow();

    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("rejects invalid email format via Email value object", async () => {
    const mockRepo = new MockUserRepositoryBuilder()
      .withCreate(async (user: User) => user.duplicate())
      .build();
    const service = userServiceWith(mockRepo);

    await expect(
      service.createUser({
        firstName: "Jane",
        lastName: "Doe",
        email: "not-an-email",
        password: "secret12",
      }),
    ).rejects.toThrow("Invalid email format");

    expect(mockRepo.create).not.toHaveBeenCalled();
  });

  it("passes user aggregate with primary email to repository.create", async () => {
    const mockRepo = new MockUserRepositoryBuilder()
      .withCreate(async (user: User) => user.duplicate())
      .build();
    const service = userServiceWith(mockRepo);

    const result = await service.createUser({
      firstName: "Jane",
      lastName: "Doe",
      email: "  Jane@EXAMPLE.com  ",
      password: "secret12",
    });

    expect(mockRepo.create).toHaveBeenCalledTimes(1);
    const passed = mockRepo.create.mock.calls[0][0];
    expect(passed.allEmails).toHaveLength(1);
    expect(passed.allEmails[0].primary).toBe(true);
    expect(passed.allEmails[0].email.toString()).toBe("jane@example.com");
    expect(passed.allEmails[0].userId).toBe(result.id);
  });
});
