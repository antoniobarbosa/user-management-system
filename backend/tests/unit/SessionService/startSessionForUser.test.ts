import { SessionService } from "@application/session/SessionService.js";
import type { Session } from "@domain/session/Session.js";
import type { User } from "@domain/user/User.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyUserEmailRepository } from "../../builders/MockUserEmailRepositoryBuilder.js";
import { MockSessionRepositoryBuilder } from "../../builders/MockSessionRepositoryBuilder.js";
import { MockUserRepositoryBuilder } from "../../builders/MockUserRepositoryBuilder.js";
import { UserBuilder } from "../../builders/UserBuilder.js";

describe("SessionService.startSessionForUser", () => {
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
    const mockUserRepo = new MockUserRepositoryBuilder()
      .withUpdate(async (u: User) => u)
      .build();
    const service = new SessionService(
      mockSessionRepo,
      mockUserRepo,
      emptyUserEmailRepository(),
    );

    const { session: result } = await service.startSessionForUser(user);

    expect(result.createdAt).toEqual(fixedNow);

    vi.useRealTimers();
  });

  it("sets terminatedAt to null", async () => {
    const user = UserBuilder.aUser().build();
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withCreate(async (session: Session) => ({ ...session }))
      .build();
    const mockUserRepo = new MockUserRepositoryBuilder()
      .withUpdate(async (u: User) => u)
      .build();
    const service = new SessionService(
      mockSessionRepo,
      mockUserRepo,
      emptyUserEmailRepository(),
    );

    const { session: result } = await service.startSessionForUser(user);

    expect(result.terminatedAt).toBeNull();
  });

  it("sets userId correctly", async () => {
    const userId = "11111111-1111-1111-1111-111111111111";
    const user = UserBuilder.aUser().withId(userId).build();
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withCreate(async (session: Session) => ({ ...session }))
      .build();
    const mockUserRepo = new MockUserRepositoryBuilder()
      .withUpdate(async (u: User) => u)
      .build();
    const service = new SessionService(
      mockSessionRepo,
      mockUserRepo,
      emptyUserEmailRepository(),
    );

    const { session: result } = await service.startSessionForUser(user);

    expect(result.userId).toBe(userId);
  });

  it("generates a unique id per session", async () => {
    const user = UserBuilder.aUser().build();
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withCreate(async (session: Session) => ({ ...session }))
      .build();
    const mockUserRepo = new MockUserRepositoryBuilder()
      .withUpdate(async (u: User) => u)
      .build();
    const service = new SessionService(
      mockSessionRepo,
      mockUserRepo,
      emptyUserEmailRepository(),
    );

    const first = await service.startSessionForUser(user);
    const second = await service.startSessionForUser(first.user);

    expect(first.session.id).not.toBe(second.session.id);
  });

  it("rejects inactive users via SessionValidator", async () => {
    const inactiveUser = UserBuilder.anInactiveUser().build();
    const mockSessionRepo = new MockSessionRepositoryBuilder().build();
    const mockUserRepo = new MockUserRepositoryBuilder().build();
    const service = new SessionService(
      mockSessionRepo,
      mockUserRepo,
      emptyUserEmailRepository(),
    );

    await expect(service.startSessionForUser(inactiveUser)).rejects.toThrow();

    expect(mockSessionRepo.create).not.toHaveBeenCalled();
    expect(mockUserRepo.update).not.toHaveBeenCalled();
  });

  it("increments user loginsCounter by default", async () => {
    const user = UserBuilder.aUser().withLoginsCounter(4).build();
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withCreate(async (session: Session) => ({ ...session }))
      .build();
    const mockUserRepo = new MockUserRepositoryBuilder()
      .withUpdate(async (u: User) => u)
      .build();
    const service = new SessionService(
      mockSessionRepo,
      mockUserRepo,
      emptyUserEmailRepository(),
    );

    await service.startSessionForUser(user);

    expect(mockUserRepo.update).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: user.id,
        loginsCounter: user.loginsCounter + 1,
      }),
    );
  });

  it("does not increment loginsCounter when incrementLoginCount is false", async () => {
    const user = UserBuilder.aUser().withLoginsCounter(0).build();
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withCreate(async (session: Session) => ({ ...session }))
      .build();
    const mockUserRepo = new MockUserRepositoryBuilder()
      .withUpdate(async (u: User) => u)
      .build();
    const service = new SessionService(
      mockSessionRepo,
      mockUserRepo,
      emptyUserEmailRepository(),
    );

    await service.startSessionForUser(user, { incrementLoginCount: false });

    expect(mockUserRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: user.id,
        loginsCounter: 0,
      }),
    );
  });
});
