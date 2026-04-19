import { faker } from "@faker-js/faker";
import { UserEmail } from "@domain/email/UserEmail.js";
import { Email } from "@domain/shared/valueObjects/Email.js";

export class UserEmailBuilder {
  private id!: string;
  private userId!: string;
  private email!: Email;
  private primary!: boolean;
  private createdAt!: Date;

  private constructor() {}

  static aUserEmail(): UserEmailBuilder {
    const builder = new UserEmailBuilder();
    builder.id = faker.string.uuid();
    builder.userId = faker.string.uuid();
    builder.email = new Email(faker.internet.email());
    builder.primary = true;
    builder.createdAt = faker.date.recent({ days: 30 });
    return builder;
  }

  withEmail(email: string): this {
    this.email = new Email(email);
    return this;
  }

  withUserId(userId: string): this {
    this.userId = userId;
    return this;
  }

  withPrimary(primary: boolean): this {
    this.primary = primary;
    return this;
  }

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this.createdAt = createdAt;
    return this;
  }

  build(): UserEmail {
    const userEmail = new UserEmail();
    userEmail.id = this.id;
    userEmail.userId = this.userId;
    userEmail.email = this.email;
    userEmail.primary = this.primary;
    userEmail.createdAt = this.createdAt;
    return userEmail;
  }
}
