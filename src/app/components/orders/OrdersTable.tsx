import Link from "next/link";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui";
import type { OrderRow } from "@/types/order";
import { formatDate, formatMoney } from "@/utils/format";

import { OrderStatusBadge, PaymentBadge } from "./StatusBadges";

export function OrdersTable({
  orders,
  showCustomer = true,
  showInvoice = true,
  label = "Orders",
}: {
  orders: OrderRow[];
  showCustomer?: boolean;
  showInvoice?: boolean;
  label?: string;
}) {
  return (
    <Table aria-label={label}>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          {showCustomer && <TableHead>Customer</TableHead>}
          {showInvoice && <TableHead className="hidden md:table-cell">Invoice</TableHead>}
          <TableHead numeric>Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((o) => (
          <TableRow key={o.id} className="relative">
            <TableCell>
              <Link
                href={`/orders/${o.id}`}
                className="font-medium whitespace-nowrap after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
              >
                {o.number}
              </Link>
              <div className="text-caption text-muted-foreground">{formatDate(o.date)}</div>
            </TableCell>
            {showCustomer && (
              <TableCell>
                <div className="max-w-56 truncate">{o.customerName}</div>
                <div className="text-caption text-muted-foreground">
                  {o.itemCount} {o.itemCount === 1 ? "item" : "items"}
                </div>
              </TableCell>
            )}
            {showInvoice && (
              <TableCell className="hidden whitespace-nowrap md:table-cell">
                {o.invoiceNumber ? (
                  <span className="font-mono text-caption">{o.invoiceNumber}</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
            )}
            <TableCell numeric className="font-medium">
              {formatMoney(o.grandTotal)}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1.5">
                <OrderStatusBadge status={o.status} />
                {o.invoiceNumber && o.status !== "CANCELLED" && (
                  <PaymentBadge state={o.paymentState} />
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
