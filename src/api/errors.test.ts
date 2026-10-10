import { describe, expect, it, vi } from "vitest";

import { fromDatabaseError } from "./errors";

describe("fromDatabaseError", () => {
  it("maps our SQLSTATEs to API error codes and keeps our messages", () => {
    const error = fromDatabaseError({
      code: "42501",
      message: "Only an owner can change ownership",
    });
    expect(error).toMatchObject({
      code: "FORBIDDEN",
      status: 403,
      message: "Only an owner can change ownership",
    });
    expect(fromDatabaseError({ code: "P0002", message: "Member not found" }).code).toBe(
      "NOT_FOUND",
    );
  });

  it("hides constraint details", () => {
    expect(
      fromDatabaseError({
        code: "23514",
        message: 'violates check constraint "organizations_gstin_check"',
      }),
    ).toMatchObject({ code: "VALIDATION_ERROR", message: "Some values are invalid" });
  });

  it("treats unknown errors as internal", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(fromDatabaseError({ code: "XX000", message: "boom" })).toMatchObject({
      code: "INTERNAL_ERROR",
      message: "Something went wrong",
    });
    spy.mockRestore();
  });
});
