import type { Email } from "../shared/valueObjects/Email.js";
import type { UserEmail } from "../email/UserEmail.js";

export interface IUserEmailRepository {
  findByEmail(email: Email): Promise<UserEmail | null>;
  findByUserId(userId: string): Promise<UserEmail[]>;
  create(userEmail: UserEmail): Promise<UserEmail>;
}
