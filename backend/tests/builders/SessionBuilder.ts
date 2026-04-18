import { faker } from "@faker-js/faker";
import { Session } from "@domain/session/Session.js";

export class SessionBuilder {
  private id!: string;
  private createdAt!: Date;
  private userId!: string;
  private terminatedAt!: Date | null;

  private constructor() {}

  static aSession(): SessionBuilder {
    const builder = new SessionBuilder();
    builder.id = faker.string.uuid();
    builder.userId = faker.string.uuid();
    builder.createdAt = faker.date.recent({ days: 30 });
    builder.terminatedAt = null;
    return builder;
  }

  static aTerminatedSession(): SessionBuilder {
    const createdAt = faker.date.past({ years: 1 });
    return SessionBuilder.aSession()
      .withCreatedAt(createdAt)
      .withTerminatedAt(
        faker.date.between({ from: createdAt, to: new Date() }),
      );
  }

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this.createdAt = createdAt;
    return this;
  }

  withUserId(userId: string): this {
    this.userId = userId;
    return this;
  }

  withTerminatedAt(terminatedAt: Date | null): this {
    this.terminatedAt = terminatedAt;
    return this;
  }

  build(): Session {
    const session = new Session();
    session.id = this.id;
    session.createdAt = this.createdAt;
    session.userId = this.userId;
    session.terminatedAt = this.terminatedAt;
    return session;
  }
}
