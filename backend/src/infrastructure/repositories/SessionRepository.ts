import type { PrismaClient } from "@prisma/client";
import type { ISessionRepository } from "@domain/repositories/ISessionRepository.js";
import { Session } from "@domain/session/Session.js";
import { prisma } from "@infrastructure/database/connection.js";

type SessionRow = {
  id: string;
  userId: string;
  createdAt: Date;
  terminatedAt: Date | null;
};

function toDomain(row: SessionRow): Session {
  const session = new Session();
  session.id = row.id;
  session.userId = row.userId;
  session.createdAt = row.createdAt;
  session.terminatedAt = row.terminatedAt;
  return session;
}

export class SessionRepository implements ISessionRepository {
  constructor(private readonly prisma: PrismaClient = prisma) {}

  async create(session: Session): Promise<Session> {
    const row = await this.prisma.session.create({
      data: {
        id: session.id,
        userId: session.userId,
        createdAt: session.createdAt,
        terminatedAt: session.terminatedAt,
      },
    });
    return toDomain(row);
  }

  async findById(id: string): Promise<Session | null> {
    const row = await this.prisma.session.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async terminate(id: string): Promise<void> {
    await this.prisma.session.update({
      where: { id },
      data: { terminatedAt: new Date() },
    });
  }
}
