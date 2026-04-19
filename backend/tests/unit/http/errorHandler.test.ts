import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@domain/errors.js";
import { registerErrorHandler } from "@infrastructure/http/middlewares/errorHandler.js";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { describe, expect, it, vi } from "vitest";

type ErrorHandlerFn = (
  err: unknown,
  request: FastifyRequest,
  reply: FastifyReply,
) => void;

function captureErrorHandler(): ErrorHandlerFn {
  let handler: ErrorHandlerFn | undefined;
  const app = {
    setErrorHandler: (fn: ErrorHandlerFn) => {
      handler = fn;
    },
    setNotFoundHandler: vi.fn(),
  } as unknown as FastifyInstance;

  registerErrorHandler(app);

  if (!handler) throw new Error("error handler was not registered");
  return handler;
}

function createMockReply(): {
  reply: FastifyReply;
  status: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
} {
  const send = vi.fn();
  const status = vi.fn().mockReturnValue({ send });
  const reply = { status, send } as unknown as FastifyReply;
  return { reply, status, send };
}

const mockRequest = {} as FastifyRequest;

describe("registerErrorHandler / error handler", () => {
  const errorHandler = captureErrorHandler();

  it.each([
    "First name is required",
    "Last name is required",
    "Password is required",
    "Password must be at least 6 characters",
    "Cannot update first name or last name for an inactive user",
    "User is inactive",
    "Invalid email format",
  ])("returns 400 for ValidationError: %s", (message) => {
    const { reply, status, send } = createMockReply();
    errorHandler(new ValidationError(message), mockRequest, reply);
    expect(status).toHaveBeenCalledWith(400);
    expect(send).toHaveBeenCalledWith({ error: message });
  });

  it("returns 409 for ConflictError", () => {
    const { reply, status, send } = createMockReply();
    errorHandler(new ConflictError("Email already in use"), mockRequest, reply);
    expect(status).toHaveBeenCalledWith(409);
    expect(send).toHaveBeenCalledWith({ error: "Email already in use" });
  });

  it.each(["Unauthorized", "Invalid credentials"])(
    "returns 401 for UnauthorizedError: %s",
    (message) => {
      const { reply, status, send } = createMockReply();
      errorHandler(new UnauthorizedError(message), mockRequest, reply);
      expect(status).toHaveBeenCalledWith(401);
      expect(send).toHaveBeenCalledWith({ error: message });
    },
  );

  it.each(["User not found", "Session not found"])(
    "returns 404 for NotFoundError: %s",
    (message) => {
      const { reply, status, send } = createMockReply();
      errorHandler(new NotFoundError(message), mockRequest, reply);
      expect(status).toHaveBeenCalledWith(404);
      expect(send).toHaveBeenCalledWith({ error: message });
    },
  );

  it("returns 500 for unexpected errors (generic message)", () => {
    const { reply, status, send } = createMockReply();
    errorHandler(new Error("Unexpected database explosion"), mockRequest, reply);
    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
