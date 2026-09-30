import { describe, expect, it } from "vitest";

import { LoginSchema, ResetPasswordSchema, SignupSchema } from "./auth";

describe("auth schemas", () => {
  it("normalises the email", () => {
    expect(LoginSchema.parse({ email: " Owner@ABC.in ", password: "x" }).email).toBe(
      "owner@abc.in",
    );
  });

  it("enforces the password policy", () => {
    const errors = (password: string) =>
      SignupSchema.safeParse({ fullName: "A", email: "a@b.co", password }).error?.issues.map(
        (i) => i.message,
      ) ?? [];

    expect(errors("short1")).toContain("Use at least 8 characters");
    expect(errors("longenough")).toContain("Include at least one number");
    expect(errors("12345678")).toContain("Include at least one letter");
    expect(errors("letters123")).toEqual([]);
  });

  it("requires matching passwords on reset", () => {
    const result = ResetPasswordSchema.safeParse({
      password: "letters123",
      confirmPassword: "letters124",
    });
    expect(result.error?.issues[0]).toMatchObject({ path: ["confirmPassword"] });
  });
});
