import type { FastifyInstance } from "fastify";
import { prisma } from "@infrastructure/database/connection.js";

const E2E_EMAIL_SUFFIX = "@e2e.test";

/**
 * Test-only routes. Registered only when NODE_ENV is `test`.
 */
export function registerTestRoutes(app: FastifyInstance): void {
  app.delete("/api/test/cleanup", async (_request, reply) => {
    const rows = await prisma.userEmail.findMany({
      where: { email: { endsWith: E2E_EMAIL_SUFFIX } },
      select: { userId: true },
    });
    const userIds = [...new Set(rows.map((r) => r.userId))];
    if (userIds.length === 0) {
      return reply.send({ deleted: 0 });
    }
    const result = await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });
    return reply.send({ deleted: result.count });
  });
}
