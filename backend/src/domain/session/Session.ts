import { BaseEntity } from "../shared/BaseEntity.js";

export class Session extends BaseEntity {
  /** UUID of the owning user */
  userId!: string;
  terminatedAt!: Date | null;
}
