// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";

describe("Tabs", () => {
  it("switches panels by click and arrow keys", async () => {
    render(
      <Tabs defaultValue="orders">
        <TabsList aria-label="Customer">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">Order history</TabsContent>
        <TabsContent value="invoices">Invoice history</TabsContent>
      </Tabs>,
    );

    expect(screen.getByRole("tabpanel")).toHaveTextContent("Order history");

    await userEvent.click(screen.getByRole("tab", { name: "Invoices" }));
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Invoice history");

    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Orders" })).toHaveAttribute("aria-selected", "true");
  });
});
