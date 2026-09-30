// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Input } from "../Input";
import { Textarea } from "../Textarea";
import { Field } from "./Field";

describe("Field", () => {
  it("labels its control", () => {
    render(
      <Field label="Business name" required>
        <Input name="name" />
      </Field>,
    );
    const input = screen.getByRole("textbox", { name: /Business name/ });
    expect(input).toBeRequired();
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("describes the control with its hint", () => {
    render(
      <Field label="GSTIN" description="15 characters">
        <Input />
      </Field>,
    );
    expect(screen.getByRole("textbox")).toHaveAccessibleDescription("15 characters");
  });

  it("marks the control invalid and replaces the hint with the error", () => {
    render(
      <Field label="GSTIN" description="15 characters" error="Enter a valid GSTIN">
        <Textarea />
      </Field>,
    );
    const control = screen.getByRole("textbox", { name: "GSTIN" });
    expect(control).toHaveAttribute("aria-invalid", "true");
    expect(control).toHaveAccessibleDescription("Enter a valid GSTIN");
    expect(screen.queryByText("15 characters")).not.toBeInTheDocument();
  });

  it("works without a Field", () => {
    render(<Input aria-label="Search" prefix="₹" />);
    expect(screen.getByRole("textbox", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByText("₹")).toBeInTheDocument();
  });
});
