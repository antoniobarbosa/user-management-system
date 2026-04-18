import { BaseEntity } from "../shared/BaseEntity.js";
import type { UserStatus } from "./UserStatus.js";

export class User extends BaseEntity {
  firstName!: string;
  lastName!: string;
  status!: UserStatus;
  loginsCounter!: number;
  updatedAt!: Date;
  /** Hash armazenado após registro (nunca o texto plano). */
  password?: string;
}
