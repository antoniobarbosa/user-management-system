import bcrypt from "bcrypt";
import { SessionService } from "@application/session/SessionService.js";
import type { Session } from "@domain/session/Session.js";
import type { User } from "@domain/user/User.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MockSessionRepositoryBuilder } from "../../builders/MockSessionRepositoryBuilder.js";
import { MockUserEmailRepositoryBuilder } from "../../builders/MockUserEmailRepositoryBuilder.js";
import { MockUserRepositoryBuilder } from "../../builders/MockUserRepositoryBuilder.js";
import { UserEmailBuilder } from "../../builders/UserEmailBuilder.js";
import { UserBuilder } from "../../builders/UserBuilder.js";

describe("SessionService.signIn", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('throws "User not found" if email not found', async () => {
    const mockUserRepo = new MockUserRepositoryBuilder().build();
    const mockEmailRepo = new MockUserEmailRepositoryBuilder()
      .withFindByEmail(async () => null)
      .build();
    const mockSessionRepo = new MockSessionRepositoryBuilder().build();
    const service = new SessionService(
      mockSessionRepo,
      mockUserRepo,
      mockEmailRepo,
    );

    await expect(
      service.signIn("missing@example.com", "password"),
    ).rejects.toThrow("User not found");

    expect(mockUserRepo.findById).not.toHaveBeenCalled();
  });

  it('throws "Invalid password" if password does not match', async () => {
    const hash = await bcrypt.hash("correct", 4);
    const user = UserBuilder.aUser().withPasswordHash(hash).build();
    const userEmail = UserEmailBuilder.aUserEmail()
      .withUserId(user.id)
      .withEmail("jane@example.com")
      .build();

    const mockUserRepo = new MockUserRepositoryBuilder()
      .withFindById(async (id: string) => (id === user.id ? user : null))
      .build();
    const mockEmailRepo = new MockUserEmailRepositoryBuilder()
      .withFindByEmail(async (email) =>
        email.toString() === userEmail.email.toString() ? userEmail : null,
      )
      .build();
    const mockSessionRepo = new MockSessionRepositoryBuilder().build();
    const service = new SessionService(
      mockSessionRepo,
      mockUserRepo,
      mockEmailRepo,
    );

    await expect(
      service.signIn("jane@example.com", "wrong-password"),
    ).rejects.toThrow("Invalid password");
  });

  it('throws "User is inactive" if user is inactive', async () => {
    const hash = await bcrypt.hash("secret", 4);
    const user = UserBuilder.anInactiveUser()
      .withPasswordHash(hash)
      .build();
    const userEmail = UserEmailBuilder.aUserEmail()
      .withUserId(user.id)
      .withEmail("inactive@example.com")
      .build();

    const mockUserRepo = new MockUserRepositoryBuilder()
      .withFindById(async (id: string) => (id === user.id ? user : null))
      .build();
    const mockEmailRepo = new MockUserEmailRepositoryBuilder()
      .withFindByEmail(async (email) =>
        email.toString() === userEmail.email.toString() ? userEmail : null,
      )
      .build();
    const mockSessionRepo = new MockSessionRepositoryBuilder().build();
    const service = new SessionService(
      mockSessionRepo,
      mockUserRepo,
      mockEmailRepo,
    );

    await expect(
      service.signIn("inactive@example.com", "secret"),
    ).rejects.toThrow("User is inactive");
  });

  it("creates session on success", async () => {
    const fixedNow = new Date("2026-04-18T15:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    const hash = await bcrypt.hash("myPass12", 4);
    const user = UserBuilder.aUser()
      .withLoginsCounter(3)
      .withPasswordHash(hash)
      .build();
    const userEmail = UserEmailBuilder.aUserEmail()
      .withUserId(user.id)
      .withEmail("active@example.com")
      .build();

    const mockUserRepo = new MockUserRepositoryBuilder()
      .withFindById(async (id: string) => (id === user.id ? user : null))
      .withUpdate(async (u: User) => u)
      .build();
    const mockEmailRepo = new MockUserEmailRepositoryBuilder()
      .withFindByEmail(async (email) =>
        email.toString() === userEmail.email.toString() ? userEmail : null,
      )
      .build();

    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withCreate(async (session: Session) => ({ ...session }))
      .build();

    const service = new SessionService(
      mockSessionRepo,
      mockUserRepo,
      mockEmailRepo,
    );
    const result = await service.signIn("active@example.com", "myPass12");

    expect(mockUserRepo.update).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: user.id,
        loginsCounter: 4,
        updatedAt: fixedNow,
      }),
    );

    expect(mockSessionRepo.create).toHaveBeenCalledTimes(1);
    expect(result.userId).toBe(user.id);
    expect(result.createdAt).toEqual(fixedNow);
    expect(result.terminatedAt).toBeNull();

    vi.useRealTimers();
  });
});
