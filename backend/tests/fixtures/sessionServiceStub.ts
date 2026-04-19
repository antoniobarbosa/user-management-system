import type { SessionService } from "@application/session/SessionService.js";
import { vi } from "vitest";

/** For UserService tests that never call `createUser`. */
export function unusedSessionService(): SessionService {
  return {
    startSessionForUser: vi.fn(() => {
      throw new Error("startSessionForUser was not expected in this test");
    }),
  } as unknown as SessionService;
}
