import type {
  FastifyInstance,
  preHandlerHookHandler,
} from "fastify";
import type { UserController } from "../controllers/UserController.js";

export function registerUserRoutes(
  app: FastifyInstance,
  controller: UserController,
  authPreHandler: preHandlerHookHandler,
): void {
  const auth = { preHandler: authPreHandler };
  app.post("/api/users", (req, reply) => controller.createUser(req, reply));
  app.get("/api/users/me", auth, (req, reply) =>
    controller.getCurrentUser(req, reply),
  );
  app.get("/api/users", auth, (req, reply) => controller.findAll(req, reply));
  app.get("/api/users/:id", auth, (req, reply) => controller.findById(req, reply));
  app.patch("/api/users/:id", auth, (req, reply) =>
    controller.updateUser(req, reply),
  );
  app.delete("/api/users/:id", auth, (req, reply) =>
    controller.deleteUser(req, reply),
  );
}
