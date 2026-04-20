import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@domain/errors.js";
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

export type StartSessionResult = {
  session: Session;
  user: User;
};

/** Options for {@link SessionService.startSessionForUser}. */
export type StartSessionForUserOptions = {
  /**
   * When `false`, does not increment `loginsCounter` (registration / admin-created user
   * with an initial session — not a password sign-in). Default `true` (sign-in).
   */
  incrementLoginCount?: boolean;
};

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
      throw new UnauthorizedError("Invalid credentials");
    }

    const user = await this.userRepository.findById(userEmail.userId);
    if (!user) {
      this.log.warn(
        { reason: "unknown_user", userId: userEmail.userId },
        "Sign-in failed",
      );
      throw new UnauthorizedError("Invalid credentials");
    }

    if (!user.password) {
      this.log.warn({ reason: "missing_password_hash", userId: user.id }, "Sign-in failed");
      throw new UnauthorizedError("Invalid credentials");
    }
    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      this.log.warn({ reason: "invalid_password", userId: user.id }, "Sign-in failed");
      throw new UnauthorizedError("Invalid credentials");
    }

    if (user.status === UserStatus.INACTIVE) {
      this.log.warn({ reason: "inactive_user", userId: user.id }, "Sign-in failed");
      throw new ValidationError("User is inactive");
    }

    return (await this.startSessionForUser(user, { incrementLoginCount: true }))
      .session;
  }

  async startSessionForUser(
    user: User,
    options?: StartSessionForUserOptions,
  ): Promise<StartSessionResult> {
    SessionValidator.validateCreate(user);

    const incrementLoginCount = options?.incrementLoginCount !== false;

    const now = new Date();
    const sessionEntity = new Session();
    sessionEntity.id = randomUUID();
    sessionEntity.userId = user.id;
    sessionEntity.createdAt = now;
    sessionEntity.terminatedAt = null;

    const updatedUser = user.duplicate();
    updatedUser.loginsCounter = incrementLoginCount
      ? user.loginsCounter + 1
      : user.loginsCounter;
    updatedUser.updatedAt = now;
    const savedUser = await this.userRepository.update(updatedUser);

    const session = await this.sessionRepository.create(sessionEntity);
    this.log.info(
      {
        userId: user.id,
        sessionId: session.id,
        event: "session_created",
      },
      "Session created",
    );
    return { session, user: savedUser };
  }

  async terminateSession(id: string): Promise<Session> {
    const session = await this.sessionRepository.findById(id);
    if (!session) {
      throw new NotFoundError("Session not found");
    }
    if (session.terminatedAt != null) {
      throw new ValidationError("Session already terminated");
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
