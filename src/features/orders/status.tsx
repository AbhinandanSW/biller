import { Badge, type BadgeVariant } from "@/components/ui";

import type { Order, OrderRow } from "./types";

const ORDER_STATUS: Record<Order["status"], { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: "Draft", variant: "neutral" },
  CONFIRMED: { label: "Confirmed", variant: "primary" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
};

export function OrderStatusBadge({ status }: { status: Order["status"] }) {
  const { label, variant } = ORDER_STATUS[status];
  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
}

export type PaymentState = OrderRow["paymentState"];

export function paymentState(
  order: Order,
  today = new Date().toISOString().slice(0, 10),
): PaymentState {
  const invoice = order.invoice;
  if (!invoice) return "NOT_INVOICED";
  if (invoice.status === "CANCELLED") return "CANCELLED";
  if (invoice.status === "PAID") return "PAID";
  return invoice.dueDate < today ? "OVERDUE" : "UNPAID";
}

const PAYMENT: Record<PaymentState, { label: string; variant: BadgeVariant }> = {
  NOT_INVOICED: { label: "Not invoiced", variant: "neutral" },
  UNPAID: { label: "Unpaid", variant: "warning" },
  OVERDUE: { label: "Overdue", variant: "danger" },
  PAID: { label: "Paid", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "neutral" },
};

export function PaymentBadge({ state }: { state: PaymentState }) {
  const { label, variant } = PAYMENT[state];
  return <Badge variant={variant}>{label}</Badge>;
}
