import "dotenv/config";
import Fastify from "fastify";
import type { AppLogger } from "@application/logger.js";
import { UserService } from "@application/user/UserService.js";
import { SessionService } from "@application/session/SessionService.js";
import { prisma } from "@infrastructure/database/connection.js";
import { UserRepository } from "@infrastructure/repositories/UserRepository.js";
import { UserEmailRepository } from "@infrastructure/repositories/UserEmailRepository.js";
import { SessionRepository } from "@infrastructure/repositories/SessionRepository.js";
import { UserController } from "@infrastructure/http/controllers/UserController.js";
import { SessionController } from "@infrastructure/http/controllers/SessionController.js";
import { buildFastifyLoggerConfig } from "@infrastructure/http/loggerConfig.js";
import { registerUserRoutes } from "@infrastructure/http/routes/userRoutes.js";
import { registerSessionRoutes } from "@infrastructure/http/routes/sessionRoutes.js";
import { registerTestRoutes } from "@infrastructure/http/routes/testRoutes.js";
import { registerErrorHandler } from "@infrastructure/http/middlewares/errorHandler.js";
import { createAuthMiddleware } from "@infrastructure/http/middlewares/authMiddleware.js";

const port = Number(process.env.PORT) || 3001;

const app = Fastify({ logger: buildFastifyLoggerConfig() });

const log = app.log as unknown as AppLogger;

const userRepository = new UserRepository(prisma);
const userEmailRepository = new UserEmailRepository(prisma);
const sessionRepository = new SessionRepository(prisma);
const sessionService = new SessionService(
  sessionRepository,
  userRepository,
  userEmailRepository,
  log,
);
const userService = new UserService(userRepository, sessionService, log);
const userController = new UserController(userService);
const sessionController = new SessionController(sessionService);

registerErrorHandler(app);

const authPreHandler = createAuthMiddleware(sessionRepository, userRepository);
registerUserRoutes(app, userController, authPreHandler);
registerSessionRoutes(app, sessionController, authPreHandler);

if (process.env.NODE_ENV === "test") {
  registerTestRoutes(app);
}

app.get("/health", async () => ({ status: "ok" }));

try {
  await app.listen({ port, host: "0.0.0.0" });
  app.log.info({ port }, "Server listening");
} catch (err) {
  app.log.error({ err }, "Failed to start server");
  process.exit(1);
}
