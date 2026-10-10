// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./Badge";

describe("Badge", () => {
  it("applies the variant", () => {
    render(<Badge variant="success">Paid</Badge>);
    expect(screen.getByText("Paid").className).toContain("text-success");
  });
});
