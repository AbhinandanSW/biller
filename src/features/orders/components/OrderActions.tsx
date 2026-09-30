"use client";

import { Ban, CircleCheck, FileText, Pencil, Undo2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import {
  Button,
  buttonClassName,
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
  toast,
} from "@/components/ui";

import { cancelOrder, confirmOrder, setInvoicePaid } from "../actions";
import type { PaymentState } from "../status";
import type { Order } from "../types";

interface Permissions {
  edit: boolean;
  cancel: boolean;
  invoice: boolean;
}

/** Status buttons for the order page. Each calls a server action, then the page refreshes. */
export function OrderActions({
  order,
  payment,
  can,
}: {
  order: Pick<Order, "id" | "number" | "status" | "invoice">;
  payment: PaymentState;
  can: Permissions;
}) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const run = (key: string, action: () => Promise<{ error?: string }>, success: string) => {
    setBusy(key);
    startTransition(async () => {
      const { error } = await action();
      setBusy(null);
      if (error) toast.error("Couldn't update the order", error);
      else {
        toast.success(success, order.number);
        setCancelOpen(false);
      }
    });
  };
  const loading = (key: string) => pending && busy === key;
  const invoiced = order.invoice && order.invoice.status !== "CANCELLED";

  return (
    <>
      {order.status === "DRAFT" && can.edit && (
        <>
          <Link
            href={`/orders/${order.id}/edit`}
            className={buttonClassName({ variant: "secondary" })}
          >
            <Pencil aria-hidden />
            Edit
          </Link>
          <Button
            loading={loading("confirm")}
            onClick={() => run("confirm", () => confirmOrder(order.id), "Order confirmed")}
          >
            <CircleCheck aria-hidden />
            Confirm order
          </Button>
        </>
      )}
      {invoiced && (
        <>
          {can.invoice &&
            (payment === "PAID" ? (
              <Button
                variant="secondary"
                loading={loading("paid")}
                onClick={() =>
                  run("paid", () => setInvoicePaid(order.id, false), "Marked as unpaid")
                }
              >
                <Undo2 aria-hidden />
                Mark unpaid
              </Button>
            ) : (
              <Button
                variant="secondary"
                loading={loading("paid")}
                onClick={() => run("paid", () => setInvoicePaid(order.id, true), "Marked as paid")}
              >
                <CircleCheck aria-hidden />
                Mark as paid
              </Button>
            ))}
          <Link
            href={`/orders/${order.id}/invoice`}
            className={buttonClassName({ variant: "ghost" })}
          >
            <FileText aria-hidden />
            View invoice
          </Link>
        </>
      )}
      {order.status !== "CANCELLED" && payment !== "PAID" && can.cancel && (
        <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary">
              <Ban aria-hidden />
              Cancel order
            </Button>
          </DialogTrigger>
          <DialogContent
            size="sm"
            title={`Cancel ${order.number}?`}
            description={
              order.invoice
                ? `Invoice ${order.invoice.number} will be cancelled too. This can't be undone.`
                : "The order will be kept for your records, marked as cancelled. This can't be undone."
            }
            footer={
              <>
                <DialogClose asChild>
                  <Button variant="secondary">Keep order</Button>
                </DialogClose>
                <Button
                  variant="danger"
                  loading={loading("cancel")}
                  onClick={() => run("cancel", () => cancelOrder(order.id), "Order cancelled")}
                >
                  Cancel order
                </Button>
              </>
            }
          />
        </Dialog>
      )}
    </>
  );
}
