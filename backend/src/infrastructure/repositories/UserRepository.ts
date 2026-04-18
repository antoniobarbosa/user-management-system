import type { PrismaClient } from "@prisma/client";
import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
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

function mapStatus(value: string): UserStatus {
  if (value === UserStatus.ACTIVE) return UserStatus.ACTIVE;
  if (value === UserStatus.INACTIVE) return UserStatus.INACTIVE;
  throw new Error(`Invalid user status in database: ${value}`);
}

function toDomain(row: UserRow): User {
  const user = new User();
  user.id = row.id;
  user.firstName = row.firstName;
  user.lastName = row.lastName;
  user.password = row.password;
  user.status = mapStatus(row.status);
  user.loginsCounter = row.loginsCounter;
  user.createdAt = row.createdAt;
  user.updatedAt = row.updatedAt;
  return user;
}

export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient = prisma) {}

  async create(user: User): Promise<User> {
    if (user.password === undefined) {
      throw new Error("User password is required for persistence");
    }

    const row = await this.prisma.user.create({
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        password: user.password,
        status: user.status,
        loginsCounter: user.loginsCounter,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

    return toDomain(row);
  }

  async findAll(
    page: number,
    limit: number,
  ): Promise<{ data: User[]; total: number }> {
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count(),
    ]);

    return { data: rows.map(toDomain), total };
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
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
    });

    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
