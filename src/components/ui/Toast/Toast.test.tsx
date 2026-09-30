// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Toaster } from "./Toast";
import { toast } from "./toast-store";

describe("toast", () => {
  it("shows a toast from anywhere and dismisses it", async () => {
    render(<Toaster />);
    act(() => {
      toast.success("Invoice sent", "INV-2026-000001 was emailed to ABC Traders");
    });

    expect(screen.getByText("Invoice sent")).toBeInTheDocument();
    expect(screen.getByText(/was emailed/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Invoice sent")).not.toBeInTheDocument();
  });

  it("keeps at most three toasts", () => {
    render(<Toaster />);
    act(() => {
      for (const n of [1, 2, 3, 4]) toast({ title: `Toast ${n}` });
    });
    expect(screen.queryByText("Toast 1")).not.toBeInTheDocument();
    expect(screen.getByText("Toast 4")).toBeInTheDocument();
  });
});
