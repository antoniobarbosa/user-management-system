import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import type { IUserEmailRepository } from "@domain/repositories/IUserEmailRepository.js";
import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import type { ISessionRepository } from "@domain/repositories/ISessionRepository.js";
import { Email } from "@domain/shared/valueObjects/Email.js";
import { Session } from "@domain/session/Session.js";
import { User } from "@domain/user/User.js";
import { UserStatus } from "@domain/user/UserStatus.js";
import { SessionValidator } from "./SessionValidator.js";

export class SessionService {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly userRepository: IUserRepository,
    private readonly userEmailRepository: IUserEmailRepository,
  ) {}

  async signIn(email: string, password: string): Promise<Session> {
    const emailVo = new Email(email);
    const userEmail = await this.userEmailRepository.findByEmail(emailVo);
    if (!userEmail) {
      throw new Error("User not found");
    }

    const user = await this.userRepository.findById(userEmail.userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (!user.password) {
      throw new Error("Invalid password");
    }
    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      throw new Error("Invalid password");
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new Error("User is inactive");
    }

    return this.startSessionForUser(user);
  }

  async createSession(userId: string): Promise<Session> {
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

    const updatedUser = Object.assign(new User(), user, {
      loginsCounter: user.loginsCounter + 1,
      updatedAt: now,
    });
    await this.userRepository.update(updatedUser);

    return this.sessionRepository.create(session);
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
    return session;
  }
}
