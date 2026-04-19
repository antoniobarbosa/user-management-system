import { Email } from "@domain/shared/valueObjects/Email.js";
import { describe, expect, it } from "vitest";

describe("Email", () => {
  it('throws "Email is required" if empty', () => {
    expect(() => new Email("")).toThrow("Email is required");
    expect(() => new Email("   ")).toThrow("Email is required");
    expect(() => new Email("\t\n")).toThrow("Email is required");
  });

  it('throws "Invalid email format" if invalid format', () => {
    expect(() => new Email("not-an-email")).toThrow("Invalid email format");
    expect(() => new Email("@nodomain.com")).toThrow("Invalid email format");
    expect(() => new Email("missing-at.com")).toThrow("Invalid email format");
  });

  it("normalizes to lowercase and trim", () => {
    const email = new Email("  Jane.Doe@Example.COM  ");
    expect(email.toString()).toBe("jane.doe@example.com");
  });

  it("equals works correctly", () => {
    const a = new Email("hello@Example.com");
    const b = new Email("HELLO@example.com");
    const c = new Email("other@example.com");
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  it("does not throw for valid email", () => {
    expect(() => new Email("user.name+tag@sub.example.co.uk")).not.toThrow();
    expect(new Email("simple@example.org").toString()).toBe("simple@example.org");
  });
});
