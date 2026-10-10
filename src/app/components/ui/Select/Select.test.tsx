// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Field } from "../Field";
import { Select } from "./Select";

const states = [
  { value: "03", label: "Punjab" },
  { value: "06", label: "Haryana" },
];

describe("Select", () => {
  it("is labelled by its Field and shows the placeholder", () => {
    render(
      <Field label="State" error="Select a state">
        <Select options={states} placeholder="Choose a state" />
      </Field>,
    );
    const trigger = screen.getByRole("combobox", { name: "State" });
    expect(trigger).toHaveTextContent("Choose a state");
    expect(trigger).toHaveAttribute("aria-invalid", "true");
    expect(trigger).toHaveAccessibleDescription("Select a state");
  });

  it("shows the selected option", () => {
    render(<Select aria-label="State" options={states} defaultValue="06" />);
    expect(screen.getByRole("combobox", { name: "State" })).toHaveTextContent("Haryana");
  });

  it("submits its value with a form", () => {
    const { container } = render(
      <form>
        <Select aria-label="State" name="stateCode" options={states} defaultValue="03" />
      </form>,
    );
    const data = new FormData(container.querySelector("form")!);
    expect(data.get("stateCode")).toBe("03");
  });
});
