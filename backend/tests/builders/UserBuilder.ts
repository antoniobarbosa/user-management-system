import { faker } from "@faker-js/faker";
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

  /** bcrypt hash armazenado como `user.password` */
  withPasswordHash(hash: string): this {
    this.passwordHash = hash;
    return this;
  }

  build(): User {
    const user = new User();
    user.id = this.id;
    user.createdAt = this.createdAt;
    user.updatedAt = this.updatedAt;
    user.firstName = this.firstName;
    user.lastName = this.lastName;
    user.status = this.status;
    user.loginsCounter = this.loginsCounter;
    if (this.passwordHash !== undefined) {
      user.password = this.passwordHash;
    }
    return user;
  }
}
