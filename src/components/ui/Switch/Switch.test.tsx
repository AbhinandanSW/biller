// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Checkbox } from "../Checkbox";
import { Switch } from "./Switch";

describe("Switch", () => {
  it("toggles and is labelled and described", async () => {
    const onCheckedChange = vi.fn();
    render(
      <Switch
        label="GST enabled"
        description="Charge GST on orders"
        onCheckedChange={onCheckedChange}
      />,
    );
    const control = screen.getByRole("switch", { name: "GST enabled" });
    expect(control).toHaveAccessibleDescription("Charge GST on orders");
    await userEvent.click(control);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});

describe("Checkbox", () => {
  it("toggles when its label is clicked", async () => {
    const onCheckedChange = vi.fn();
    render(<Checkbox label="Remember me" onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByText("Remember me"));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("checkbox", { name: "Remember me" })).toBeInTheDocument();
  });
});
