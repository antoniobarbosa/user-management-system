import type { FastifyServerOptions } from "fastify";

/**
 * Pino via Fastify: pretty in local/dev, JSON in production and tests.
 */
export function buildFastifyLoggerConfig(): FastifyServerOptions["logger"] {
  const level = process.env.LOG_LEVEL ?? "info";
  const isProduction = process.env.NODE_ENV === "production";
  const isTest = process.env.NODE_ENV === "test";

  if (!isProduction && !isTest) {
    return {
      level,
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      },
    };
  }

  return { level };
}
