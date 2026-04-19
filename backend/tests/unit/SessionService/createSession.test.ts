import { SessionService } from "@application/session/SessionService.js";
import type { Session } from "@domain/session/Session.js";
import type { User } from "@domain/user/User.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyUserEmailRepository } from "../../builders/MockUserEmailRepositoryBuilder.js";
import { MockSessionRepositoryBuilder } from "../../builders/MockSessionRepositoryBuilder.js";
import { MockUserRepositoryBuilder } from "../../builders/MockUserRepositoryBuilder.js";
import { UserBuilder } from "../../builders/UserBuilder.js";

function userRepositoryWithFind(
  getUser: (id: string) => Promise<User | null>,
): ReturnType<MockUserRepositoryBuilder["build"]> {
  return new MockUserRepositoryBuilder()
    .withFindById((id: string) => getUser(id))
    .build();
}

describe("SessionService.createSession", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("sets createdAt to now", async () => {
    const fixedNow = new Date("2026-04-18T12:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    const user = UserBuilder.aUser().build();
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withCreate(async (session: Session) => ({ ...session }))
      .build();
    const mockUserRepo = userRepositoryWithFind(async (id) =>
      id === user.id ? user : null,
    );
    const service = new SessionService(
      mockSessionRepo,
      mockUserRepo,
      emptyUserEmailRepository(),
    );

    const result = await service.createSession(user.id);

    expect(result.createdAt).toEqual(fixedNow);

    vi.useRealTimers();
  });

  it("sets terminatedAt to null", async () => {
    const user = UserBuilder.aUser().build();
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withCreate(async (session: Session) => ({ ...session }))
      .build();
    const mockUserRepo = userRepositoryWithFind(async (id) =>
      id === user.id ? user : null,
    );
    const service = new SessionService(
      mockSessionRepo,
      mockUserRepo,
      emptyUserEmailRepository(),
    );

    const result = await service.createSession(user.id);

    expect(result.terminatedAt).toBeNull();
  });

  it("sets userId correctly", async () => {
    const userId = "11111111-1111-1111-1111-111111111111";
    const user = UserBuilder.aUser().withId(userId).build();
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withCreate(async (session: Session) => ({ ...session }))
      .build();
    const mockUserRepo = userRepositoryWithFind(async (id) =>
      id === user.id ? user : null,
    );
    const service = new SessionService(
      mockSessionRepo,
      mockUserRepo,
      emptyUserEmailRepository(),
    );

    const result = await service.createSession(user.id);

    expect(result.userId).toBe(userId);
  });

  it("generates a unique id", async () => {
    const user = UserBuilder.aUser().build();
    let current: User = user;
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withCreate(async (session: Session) => ({ ...session }))
      .build();
    const mockUserRepo = new MockUserRepositoryBuilder()
      .withFindById(async (id: string) => (id === current.id ? current : null))
      .withUpdate(async (updated: User) => {
        current = updated;
        return updated;
      })
      .build();
    const service = new SessionService(
      mockSessionRepo,
      mockUserRepo,
      emptyUserEmailRepository(),
    );

    const first = await service.createSession(user.id);
    const second = await service.createSession(user.id);

    expect(first.id).not.toBe(second.id);
  });

  it("delegates validation to SessionValidator", async () => {
    const inactiveUser = UserBuilder.anInactiveUser().build();
    const mockSessionRepo = new MockSessionRepositoryBuilder().build();
    const mockUserRepo = userRepositoryWithFind(async (id) =>
      id === inactiveUser.id ? inactiveUser : null,
    );
    const service = new SessionService(
      mockSessionRepo,
      mockUserRepo,
      emptyUserEmailRepository(),
    );

    await expect(service.createSession(inactiveUser.id)).rejects.toThrow();

    expect(mockSessionRepo.create).not.toHaveBeenCalled();
    expect(mockUserRepo.update).not.toHaveBeenCalled();
  });

  it("increments user loginsCounter after session is created", async () => {
    const user = UserBuilder.aUser().withLoginsCounter(4).build();
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withCreate(async (session: Session) => ({ ...session }))
      .build();
    const mockUserRepo = new MockUserRepositoryBuilder()
      .withFindById(async (id: string) => (id === user.id ? user : null))
      .withUpdate(async (u: User) => u)
      .build();
    const service = new SessionService(
      mockSessionRepo,
      mockUserRepo,
      emptyUserEmailRepository(),
    );

    await service.createSession(user.id);

    expect(mockUserRepo.update).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: user.id,
        loginsCounter: user.loginsCounter + 1,
      }),
    );
  });
});
