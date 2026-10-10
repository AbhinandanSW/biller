import { Badge, type BadgeVariant } from "@/app/components/ui";
import type { OrderStatus, PaymentState } from "@/types/order";

const ORDER_STATUS: Record<OrderStatus, { label: string; variant: BadgeVariant }> = {
  DRAFT: { label: "Draft", variant: "neutral" },
  CONFIRMED: { label: "Confirmed", variant: "primary" },
  CANCELLED: { label: "Cancelled", variant: "danger" },
};

const PAYMENT_STATE: Record<PaymentState, { label: string; variant: BadgeVariant }> = {
  NOT_INVOICED: { label: "Not invoiced", variant: "neutral" },
  UNPAID: { label: "Unpaid", variant: "warning" },
  OVERDUE: { label: "Overdue", variant: "danger" },
  PAID: { label: "Paid", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "neutral" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, variant } = ORDER_STATUS[status];
  return (
    <Badge variant={variant} dot>
      {label}
    </Badge>
  );
}

export function PaymentBadge({ state }: { state: PaymentState }) {
  const { label, variant } = PAYMENT_STATE[state];
  return <Badge variant={variant}>{label}</Badge>;
}
