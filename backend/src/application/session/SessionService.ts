import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import type { IUserEmailRepository } from "@domain/repositories/IUserEmailRepository.js";
import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import type { ISessionRepository } from "@domain/repositories/ISessionRepository.js";
import { Email } from "@domain/shared/valueObjects/Email.js";
import { Session } from "@domain/session/Session.js";
import { User } from "@domain/user/User.js";
import { UserStatus } from "@domain/user/UserStatus.js";
import type { AppLogger } from "../logger.js";
import { noopLogger } from "../logger.js";
import { SessionValidator } from "./SessionValidator.js";

export class SessionService {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly userRepository: IUserRepository,
    private readonly userEmailRepository: IUserEmailRepository,
    private readonly log: AppLogger = noopLogger,
  ) {}

  async signIn(email: string, password: string): Promise<Session> {
    this.log.info({ event: "sign_in_attempt" }, "Sign-in attempt");
    const emailVo = new Email(email);
    const userEmail = await this.userEmailRepository.findByEmail(emailVo);
    if (!userEmail) {
      this.log.warn({ reason: "unknown_email" }, "Sign-in failed");
      throw new Error("User not found");
    }

    const user = await this.userRepository.findById(userEmail.userId);
    if (!user) {
      this.log.warn(
        { reason: "unknown_user", userId: userEmail.userId },
        "Sign-in failed",
      );
      throw new Error("User not found");
    }

    if (!user.password) {
      this.log.warn({ reason: "missing_password_hash", userId: user.id }, "Sign-in failed");
      throw new Error("Invalid password");
    }
    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      this.log.warn({ reason: "invalid_password", userId: user.id }, "Sign-in failed");
      throw new Error("Invalid password");
    }

    if (user.status === UserStatus.INACTIVE) {
      this.log.warn({ reason: "inactive_user", userId: user.id }, "Sign-in failed");
      throw new Error("User is inactive");
    }

    return this.startSessionForUser(user);
  }

  async createSession(userId: string): Promise<Session> {
    this.log.info({ userId, event: "session_create_request" }, "Creating session");
    const user = await this.userRepository.findById(userId);
    SessionValidator.validateCreate(user);
    return this.startSessionForUser(user);
  }

  private async startSessionForUser(user: User): Promise<Session> {
    const now = new Date();
    const session = new Session();
    session.id = randomUUID();
    session.userId = user.id;
    session.createdAt = now;
    session.terminatedAt = null;

    const updatedUser = user.duplicate();
    updatedUser.loginsCounter = user.loginsCounter + 1;
    updatedUser.updatedAt = now;
    await this.userRepository.update(updatedUser);

    const created = await this.sessionRepository.create(session);
    this.log.info(
      {
        userId: user.id,
        sessionId: created.id,
        event: "session_created",
      },
      "Session created",
    );
    return created;
  }

  async terminateSession(id: string): Promise<Session> {
    const session = await this.sessionRepository.findById(id);
    if (!session) {
      throw new Error("Session not found");
    }
    if (session.terminatedAt != null) {
      throw new Error("Session already terminated");
    }

    const now = new Date();
    session.terminatedAt = now;
    await this.sessionRepository.terminate(session.id);
    this.log.info(
      { sessionId: id, userId: session.userId, event: "session_terminated" },
      "Session terminated",
    );
    return session;
  }
}
