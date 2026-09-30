import Link from "next/link";

import { Detail } from "@/components/business/Detail";
import { PageHeader } from "@/components/layout/PageHeader";
import { Alert, Card, CardContent, CardHeader } from "@/components/ui";
import { amountInWords } from "@/lib/utils/amount-in-words";
import { formatDate } from "@/lib/utils/format";

import { formatAddress, stateName } from "../../customers/format";
import { OrderStatusBadge, PaymentBadge, paymentState } from "../status";
import type { Order } from "../types";
import { DocumentActions } from "./DocumentActions";
import { OrderActions } from "./OrderActions";
import { OrderItemsTable } from "./OrderItemsTable";
import { TotalsSummary } from "./TotalsSummary";

export function OrderDetail({
  order,
  can,
  businessName,
  shareUrl,
}: {
  order: Order;
  can: { edit: boolean; cancel: boolean; invoice: boolean };
  businessName: string;
  shareUrl: string;
}) {
  const payment = paymentState(order);
  const actions = (
    <>
      <OrderActions order={order} payment={payment} can={can} />
      <DocumentActions
        orderId={order.id}
        orderNumber={order.number}
        status={order.status}
        invoice={
          order.invoice
            ? {
                number: order.invoice.number,
                dueDate: order.invoice.dueDate,
                cancelled: order.invoice.status === "CANCELLED",
              }
            : null
        }
        canIssueInvoice={can.invoice}
        customer={{
          name: order.customer.name,
          phone: order.customer.phone,
          email: order.customer.email,
        }}
        businessName={businessName}
        grandTotal={order.totals.grandTotal}
        shareUrl={shareUrl}
      />
    </>
  );

  const timeline = [
    { label: "Created", at: order.createdAt },
    { label: "Confirmed", at: order.confirmedAt },
    { label: `Invoiced (${order.invoice?.number})`, at: order.invoice?.date ?? null },
    { label: "Paid", at: order.invoice?.paidAt ?? null },
    { label: "Cancelled", at: order.cancelledAt },
  ].filter((e): e is { label: string; at: string } => Boolean(e.at));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        back={{ href: "/orders", label: "Orders" }}
        title={order.number}
        description={
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            {order.invoice && order.status !== "CANCELLED" && <PaymentBadge state={payment} />}
            <span>{formatDate(order.date)}</span>
          </div>
        }
        actions={actions}
      />

      {order.status === "DRAFT" && (
        <Alert title="This order is a draft">
          Confirm it when the customer agrees. Confirmed orders can be invoiced but no longer
          edited.
        </Alert>
      )}
      {payment === "OVERDUE" && order.invoice && (
        <Alert variant="danger" title="Payment overdue">
          Invoice {order.invoice.number} was due on {formatDate(order.invoice.dueDate)}.
        </Alert>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Items" description={`${order.items.length} items`} />
            <CardContent className="px-0 pb-0">
              <OrderItemsTable order={order} />
            </CardContent>
          </Card>
          {order.notes && (
            <Card>
              <CardHeader title="Notes" />
              <CardContent>
                <p className="whitespace-pre-line text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Total" />
            <CardContent className="flex flex-col gap-3">
              <TotalsSummary totals={order.totals} />
              <p className="text-caption text-muted-foreground">
                {amountInWords(order.totals.grandTotal)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Customer"
              actions={
                <Link
                  href={`/customers/${order.customerId}`}
                  className="text-label text-primary hover:underline"
                >
                  View
                </Link>
              }
            />
            <CardContent>
              <dl className="flex flex-col gap-3">
                <Detail label="Name">{order.customer.name}</Detail>
                <Detail label="GSTIN">
                  {order.customer.gstin ? (
                    <span className="font-mono">{order.customer.gstin}</span>
                  ) : (
                    "Unregistered"
                  )}
                </Detail>
                <Detail label="Billing address">{formatAddress(order.customer.billing)}</Detail>
                <Detail label="Place of supply">
                  {stateName(order.customer.billing.stateCode)} ·{" "}
                  {order.supplyType === "INTRA_STATE" ? "CGST + SGST" : "IGST"}
                </Detail>
              </dl>
            </CardContent>
          </Card>

          {order.invoice && (
            <Card>
              <CardHeader title="Invoice" />
              <CardContent>
                <dl className="grid grid-cols-2 gap-3">
                  <Detail label="Number">
                    <span className="font-mono">{order.invoice.number}</span>
                  </Detail>
                  <Detail label="Status">
                    <PaymentBadge state={payment} />
                  </Detail>
                  <Detail label="Date">{formatDate(order.invoice.date)}</Detail>
                  <Detail label="Due">{formatDate(order.invoice.dueDate)}</Detail>
                </dl>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader title="History" />
            <CardContent>
              <ol className="flex flex-col gap-3 border-l border-border pl-4">
                {timeline.map((event) => (
                  <li key={event.label} className="relative">
                    <span className="absolute top-1.5 -left-[1.3rem] size-2 rounded-full bg-border-strong" />
                    <div className="text-label">{event.label}</div>
                    <div className="text-caption text-muted-foreground">{formatDate(event.at)}</div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
