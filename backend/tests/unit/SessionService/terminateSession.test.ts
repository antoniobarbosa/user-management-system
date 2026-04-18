import { SessionService } from "@application/session/SessionService.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MockSessionRepositoryBuilder } from "../../builders/MockSessionRepositoryBuilder.js";
import { MockUserRepositoryBuilder } from "../../builders/MockUserRepositoryBuilder.js";
import { SessionBuilder } from "../../builders/SessionBuilder.js";

function emptyUserRepository() {
  return new MockUserRepositoryBuilder().build();
}

describe("SessionService.terminateSession", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("sets terminatedAt to now", async () => {
    const fixedNow = new Date("2026-04-18T15:30:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    const session = SessionBuilder.aSession().build();
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withFindById(async () => session)
      .withTerminate(async () => undefined)
      .build();
    const service = new SessionService(mockSessionRepo, emptyUserRepository());

    const result = await service.terminateSession(session.id);

    expect(result.terminatedAt).toEqual(fixedNow);
    expect(mockSessionRepo.terminate).toHaveBeenCalledWith(session.id);

    vi.useRealTimers();
  });

  it("returns the terminated session with terminatedAt set to now", async () => {
    const fixedNow = new Date("2026-04-18T14:00:00.000Z");
    vi.useFakeTimers();
    vi.setSystemTime(fixedNow);

    const session = SessionBuilder.aSession().build();
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withFindById(async () => session)
      .withTerminate(async () => undefined)
      .build();
    const service = new SessionService(mockSessionRepo, emptyUserRepository());

    const result = await service.terminateSession(session.id);

    expect(result).toMatchObject({
      id: session.id,
      userId: session.userId,
      createdAt: session.createdAt,
      terminatedAt: fixedNow,
    });

    vi.useRealTimers();
  });

  it('throws "Session not found" if session not found', async () => {
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withFindById(async () => null)
      .build();
    const service = new SessionService(mockSessionRepo, emptyUserRepository());

    await expect(
      service.terminateSession("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
    ).rejects.toThrow("Session not found");
  });

  it('throws "Session already terminated" if terminatedAt is not null', async () => {
    const session = SessionBuilder.aTerminatedSession().build();
    const mockSessionRepo = new MockSessionRepositoryBuilder()
      .withFindById(async () => session)
      .build();
    const service = new SessionService(mockSessionRepo, emptyUserRepository());

    await expect(service.terminateSession(session.id)).rejects.toThrow(
      "Session already terminated",
    );
  });
});
