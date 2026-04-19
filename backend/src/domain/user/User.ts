import { randomUUID } from "node:crypto";
import { ConflictError } from "../errors.js";
import { UserEmail } from "../email/UserEmail.js";
import { BaseEntity } from "../shared/BaseEntity.js";
import { Email } from "../shared/valueObjects/Email.js";
import type { UserStatus } from "./UserStatus.js";

// Future: UserEmail as full aggregate with multiple emails per user
export class User extends BaseEntity {
  firstName!: string;
  lastName!: string;
  status!: UserStatus;
  loginsCounter!: number;
  updatedAt!: Date;
  /** Stored password hash after registration (never plaintext). */
  password?: string;
  private emails: UserEmail[] = [];

  addEmail(email: Email, primary = false): UserEmail {
    if (this.emails.some((e) => e.email.equals(email))) {
      throw new ConflictError("Email already in use");
    }
    if (primary) {
      for (const e of this.emails) {
        e.primary = false;
      }
    }
    const userEmail = new UserEmail();
    userEmail.id = randomUUID();
    userEmail.userId = this.id;
    userEmail.email = email;
    userEmail.primary = primary;
    userEmail.createdAt = new Date();
    this.emails.push(userEmail);
    return userEmail;
  }

  get primaryEmail(): Email | undefined {
    const row = this.emails.find((e) => e.primary);
    return row?.email;
  }

  get allEmails(): UserEmail[] {
    return [...this.emails];
  }

  duplicate(): User {
    return User.rehydrate(
      {
        id: this.id,
        firstName: this.firstName,
        lastName: this.lastName,
        status: this.status,
        loginsCounter: this.loginsCounter,
        password: this.password,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      },
      this.emails,
    );
  }

  static rehydrate(
    props: {
      id: string;
      firstName: string;
      lastName: string;
      status: UserStatus;
      loginsCounter: number;
      password?: string;
      createdAt: Date;
      updatedAt: Date;
    },
    emails: UserEmail[],
  ): User {
    const u = new User();
    Object.assign(u, props);
    u.emails = emails.map((ue) => {
      const c = new UserEmail();
      c.id = ue.id;
      c.userId = ue.userId;
      c.email = ue.email;
      c.primary = ue.primary;
      c.createdAt = ue.createdAt;
      return c;
    });
    return u;
  }
}
