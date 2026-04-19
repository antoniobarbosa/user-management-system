/**
 * Pino-compatible surface for application services (keeps application layer free of Fastify imports).
 */
export type AppLogger = {
  info(obj: object, msg?: string): void;
  warn(obj: object, msg?: string): void;
  error(obj: object, msg?: string): void;
};

export const noopLogger: AppLogger = {
  info() {},
  warn() {},
  error() {},
};
