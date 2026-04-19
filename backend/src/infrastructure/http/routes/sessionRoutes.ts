import type {
  FastifyInstance,
  preHandlerHookHandler,
} from "fastify";
import type { SessionController } from "../controllers/SessionController.js";

export function registerSessionRoutes(
  app: FastifyInstance,
  controller: SessionController,
  authPreHandler: preHandlerHookHandler,
): void {
  app.post("/api/auth/signin", (req, reply) => controller.signIn(req, reply));
  app.post("/api/sessions", (req, reply) =>
    controller.createSession(req, reply),
  );
  app.delete(
    "/api/sessions/:id",
    { preHandler: authPreHandler },
    (req, reply) => controller.terminateSession(req, reply),
  );
}
