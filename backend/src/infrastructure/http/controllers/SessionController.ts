import type { FastifyReply, FastifyRequest } from "fastify";
import type { Session } from "@domain/session/Session.js";
import { SessionService } from "@application/session/SessionService.js";
import {
  attachSessionCookie,
  clearSessionCookie,
} from "../sessionCookie.js";

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
    request.log.info({ handler: "signIn", route: "/api/auth/signin" }, "Sign-in request");
    const body = request.body as Record<string, unknown>;
    const email = typeof body.email === "string" ? body.email : "";
    const password =
      typeof body.password === "string" ? body.password : "";

    const session = await this.sessionService.signIn(email, password);
    request.log.info(
      { sessionId: session.id, userId: session.userId },
      "Sign-in succeeded",
    );
    attachSessionCookie(reply, session.id);
    reply.code(201).send(toSessionResponse(session));
  }

  async terminateCurrentSession(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const sid = request.session;
    if (!sid) {
      throw new Error("Unauthorized");
    }
    request.log.info(
      { handler: "terminateCurrentSession", sessionId: sid.id },
      "Session termination request (current)",
    );
    const session = await this.sessionService.terminateSession(sid.id);
    clearSessionCookie(reply);
    reply.send(toSessionResponse(session));
  }

  async terminateSession(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const { id } = request.params as { id: string };
    request.log.info({ handler: "terminateSession", sessionId: id }, "Session termination request");
    const session = await this.sessionService.terminateSession(id);
    if (request.session && request.session.id === id) {
      clearSessionCookie(reply);
    }
    reply.send(toSessionResponse(session));
  }
}
