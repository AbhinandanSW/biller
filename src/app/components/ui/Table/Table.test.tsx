// @vitest-environment jsdom

import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./Table";

describe("Table", () => {
  it("renders an accessible table with numeric columns right-aligned", () => {
    render(
      <Table aria-label="Products">
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead numeric>Price</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Product A</TableCell>
            <TableCell numeric>₹500.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const table = screen.getByRole("table", { name: "Products" });
    expect(within(table).getByRole("columnheader", { name: "Price" })).toHaveAttribute(
      "scope",
      "col",
    );
    const price = within(table).getByRole("cell", { name: "₹500.00" });
    expect(price.className).toContain("text-right");
    expect(price.className).toContain("tabular");
  });
});
