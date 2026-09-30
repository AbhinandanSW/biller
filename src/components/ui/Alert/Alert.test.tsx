// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "../EmptyState";
import { Alert } from "./Alert";

describe("Alert", () => {
  it("uses role=alert only for danger", () => {
    render(
      <>
        <Alert variant="danger" title="Could not save" />
        <Alert title="Saved" />
      </>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Could not save");
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
  });
});

describe("EmptyState", () => {
  it("renders title, description and action", () => {
    render(
      <EmptyState
        title="No products yet"
        description="Add your first product to start taking orders."
        action={<button>Add product</button>}
      />,
    );
    expect(screen.getByRole("heading", { name: "No products yet" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add product" })).toBeInTheDocument();
  });
});
