import type { User } from "@domain/user/User.js";
import { UserStatus } from "@domain/user/UserStatus.js";
import { UserService } from "@application/user/UserService.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MockUserRepositoryBuilder } from "../../builders/MockUserRepositoryBuilder.js";
import { UserBuilder } from "../../builders/UserBuilder.js";

describe("UserService.updateUser", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("throws if user not found", async () => {
    const mockRepo = new MockUserRepositoryBuilder()
      .withFindById(async () => null)
      .build();
    const service = new UserService(mockRepo);

    await expect(
      service.updateUser("missing-id", { firstName: "Nope" }),
    ).rejects.toThrow("User not found");

    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it("throws if user is INACTIVE and firstName is provided", async () => {
    const inactive = UserBuilder.anInactiveUser().build();
    const mockRepo = new MockUserRepositoryBuilder()
      .withFindById(async () => inactive)
      .build();
    const service = new UserService(mockRepo);

    await expect(
      service.updateUser(inactive.id, { firstName: "Changed" }),
    ).rejects.toThrow(
      "Cannot update first name or last name for an inactive user",
    );

    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it("throws if user is INACTIVE and lastName is provided", async () => {
    const inactive = UserBuilder.anInactiveUser().build();
    const mockRepo = new MockUserRepositoryBuilder()
      .withFindById(async () => inactive)
      .build();
    const service = new UserService(mockRepo);

    await expect(
      service.updateUser(inactive.id, { lastName: "Changed" }),
    ).rejects.toThrow(
      "Cannot update first name or last name for an inactive user",
    );

    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  it("never changes createdAt", async () => {
    const createdAt = new Date("2019-05-05T08:00:00.000Z");
    const existing = UserBuilder.aUser()
      .withCreatedAt(createdAt)
      .withUpdatedAt(new Date("2019-05-06T08:00:00.000Z"))
      .build();
    const mockRepo = new MockUserRepositoryBuilder()
      .withFindById(async () => existing)
      .withUpdate(async (user: User) => ({ ...user }))
      .build();
    const service = new UserService(mockRepo);

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const result = await service.updateUser(existing.id, {
      lastName: "NewLast",
    });

    expect(result.createdAt).toEqual(createdAt);

    vi.useRealTimers();
  });

  it("always updates updatedAt to now", async () => {
    const t0 = new Date("2024-01-01T00:00:00.000Z");
    const t1 = new Date("2024-06-01T12:00:00.000Z");
    const existing = UserBuilder.aUser().withUpdatedAt(t0).build();
    const mockRepo = new MockUserRepositoryBuilder()
      .withFindById(async () => existing)
      .withUpdate(async (user: User) => ({ ...user }))
      .build();
    const service = new UserService(mockRepo);

    vi.useFakeTimers();
    vi.setSystemTime(t1);

    const result = await service.updateUser(existing.id, {
      firstName: "Updated",
    });

    expect(result.updatedAt).toEqual(t1);

    vi.useRealTimers();
  });

  it("updates only firstName keeping lastName intact", async () => {
    const existing = UserBuilder.aUser()
      .withFirstName("OldFirst")
      .withLastName("KeepLast")
      .build();
    const mockRepo = new MockUserRepositoryBuilder()
      .withFindById(async () => existing)
      .withUpdate(async (user: User) => ({ ...user }))
      .build();
    const service = new UserService(mockRepo);

    const result = await service.updateUser(existing.id, {
      firstName: "NewFirst",
    });

    expect(result.firstName).toBe("NewFirst");
    expect(result.lastName).toBe("KeepLast");
  });

  it("updates only lastName keeping firstName intact", async () => {
    const existing = UserBuilder.aUser()
      .withFirstName("KeepFirst")
      .withLastName("OldLast")
      .build();
    const mockRepo = new MockUserRepositoryBuilder()
      .withFindById(async () => existing)
      .withUpdate(async (user: User) => ({ ...user }))
      .build();
    const service = new UserService(mockRepo);

    const result = await service.updateUser(existing.id, {
      lastName: "NewLast",
    });

    expect(result.firstName).toBe("KeepFirst");
    expect(result.lastName).toBe("NewLast");
  });

  it("inactive user CAN update status", async () => {
    const inactive = UserBuilder.anInactiveUser().build();
    const mockRepo = new MockUserRepositoryBuilder()
      .withFindById(async () => inactive)
      .withUpdate(async (user: User) => ({ ...user }))
      .build();
    const service = new UserService(mockRepo);

    const result = await service.updateUser(inactive.id, {
      status: UserStatus.ACTIVE,
    });

    expect(result.status).toBe(UserStatus.ACTIVE);
    expect(mockRepo.update).toHaveBeenCalled();
  });

  it("inactive user CAN update loginsCounter", async () => {
    const inactive = UserBuilder.anInactiveUser().withLoginsCounter(2).build();
    const mockRepo = new MockUserRepositoryBuilder()
      .withFindById(async () => inactive)
      .withUpdate(async (user: User) => ({ ...user }))
      .build();
    const service = new UserService(mockRepo);

    const result = await service.updateUser(inactive.id, {
      loginsCounter: 99,
    });

    expect(result.loginsCounter).toBe(99);
    expect(mockRepo.update).toHaveBeenCalled();
  });
});
