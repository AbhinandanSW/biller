// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Button } from "../Button";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "./Dialog";

function Example() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Cancel order</Button>
      </DialogTrigger>
      <DialogContent
        title="Cancel this order?"
        description="The customer will not be charged."
        footer={
          <DialogClose asChild>
            <Button variant="secondary">Keep order</Button>
          </DialogClose>
        }
      >
        Body
      </DialogContent>
    </Dialog>
  );
}

describe("Dialog", () => {
  it("opens as an accessible, titled dialog and moves focus into it", async () => {
    render(<Example />);
    await userEvent.click(screen.getByRole("button", { name: "Cancel order" }));

    const dialog = screen.getByRole("dialog", { name: "Cancel this order?" });
    expect(dialog).toHaveAccessibleDescription("The customer will not be charged.");
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it("closes with Escape, the close button, or a DialogClose", async () => {
    render(<Example />);
    const open = () => userEvent.click(screen.getByRole("button", { name: "Cancel order" }));

    await open();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await open();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await open();
    await userEvent.click(screen.getByRole("button", { name: "Keep order" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
