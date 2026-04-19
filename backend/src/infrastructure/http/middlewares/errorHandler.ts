import { Prisma } from "@prisma/client";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@domain/errors.js";
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

function isPrismaNotFound(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025"
  );
}

function isPrismaUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
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

  if (isPrismaUniqueViolation(err)) {
    return { statusCode: 409, message: "Email already in use" };
  }

  if (err instanceof ConflictError) {
    return { statusCode: 409, message: err.message };
  }

  if (err instanceof ValidationError) {
    return { statusCode: 400, message: err.message };
  }

  if (err instanceof UnauthorizedError) {
    return { statusCode: 401, message: err.message };
  }

  if (err instanceof NotFoundError) {
    return { statusCode: 404, message: err.message };
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
