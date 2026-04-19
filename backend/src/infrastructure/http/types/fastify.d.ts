import type { Session } from "@domain/session/Session.js";

declare module "fastify" {
  interface FastifyRequest {
    session?: Session;
  }
}
