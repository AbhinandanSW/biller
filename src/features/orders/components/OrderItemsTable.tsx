import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui";
import { formatMoney, formatPercent } from "@/lib/utils/format";

import type { Order } from "../types";

/** Read-only items with the per-line calculation. */
export function OrderItemsTable({ order }: { order: Order }) {
  const lines = new Map(order.totals.lines.map((l) => [l.productId, l]));

  return (
    <Table aria-label="Items">
      <TableHeader>
        <TableRow>
          <TableHead className="w-8">#</TableHead>
          <TableHead>Item</TableHead>
          <TableHead numeric>Qty</TableHead>
          <TableHead numeric>Rate</TableHead>
          <TableHead numeric className="hidden sm:table-cell">
            Discount
          </TableHead>
          <TableHead numeric className="hidden md:table-cell">
            Taxable
          </TableHead>
          <TableHead numeric className="hidden md:table-cell">
            GST
          </TableHead>
          <TableHead numeric>Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {order.items.map((item, index) => {
          const line = lines.get(item.id);
          return (
            <TableRow key={item.id}>
              <TableCell className="tabular text-muted-foreground">{index + 1}</TableCell>
              <TableCell>
                <div className="font-medium">{item.name}</div>
                {item.hsnCode && (
                  <div className="text-caption text-muted-foreground">HSN {item.hsnCode}</div>
                )}
              </TableCell>
              <TableCell numeric className="whitespace-nowrap">
                {item.quantity} {item.unit}
              </TableCell>
              <TableCell numeric>{formatMoney(item.rate)}</TableCell>
              <TableCell numeric className="hidden text-muted-foreground sm:table-cell">
                {line && Number(line.discountTotal) > 0
                  ? `− ${formatMoney(line.discountTotal)}`
                  : "—"}
              </TableCell>
              <TableCell numeric className="hidden md:table-cell">
                {formatMoney(line?.taxableAmount)}
              </TableCell>
              <TableCell numeric className="hidden md:table-cell">
                {formatMoney(line?.taxAmount)}
                <div className="text-caption text-muted-foreground">
                  {formatPercent(item.taxRate)}
                </div>
              </TableCell>
              <TableCell numeric className="font-medium">
                {formatMoney(line?.lineTotal)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
