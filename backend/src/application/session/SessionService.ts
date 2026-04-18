import { randomUUID } from "node:crypto";
import type { IUserRepository } from "@domain/repositories/IUserRepository.js";
import type { ISessionRepository } from "@domain/repositories/ISessionRepository.js";
import { Session } from "@domain/session/Session.js";
import { User } from "@domain/user/User.js";
import { SessionValidator } from "./SessionValidator.js";

export class SessionService {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async createSession(userId: string): Promise<Session> {
    const user = await this.userRepository.findById(userId);
    SessionValidator.validateCreate(user);

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
