import type { Order, PaymentState } from "@/types/order";

/** Where an order's invoice stands, as of `today` (yyyy-mm-dd). */
export function paymentState(
  order: Pick<Order, "invoice">,
  today = new Date().toISOString().slice(0, 10),
): PaymentState {
  const invoice = order.invoice;
  if (!invoice) return "NOT_INVOICED";
  if (invoice.status === "CANCELLED") return "CANCELLED";
  if (invoice.status === "PAID") return "PAID";
  return invoice.dueDate < today ? "OVERDUE" : "UNPAID";
}
