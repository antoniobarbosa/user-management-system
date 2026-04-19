import type { PrismaClient } from "@prisma/client";
import type { IUserEmailRepository } from "@domain/repositories/IUserEmailRepository.js";
import { UserEmail } from "@domain/email/UserEmail.js";
import { Email } from "@domain/shared/valueObjects/Email.js";
import { prisma } from "@infrastructure/database/connection.js";

type UserEmailRow = {
  id: string;
  userId: string;
  email: string;
  primary: boolean;
  createdAt: Date;
};

function toDomain(row: UserEmailRow): UserEmail {
  const userEmail = new UserEmail();
  userEmail.id = row.id;
  userEmail.userId = row.userId;
  userEmail.email = new Email(row.email);
  userEmail.primary = row.primary;
  userEmail.createdAt = row.createdAt;
  return userEmail;
}

export class UserEmailRepository implements IUserEmailRepository {
  constructor(private readonly prisma: PrismaClient = prisma) {}

  async findByEmail(email: Email): Promise<UserEmail | null> {
    const row = await this.prisma.userEmail.findUnique({
      where: { email: email.toString() },
    });
    return row ? toDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<UserEmail[]> {
    const rows = await this.prisma.userEmail.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toDomain);
  }

  async create(userEmail: UserEmail): Promise<UserEmail> {
    const row = await this.prisma.userEmail.create({
      data: {
        id: userEmail.id,
        userId: userEmail.userId,
        email: userEmail.email.toString(),
        primary: userEmail.primary,
        createdAt: userEmail.createdAt,
      },
    });
    return toDomain(row);
  }
}
