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
    ["First name is required", 400],
    ["Last name is required", 400],
    ["Password is required", 400],
    ["Password must be at least 6 characters", 400],
    ["Cannot update first name or last name for an inactive user", 400],
    ["User is inactive", 400],
    ["Invalid email format", 400],
  ])("returns 400 for %s", (message, expectedStatus) => {
    const { reply, status, send } = createMockReply();
    errorHandler(new Error(message), mockRequest, reply);
    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(send).toHaveBeenCalledWith({ error: message });
  });

  it.each([
    ["Unauthorized", 401],
    ["Invalid password", 401],
  ])("returns 401 for %s", (message, expectedStatus) => {
    const { reply, status, send } = createMockReply();
    errorHandler(new Error(message), mockRequest, reply);
    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(send).toHaveBeenCalledWith({ error: message });
  });

  it.each([
    ["User not found", 404],
    ["Session not found", 404],
  ])("returns 404 for %s", (message, expectedStatus) => {
    const { reply, status, send } = createMockReply();
    errorHandler(new Error(message), mockRequest, reply);
    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(send).toHaveBeenCalledWith({ error: message });
  });

  it("returns 500 for unexpected errors (generic message)", () => {
    const { reply, status, send } = createMockReply();
    errorHandler(new Error("Unexpected database explosion"), mockRequest, reply);
    expect(status).toHaveBeenCalledWith(500);
    expect(send).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
