import { UnauthorizedError } from "@domain/errors.js";
import type { ISessionRepository } from "@domain/repositories/ISessionRepository.js";
import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import { UserStatus } from "@domain/user/UserStatus.js";
import type { FastifyRequest } from "fastify";
import { SESSION_COOKIE_NAME } from "../sessionCookie.js";

export function createAuthMiddleware(
  sessionRepository: ISessionRepository,
  userRepository: IUserRepository,
) {
  return async function authMiddleware(request: FastifyRequest): Promise<void> {
    const fromCookie = request.cookies[SESSION_COOKIE_NAME];
    const rawHeader = request.headers["x-session-id"];
    const headerVal = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    // Prefer the header: the SPA sends the current session id from its store, and a
    // stale HttpOnly cookie (e.g. after sign-up) should not override that value.
    const sessionId =
      typeof headerVal === "string" && headerVal.trim()
        ? headerVal.trim()
        : typeof fromCookie === "string" && fromCookie.trim()
          ? fromCookie.trim()
          : "";

    if (!sessionId) {
      throw new UnauthorizedError("Unauthorized");
    }

    const session = await sessionRepository.findById(sessionId);
    if (!session || session.terminatedAt != null) {
      throw new UnauthorizedError("Unauthorized");
    }

    const user = await userRepository.findById(session.userId);
    if (!user || user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedError("Unauthorized");
    }

    request.session = session;
  };
}
