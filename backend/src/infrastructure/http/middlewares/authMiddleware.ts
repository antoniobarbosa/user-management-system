import type { ISessionRepository } from "@domain/repositories/ISessionRepository.js";
import type { FastifyRequest } from "fastify";

export function createAuthMiddleware(sessionRepository: ISessionRepository) {
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

    request.session = session;
  };
}
