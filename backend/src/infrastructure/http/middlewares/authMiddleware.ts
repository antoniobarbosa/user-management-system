import type { ISessionRepository } from "@domain/repositories/ISessionRepository.js";
import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import { UserStatus } from "@domain/user/UserStatus.js";
import type { FastifyRequest } from "fastify";

export function createAuthMiddleware(
  sessionRepository: ISessionRepository,
  userRepository: IUserRepository,
) {
  return async function authMiddleware(request: FastifyRequest): Promise<void> {
    const raw = request.headers["x-session-id"];
    const sessionId = Array.isArray(raw) ? raw[0] : raw;

    if (typeof sessionId !== "string" || !sessionId.trim()) {
      throw new Error("Unauthorized");
    }

    const session = await sessionRepository.findById(sessionId.trim());
    if (!session || session.terminatedAt != null) {
      throw new Error("Unauthorized");
    }

    const user = await userRepository.findById(session.userId);
    if (!user || user.status === UserStatus.INACTIVE) {
      throw new Error("Unauthorized");
    }

    request.session = session;
  };
}
