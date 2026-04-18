import type { FastifyInstance } from "fastify";
import type { UserController } from "../controllers/UserController.js";

export function registerUserRoutes(
  app: FastifyInstance,
  controller: UserController,
): void {
  app.post("/api/users", (req, reply) => controller.createUser(req, reply));
  app.get("/api/users", (req, reply) => controller.findAll(req, reply));
  app.get("/api/users/:id", (req, reply) => controller.findById(req, reply));
  app.patch("/api/users/:id", (req, reply) => controller.updateUser(req, reply));
  app.delete("/api/users/:id", (req, reply) => controller.deleteUser(req, reply));
}
