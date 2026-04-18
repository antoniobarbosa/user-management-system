import type { User } from "@domain/user/User.js";
import type { PaginatedUsersMeta } from "@domain/repositories/IUserRepository.js";
import { UserService } from "@application/user/UserService.js";
import { describe, expect, it } from "vitest";
import { MockUserRepositoryBuilder } from "../../builders/MockUserRepositoryBuilder.js";
import { UserBuilder } from "../../builders/UserBuilder.js";

function paginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginatedUsersMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: totalPages > 0 && page < totalPages,
    hasPrev: page > 1,
  };
}

describe("UserService.findAll", () => {
  it("returns paginated list with correct total", async () => {
    const users: User[] = Array.from({ length: 25 }, (_, i) =>
      UserBuilder.aUser().withFirstName(`User${i}`).build(),
    );
    const mockRepo = new MockUserRepositoryBuilder()
      .withFindAll(async (page, limit) => {
        const start = (page - 1) * limit;
        return {
          data: users.slice(start, start + limit),
          meta: paginationMeta(users.length, page, limit),
        };
      })
      .build();

    const service = new UserService(mockRepo);

    const result = await service.findAll(1, 10);

    expect(mockRepo.findAll).toHaveBeenCalledWith(1, 10);
    expect(result.meta.total).toBe(25);
    expect(result.meta).toMatchObject({
      page: 1,
      limit: 10,
      totalPages: 3,
      hasNext: true,
      hasPrev: false,
    });
    expect(result.data).toHaveLength(10);
  });

  it("returns empty list if no users exist", async () => {
    const mockRepo = new MockUserRepositoryBuilder()
      .withFindAll(async (_page, limit) => ({
        data: [],
        meta: paginationMeta(0, 1, limit),
      }))
      .build();

    const service = new UserService(mockRepo);

    const result = await service.findAll(1, 20);

    expect(result.data).toEqual([]);
    expect(result.meta.total).toBe(0);
    expect(result.meta).toMatchObject({
      page: 1,
      limit: 20,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
    expect(mockRepo.findAll).toHaveBeenCalledWith(1, 20);
  });

  it("returns correct users for page 2", async () => {
    const users: User[] = Array.from({ length: 25 }, (_, i) =>
      UserBuilder.aUser().withFirstName(`User${i}`).build(),
    );
    const mockRepo = new MockUserRepositoryBuilder()
      .withFindAll(async (page, limit) => {
        const start = (page - 1) * limit;
        return {
          data: users.slice(start, start + limit),
          meta: paginationMeta(users.length, page, limit),
        };
      })
      .build();

    const service = new UserService(mockRepo);

    const result = await service.findAll(2, 10);

    expect(result.data).toHaveLength(10);
    expect(result.meta).toMatchObject({
      page: 2,
      limit: 10,
      totalPages: 3,
      hasNext: true,
      hasPrev: true,
    });
    expect(result.data.map((u) => u.firstName)).toEqual(
      users.slice(10, 20).map((u) => u.firstName),
    );
    expect(mockRepo.findAll).toHaveBeenCalledWith(2, 10);
  });
});
