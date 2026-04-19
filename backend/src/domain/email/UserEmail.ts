import { BaseEntity } from "../shared/BaseEntity.js";
import type { Email } from "../shared/valueObjects/Email.js";

export class UserEmail extends BaseEntity {
  userId!: string;
  email!: Email;
  primary!: boolean;
}
