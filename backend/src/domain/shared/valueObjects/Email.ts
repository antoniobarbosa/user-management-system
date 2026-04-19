import { ValidationError } from "../../errors.js";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class Email {
  private readonly value: string;

  constructor(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) {
      throw new ValidationError("Email is required");
    }
    const normalized = trimmed.toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new ValidationError("Invalid email format");
    }
    this.value = normalized;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
