import { describe, expect, it } from "vitest";

import { cn } from "./cn";

describe("cn", () => {
  it("keeps a custom font size alongside a text colour", () => {
    expect(cn("text-body text-foreground", "text-muted-foreground")).toBe(
      "text-body text-muted-foreground",
    );
    expect(cn("text-body", "text-caption")).toBe("text-caption");
  });

  it("drops falsy values", () => {
    expect(cn("a", false && "b", undefined, "c")).toBe("a c");
  });
});
