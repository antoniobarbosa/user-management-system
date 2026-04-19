import { faker } from "@faker-js/faker";
import { UserEmail } from "@domain/email/UserEmail.js";
import { Email } from "@domain/shared/valueObjects/Email.js";
import { User } from "@domain/user/User.js";
import { UserStatus } from "@domain/user/UserStatus.js";

export class UserBuilder {
  private id!: string;
  private createdAt!: Date;
  private updatedAt!: Date;
  private firstName!: string;
  private lastName!: string;
  private status!: UserStatus;
  private loginsCounter!: number;
  private passwordHash?: string;
  private hydratedEmails: UserEmail[] | null = null;

  private constructor() {}

  static aUser(): UserBuilder {
    const builder = new UserBuilder();
    builder.id = faker.string.uuid();
    builder.firstName = faker.person.firstName();
    builder.lastName = faker.person.lastName();
    builder.status = UserStatus.ACTIVE;
    builder.loginsCounter = faker.number.int({ min: 0, max: 50 });
    const createdAt = faker.date.past({ years: 3 });
    builder.createdAt = createdAt;
    builder.updatedAt = faker.date.between({
      from: createdAt,
      to: new Date(),
    });
    return builder;
  }

  static anInactiveUser(): UserBuilder {
    return UserBuilder.aUser().withStatus(UserStatus.INACTIVE);
  }

  withId(id: string): this {
    this.id = id;
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this.createdAt = createdAt;
    return this;
  }

  withUpdatedAt(updatedAt: Date): this {
    this.updatedAt = updatedAt;
    return this;
  }

  withFirstName(firstName: string): this {
    this.firstName = firstName;
    return this;
  }

  withLastName(lastName: string): this {
    this.lastName = lastName;
    return this;
  }

  withStatus(status: UserStatus): this {
    this.status = status;
    return this;
  }

  withLoginsCounter(loginsCounter: number): this {
    this.loginsCounter = loginsCounter;
    return this;
  }

  /** bcrypt hash stored as `user.password` */
  withPasswordHash(hash: string): this {
    this.passwordHash = hash;
    return this;
  }

  withEmails(...emails: UserEmail[]): this {
    this.hydratedEmails = [...emails];
    return this;
  }

  withPrimaryEmail(email: string): this {
    const ue = new UserEmail();
    ue.id = faker.string.uuid();
    ue.userId = this.id;
    ue.email = new Email(email);
    ue.primary = true;
    ue.createdAt = this.createdAt;
    this.hydratedEmails = [ue];
    return this;
  }

  build(): User {
    const emails =
      this.hydratedEmails?.map((e) => {
        const c = new UserEmail();
        c.id = e.id;
        c.userId = this.id;
        c.email = e.email;
        c.primary = e.primary;
        c.createdAt = e.createdAt;
        return c;
      }) ?? [];

    const user = User.rehydrate(
      {
        id: this.id,
        firstName: this.firstName,
        lastName: this.lastName,
        status: this.status,
        loginsCounter: this.loginsCounter,
        password: this.passwordHash,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      },
      emails,
    );
    return user;
  }
}
