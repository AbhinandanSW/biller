// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Drawer, DrawerContent } from "./Drawer";

describe("Drawer", () => {
  it("renders an accessible dialog on the requested side", () => {
    render(
      <Drawer open>
        <DrawerContent title="Filters" side="bottom">
          Content
        </DrawerContent>
      </Drawer>,
    );
    const dialog = screen.getByRole("dialog", { name: "Filters" });
    expect(dialog.className).toContain("bottom-0");
  });
});
