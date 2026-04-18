import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@domain/user/User.js";
import { MockUserRepositoryBuilder } from "../builders/MockUserRepositoryBuilder.js";
import { UserBuilder } from "../builders/UserBuilder.js";
import { UserService } from "../fixtures/UserServiceStub.js";

describe("UserService", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  describe("createUser", () => {
    it("sets createdAt and updatedAt on the created user", async () => {
      const fixedNow = new Date("2025-03-15T10:30:00.000Z");
      vi.useFakeTimers();
      vi.setSystemTime(fixedNow);

      const mockRepo = new MockUserRepositoryBuilder()
        .withCreate(async (user: User) => ({ ...user }))
        .build();
      const service = new UserService(mockRepo);

      const result = await service.createUser({
        firstName: "Jane",
        lastName: "Doe",
      });

      expect(result.createdAt).toEqual(fixedNow);
      expect(result.updatedAt).toEqual(fixedNow);

      vi.useRealTimers();
    });
  });

  describe("updateUser", () => {
    it("cannot update firstName or lastName when user is inactive", async () => {
      const inactive = UserBuilder.anInactiveUser().build();
      const mockRepo = new MockUserRepositoryBuilder()
        .withFindById(async () => inactive)
        .build();
      const service = new UserService(mockRepo);

      await expect(
        service.updateUser(inactive.id, { firstName: "Changed" }),
      ).rejects.toThrow();

      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("always updates updatedAt when applying an update", async () => {
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

    it("never changes createdAt on update", async () => {
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
      vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));

      const result = await service.updateUser(existing.id, {
        lastName: "NewLast",
      });

      expect(result.createdAt).toEqual(createdAt);

      vi.useRealTimers();
    });
  });
});
