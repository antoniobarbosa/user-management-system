import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import { User } from "@domain/user/User.js";
import { UserStatus } from "@domain/user/UserStatus.js";
// Replace with `@application/user/UserService.js` once the real service exists.
import { UserService } from "../fixtures/UserServiceStub.js";

function createMockUserRepository(): IUserRepository {
  return {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

function buildUser(overrides: Partial<User> = {}): User {
  const user = new User();
  user.id = "11111111-1111-4111-8111-111111111111";
  user.createdAt = new Date("2020-01-01T00:00:00.000Z");
  user.updatedAt = new Date("2020-01-02T00:00:00.000Z");
  user.firstName = "John";
  user.lastName = "Smith";
  user.status = UserStatus.ACTIVE;
  user.loginsCounter = 0;
  return Object.assign(user, overrides);
}

describe("UserService", () => {
  let mockRepo: IUserRepository;
  let service: UserService;

  beforeEach(() => {
    vi.useRealTimers();
    mockRepo = createMockUserRepository();
    service = new UserService(mockRepo);
  });

  describe("createUser", () => {
    it("sets createdAt and updatedAt on the created user", async () => {
      const fixedNow = new Date("2025-03-15T10:30:00.000Z");
      vi.useFakeTimers();
      vi.setSystemTime(fixedNow);

      mockRepo.create.mockImplementation(async (user: User) => ({ ...user }));

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
      const inactive = buildUser({ status: UserStatus.INACTIVE });
      mockRepo.findById.mockResolvedValue(inactive);

      await expect(
        service.updateUser(inactive.id, { firstName: "Changed" }),
      ).rejects.toThrow();

      expect(mockRepo.update).not.toHaveBeenCalled();
    });

    it("always updates updatedAt when applying an update", async () => {
      const t0 = new Date("2024-01-01T00:00:00.000Z");
      const t1 = new Date("2024-06-01T12:00:00.000Z");
      const existing = buildUser({
        updatedAt: t0,
      });
      mockRepo.findById.mockResolvedValue(existing);
      mockRepo.update.mockImplementation(async (user: User) => ({ ...user }));

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
      const existing = buildUser({
        createdAt,
        updatedAt: new Date("2019-05-06T08:00:00.000Z"),
      });
      mockRepo.findById.mockResolvedValue(existing);
      mockRepo.update.mockImplementation(async (user: User) => ({ ...user }));

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
