import type { FastifyReply, FastifyRequest } from "fastify";
import type { Session } from "@domain/session/Session.js";
import type { User } from "@domain/user/User.js";
import { UserStatus } from "@domain/user/UserStatus.js";
import type {
  CreateUserInput,
  UpdateUserInput,
} from "@application/user/UserService.js";
import { UserService } from "@application/user/UserService.js";

function toUserResponse(user: User) {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    primaryEmail: user.primaryEmail?.toString(),
    status: user.status,
    loginsCounter: user.loginsCounter,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function toSessionResponse(session: Session) {
  return {
    id: session.id,
    userId: session.userId,
    createdAt: session.createdAt,
    terminatedAt: session.terminatedAt,
  };
}

function parseUserStatus(value: unknown): UserStatus | undefined {
  if (value === undefined || value === null) return undefined;
  if (value === UserStatus.ACTIVE || value === UserStatus.INACTIVE) {
    return value;
  }
  throw new Error("Invalid status");
}

export class UserController {
  constructor(private readonly userService: UserService) {}

  async createUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    request.log.info({ handler: "createUser" }, "Handling user registration");
    const body = request.body as Record<string, unknown>;
    const input: CreateUserInput = {
      firstName: String(body.firstName ?? ""),
      lastName: String(body.lastName ?? ""),
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
      status: parseUserStatus(body.status),
    };

    const { user, session } = await this.userService.createUser(input);
    request.log.info(
      { userId: user.id, sessionId: session?.id ?? null },
      "User registration response sent",
    );
    reply.code(201).send({
      user: toUserResponse(user),
      session: session ? toSessionResponse(session) : null,
    });
  }

  async findAll(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const q = request.query as Record<string, string | undefined>;
    const pageRaw = q.page ?? "1";
    const limitRaw = q.limit ?? "6";
    const page = Number(pageRaw);
    const limit = Number(limitRaw);

    if (!Number.isInteger(page) || page < 1) {
      throw new Error("Invalid page");
    }
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("Invalid limit");
    }

    const result = await this.userService.findAll(page, limit);
    reply.send({
      data: result.data.map(toUserResponse),
      meta: result.meta,
    });
  }

  async findById(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    const user = await this.userService.findById(id);
    if (!user) {
      throw new Error("User not found");
    }
    reply.send(toUserResponse(user));
  }

  async updateUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    request.log.info({ handler: "updateUser", userId: id }, "Handling user update");
    const body = request.body as Record<string, unknown>;
    const input: UpdateUserInput = {};

    if (body.firstName !== undefined) {
      input.firstName = String(body.firstName);
    }
    if (body.lastName !== undefined) {
      input.lastName = String(body.lastName);
    }
    if (body.status !== undefined) {
      input.status = parseUserStatus(body.status);
    }
    if (body.loginsCounter !== undefined) {
      input.loginsCounter = Number(body.loginsCounter);
    }

    const user = await this.userService.updateUser(id, input);
    reply.send(toUserResponse(user));
  }

  async deleteUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string };
    request.log.info({ handler: "deleteUser", userId: id }, "Handling user deletion");
    await this.userService.deleteUser(id);
    reply.code(204).send();
  }
}
