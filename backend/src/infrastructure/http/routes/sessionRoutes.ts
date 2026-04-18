import type { FastifyInstance } from "fastify";
import type { SessionController } from "../controllers/SessionController.js";

export function registerSessionRoutes(
  app: FastifyInstance,
  controller: SessionController,
): void {
  app.post("/api/sessions", (req, reply) =>
    controller.createSession(req, reply),
  );
  app.delete("/api/sessions/:id", (req, reply) =>
    controller.terminateSession(req, reply),
  );
}
