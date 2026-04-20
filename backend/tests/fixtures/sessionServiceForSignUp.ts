import { randomUUID } from "node:crypto";
import type {
  SessionService,
  StartSessionForUserOptions,
} from "@application/session/SessionService.js";
import { Session } from "@domain/session/Session.js";
import type { User } from "@domain/user/User.js";

/**
 * Mimics {@link SessionService.startSessionForUser} without touching repos
 * (UserService unit tests already mock IUserRepository).
 */
export function sessionServiceForSignUpFlow(): SessionService {
  return {
    async startSessionForUser(user: User, options?: StartSessionForUserOptions) {
      const u = user.duplicate();
      const increment = options?.incrementLoginCount !== false;
      u.loginsCounter = increment ? user.loginsCounter + 1 : user.loginsCounter;
      u.updatedAt = new Date();
      const session = new Session();
      session.id = randomUUID();
      session.userId = user.id;
      session.createdAt = user.createdAt;
      session.terminatedAt = null;
      return { session, user: u };
    },
  } as unknown as SessionService;
}
