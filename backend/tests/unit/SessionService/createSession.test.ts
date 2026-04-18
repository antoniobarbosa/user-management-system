import { SessionService } from "@application/session/SessionService.js";
import type { Session } from "@domain/session/Session.js";
import type { User } from "@domain/user/User.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MockSessionRepositoryBuilder } from "../../builders/MockSessionRepositoryBuilder.js";
import { MockUserRepositoryBuilder } from "../../builders/MockUserRepositoryBuilder.js";
import { UserBuilder } from "../../builders/UserBuilder.js";

function emptyUserRepository() {
  return new MockUserRepositoryBuilder().build();
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
    const service = new SessionService(mockSessionRepo, emptyUserRepository());

    const result = await service.createSession(user);

    expect(result.createdAt).toEqual(fixedNow);

    vi.useRealTimers();
  });

  it("sets terminatedAt to null", async () => {
    const user = UserBuilder.aUser().build();
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withCreate(async (session: Session) => ({ ...session }))
      .build();
    const service = new SessionService(mockSessionRepo, emptyUserRepository());

    const result = await service.createSession(user);

    expect(result.terminatedAt).toBeNull();
  });

  it("sets userId correctly", async () => {
    const userId = "11111111-1111-1111-1111-111111111111";
    const user = UserBuilder.aUser().withId(userId).build();
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withCreate(async (session: Session) => ({ ...session }))
      .build();
    const service = new SessionService(mockSessionRepo, emptyUserRepository());

    const result = await service.createSession(user);

    expect(result.userId).toBe(userId);
  });

  it("generates a unique id", async () => {
    const user = UserBuilder.aUser().build();
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withCreate(async (session: Session) => ({ ...session }))
      .build();
    const service = new SessionService(mockSessionRepo, emptyUserRepository());

    const first = await service.createSession(user);
    const second = await service.createSession(user);

    expect(first.id).not.toBe(second.id);
  });

  it("delegates validation to SessionValidator", async () => {
    const mockSessionRepo = new MockSessionRepositoryBuilder().build();
    const mockUserRepo = emptyUserRepository();
    const service = new SessionService(mockSessionRepo, mockUserRepo);

    await expect(
      service.createSession(
        UserBuilder.anInactiveUser().build(),
      ),
    ).rejects.toThrow();

    expect(mockSessionRepo.create).not.toHaveBeenCalled();
    expect(mockUserRepo.update).not.toHaveBeenCalled();
  });

  it("increments user loginsCounter after session is created", async () => {
    const user = UserBuilder.aUser().withLoginsCounter(4).build();
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withCreate(async (session: Session) => ({ ...session }))
      .build();
    const mockUserRepo = new MockUserRepositoryBuilder()
      .withUpdate(async (u: User) => u)
      .build();
    const service = new SessionService(mockSessionRepo, mockUserRepo);

    await service.createSession(user);

    expect(mockUserRepo.update).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: user.id,
        loginsCounter: user.loginsCounter + 1,
      }),
    );
  });
});
