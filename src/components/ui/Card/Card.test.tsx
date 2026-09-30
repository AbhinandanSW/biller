// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card, CardContent, CardHeader } from "./Card";

describe("Card", () => {
  it("renders a titled section with actions", () => {
    render(
      <Card aria-labelledby="t">
        <CardHeader title={<span id="t">Business profile</span>} actions={<button>Edit</button>} />
        <CardContent>Body</CardContent>
      </Card>,
    );
    expect(screen.getByRole("region", { name: "Business profile" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Business profile" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });
});
