import type { PrismaClient } from "@prisma/client";
import { ValidationError } from "@domain/errors.js";
import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import {
  buildPaginationMeta,
  type PaginationMeta,
} from "@domain/shared/buildPaginationMeta.js";
import { UserEmail } from "@domain/email/UserEmail.js";
import { Email } from "@domain/shared/valueObjects/Email.js";
import { User } from "@domain/user/User.js";
import { UserStatus } from "@domain/user/UserStatus.js";
import { prisma } from "@infrastructure/database/connection.js";

type UserRow = {
  id: string;
  firstName: string;
  lastName: string;
  password: string;
  status: string;
  loginsCounter: number;
  createdAt: Date;
  updatedAt: Date;
};

type UserEmailRow = {
  id: string;
  userId: string;
  email: string;
  primary: boolean;
  createdAt: Date;
};

const userIncludeEmails = { emails: true } as const;

type UserRowWithEmails = UserRow & { emails: UserEmailRow[] };

function mapStatus(value: string): UserStatus {
  if (value === UserStatus.ACTIVE) return UserStatus.ACTIVE;
  if (value === UserStatus.INACTIVE) return UserStatus.INACTIVE;
  throw new ValidationError(`Invalid user status in database: ${value}`);
}

function mapUserEmailRow(row: UserEmailRow): UserEmail {
  const userEmail = new UserEmail();
  userEmail.id = row.id;
  userEmail.userId = row.userId;
  userEmail.email = new Email(row.email);
  userEmail.primary = row.primary;
  userEmail.createdAt = row.createdAt;
  return userEmail;
}

function toDomain(row: UserRowWithEmails): User {
  return User.rehydrate(
    {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      status: mapStatus(row.status),
      loginsCounter: row.loginsCounter,
      password: row.password,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    row.emails.map(mapUserEmailRow),
  );
}

export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient = prisma) {}

  async create(user: User): Promise<User> {
    const password = user.password;
    if (password === undefined) {
      throw new ValidationError("User password is required for persistence");
    }

    const emailCreates = user.allEmails.map((ue) => ({
      id: ue.id,
      email: ue.email.toString(),
      primary: ue.primary,
      createdAt: ue.createdAt,
    }));

    const row = await this.prisma.$transaction(async (tx) => {
      return tx.user.create({
        data: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          password,
          status: user.status,
          loginsCounter: user.loginsCounter,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          emails: {
            create: emailCreates,
          },
        },
        include: userIncludeEmails,
      });
    });

    return toDomain(row as UserRowWithEmails);
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<{ data: User[]; meta: PaginationMeta }> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: userIncludeEmails,
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: rows.map(toDomain),
      meta: buildPaginationMeta(total, page, limit),
    };
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { id },
      include: userIncludeEmails,
    });
    return row ? toDomain(row) : null;
  }

  async findByName(
    firstName: string,
    lastName: string,
  ): Promise<User | null> {
    const row = await this.prisma.user.findFirst({
      where: { firstName, lastName },
      include: userIncludeEmails,
    });
    return row ? toDomain(row) : null;
  }

  async update(user: User): Promise<User> {
    const row = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        loginsCounter: user.loginsCounter,
        updatedAt: user.updatedAt,
        ...(user.password !== undefined ? { password: user.password } : {}),
      },
      include: userIncludeEmails,
    });

    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
