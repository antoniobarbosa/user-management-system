import type { FastifyReply, FastifyRequest } from "fastify";
import type { Session } from "@domain/session/Session.js";
import { SessionService } from "@application/session/SessionService.js";

function toSessionResponse(session: Session) {
  return {
    id: session.id,
    userId: session.userId,
    createdAt: session.createdAt,
    terminatedAt: session.terminatedAt,
  };
}

export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  async signIn(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    const session = await this.sessionService.signIn(email, password);
    reply.code(201).send(toSessionResponse(session));
  }

  async terminateSession(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { id } = request.params as { id: string };
    const session = await this.sessionService.terminateSession(id);
    reply.send(toSessionResponse(session));
  }
}
