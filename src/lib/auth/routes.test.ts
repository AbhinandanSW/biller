import { describe, expect, it } from "vitest";

import { isAuthPage, isPublicPath, safeNextPath } from "./routes";

describe("safeNextPath", () => {
  it("allows same-site paths", () => {
    expect(safeNextPath("/orders/new?customer=1")).toBe("/orders/new?customer=1");
    expect(safeNextPath("/reset-password")).toBe("/reset-password");
  });

  it("rejects anything that could leave the site", () => {
    for (const value of [
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "javascript:alert(1)",
      "evil.com",
      "",
      null,
      undefined,
    ]) {
      expect(safeNextPath(value), String(value)).toBe("/dashboard");
    }
  });
});

describe("route classification", () => {
  it("knows which paths are public", () => {
    expect(isPublicPath("/")).toBe(true);
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/auth/confirm")).toBe(true);
    expect(isPublicPath("/dashboard")).toBe(false);
    expect(isPublicPath("/onboarding")).toBe(false);
    expect(isPublicPath("/reset-password")).toBe(false);
    expect(isPublicPath("/loginx")).toBe(false);
  });

  it("knows which pages signed-in users skip", () => {
    expect(isAuthPage("/signup")).toBe(true);
    expect(isAuthPage("/reset-password")).toBe(false);
  });
});
