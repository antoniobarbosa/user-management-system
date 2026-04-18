import { Prisma } from "@prisma/client";
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

const NOT_FOUND_MESSAGES = new Set([
  "User not found",
  "Session not found",
  "Resource not found",
]);

const BAD_REQUEST_MESSAGES = new Set([
  "First name is required",
  "Last name is required",
  "Password is required",
  "Password must be at least 6 characters",
  "Cannot update first name or last name for an inactive user",
  "User is inactive",
  "Session already terminated",
  "User password is required for persistence",
  "userId is required",
  "Invalid page",
  "Invalid limit",
  "Invalid status",
]);

function isBadRequestMessage(message: string): boolean {
  if (BAD_REQUEST_MESSAGES.has(message)) return true;
  return message.startsWith("Invalid user status in database:");
}

function isNotFoundMessage(message: string): boolean {
  return NOT_FOUND_MESSAGES.has(message);
}

function isPrismaNotFound(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025"
  );
}

function isFastifyValidationError(err: unknown): err is FastifyError {
  if (typeof err !== "object" || err === null) return false;
  const e = err as FastifyError;
  return (
    e.code === "FST_ERR_VALIDATION" ||
    (Array.isArray(e.validation) && e.validation.length > 0)
  );
}

function resolveStatusAndMessage(err: unknown): { statusCode: number; message: string } {
  if (isFastifyValidationError(err)) {
    return { statusCode: 400, message: err.message ?? "Validation error" };
  }

  if (isPrismaNotFound(err)) {
    return { statusCode: 404, message: "Resource not found" };
  }

  const message = err instanceof Error ? err.message : "Internal server error";

  if (isNotFoundMessage(message)) {
    return { statusCode: 404, message };
  }

  if (isBadRequestMessage(message)) {
    return { statusCode: 400, message };
  }

  return { statusCode: 500, message: "Internal server error" };
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler(
    (err: unknown, _request: FastifyRequest, reply: FastifyReply) => {
      const { statusCode, message } = resolveStatusAndMessage(err);
      reply.status(statusCode).send({ error: message });
    },
  );

  app.setNotFoundHandler((_request: FastifyRequest, reply: FastifyReply) => {
    reply.status(404).send({ error: "Route not found" });
  });
}
