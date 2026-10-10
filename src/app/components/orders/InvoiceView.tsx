import Link from "next/link";

import { Badge } from "@/app/components/ui";
import type { Order, SendingChannels } from "@/types/order";
import type { OrganizationSettings } from "@/types/organization";
import { formatAddress, stateName } from "@/utils/address";
import { amountInWords } from "@/utils/amount-in-words";
import { formatDate, formatMoney, formatPercent } from "@/utils/format";

import { DocumentActions } from "./DocumentActions";
import { PrintButton } from "./PrintButton";
import { TotalsSummary } from "./TotalsSummary";

/** Printable GST tax invoice (spec §40). "Save as PDF" uses the browser's print dialog. */
export function InvoiceView({
  order,
  org,
  shareUrl,
  sending,
}: {
  order: Order;
  org: OrganizationSettings;
  shareUrl: string;
  sending: SendingChannels;
}) {
  const invoice = order.invoice!;

  const intra = order.supplyType === "INTRA_STATE";
  const lines = new Map(order.totals.lines.map((l) => [l.productId, l]));
  const cancelled = invoice.status === "CANCELLED";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <Link
          href={`/orders/${order.id}`}
          className="text-label text-muted-foreground hover:text-foreground"
        >
          ← {order.number}
        </Link>
        <div className="flex flex-wrap gap-2">
          <PrintButton />
          <DocumentActions
            orderId={order.id}
            orderNumber={order.number}
            status={order.status}
            invoice={{
              number: invoice.number,
              dueDate: invoice.dueDate,
              cancelled: invoice.status === "CANCELLED",
            }}
            canIssueInvoice={false}
            customer={{
              name: order.customer.name,
              phone: order.customer.phone,
              email: order.customer.email,
            }}
            businessName={org.legalName ?? org.name}
            grandTotal={order.totals.grandTotal}
            shareUrl={shareUrl}
            fileBusinessName={org.name}
            sending={sending}
          />
        </div>
      </div>

      <article className="relative overflow-hidden rounded-lg border border-border bg-white p-6 text-[13px] leading-5 text-neutral-900 shadow-card sm:p-10 print:border-0 print:p-0 print:shadow-none">
        {cancelled && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="-rotate-12 rounded-md border-4 border-red-600/40 px-6 py-2 text-5xl font-bold text-red-600/40">
              CANCELLED
            </span>
          </div>
        )}

        <header className="flex flex-col justify-between gap-6 border-b border-neutral-300 pb-6 sm:flex-row">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold">{org.legalName ?? org.name}</h1>
            {org.address && <p className="text-neutral-600">{org.address}</p>}
            {org.stateCode && (
              <p className="text-neutral-600">
                State: {stateName(org.stateCode)} ({org.stateCode})
              </p>
            )}
            {org.gstin && (
              <p>
                GSTIN: <span className="font-mono">{org.gstin}</span>
              </p>
            )}
            {(org.phone || org.email) && (
              <p className="text-neutral-600">
                {[org.phone, org.email].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1 sm:text-right">
            <p className="text-lg font-semibold tracking-wide">TAX INVOICE</p>
            <p>
              Invoice no: <span className="font-mono font-medium">{invoice.number}</span>
            </p>
            <p>Invoice date: {formatDate(invoice.date)}</p>
            <p>Due date: {formatDate(invoice.dueDate)}</p>
            <p className="text-neutral-600">Order: {order.number}</p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-neutral-300 py-6 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
              Bill to
            </p>
            <p className="font-medium">{order.customer.name}</p>
            <p className="text-neutral-600">{formatAddress(order.customer.billing)}</p>
            <p>
              GSTIN:{" "}
              {order.customer.gstin ? (
                <span className="font-mono">{order.customer.gstin}</span>
              ) : (
                "Unregistered"
              )}
            </p>
            {order.customer.phone && <p className="text-neutral-600">{order.customer.phone}</p>}
          </div>
          <div className="flex flex-col gap-1 sm:text-right">
            <p className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
              Place of supply
            </p>
            <p>
              {stateName(order.customer.billing.stateCode)} ({order.customer.billing.stateCode})
            </p>
            <p className="text-neutral-600">
              {intra ? "Intra-state: CGST + SGST" : "Inter-state: IGST"}
            </p>
          </div>
        </section>

        <div className="overflow-x-auto py-6">
          <table className="w-full min-w-[40rem] border-collapse">
            <thead>
              <tr className="border-y border-neutral-300 bg-neutral-50 text-left text-[11px] tracking-wide text-neutral-600 uppercase">
                <th className="px-2 py-2 font-semibold">#</th>
                <th className="px-2 py-2 font-semibold">Item</th>
                <th className="px-2 py-2 font-semibold">HSN</th>
                <th className="px-2 py-2 text-right font-semibold">Qty</th>
                <th className="px-2 py-2 text-right font-semibold">Rate</th>
                <th className="px-2 py-2 text-right font-semibold">Discount</th>
                <th className="px-2 py-2 text-right font-semibold">Taxable</th>
                <th className="px-2 py-2 text-right font-semibold">GST</th>
                <th className="px-2 py-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => {
                const line = lines.get(item.id);
                return (
                  <tr key={item.id} className="border-b border-neutral-200 align-top">
                    <td className="px-2 py-2 text-neutral-500">{index + 1}</td>
                    <td className="px-2 py-2 font-medium">{item.name}</td>
                    <td className="px-2 py-2 font-mono">{item.hsnCode || "—"}</td>
                    <td className="tabular px-2 py-2 text-right whitespace-nowrap">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="tabular px-2 py-2 text-right">{formatMoney(item.rate)}</td>
                    <td className="tabular px-2 py-2 text-right">
                      {line && Number(line.discountTotal) > 0
                        ? formatMoney(line.discountTotal)
                        : "—"}
                    </td>
                    <td className="tabular px-2 py-2 text-right">
                      {formatMoney(line?.taxableAmount)}
                    </td>
                    <td className="tabular px-2 py-2 text-right">
                      {formatMoney(line?.taxAmount)}
                      <div className="text-[11px] text-neutral-500">
                        {formatPercent(item.taxRate)}
                      </div>
                    </td>
                    <td className="tabular px-2 py-2 text-right font-medium">
                      {formatMoney(line?.lineTotal)}
                    </td>
                  </tr>
                );
              })}
              {order.totals.charges.map((charge) => (
                <tr key={charge.label} className="border-b border-neutral-200">
                  <td />
                  <td className="px-2 py-2" colSpan={5}>
                    {charge.label}
                  </td>
                  <td className="tabular px-2 py-2 text-right">{formatMoney(charge.amount)}</td>
                  <td className="tabular px-2 py-2 text-right">
                    {charge.taxRate ? formatMoney(charge.taxAmount) : "—"}
                  </td>
                  <td className="tabular px-2 py-2 text-right">{formatMoney(charge.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="grid gap-8 border-b border-neutral-300 pb-6 sm:grid-cols-[1fr_18rem]">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                Amount in words
              </p>
              <p className="font-medium">{amountInWords(order.totals.grandTotal)}</p>
            </div>
            {order.totals.taxSummary.length > 0 && (
              <table className="w-full max-w-md border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-neutral-300 text-left text-neutral-500">
                    <th className="py-1 font-medium">GST rate</th>
                    <th className="py-1 text-right font-medium">Taxable</th>
                    {intra ? (
                      <>
                        <th className="py-1 text-right font-medium">CGST</th>
                        <th className="py-1 text-right font-medium">SGST</th>
                      </>
                    ) : (
                      <th className="py-1 text-right font-medium">IGST</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {order.totals.taxSummary.map((row) => (
                    <tr key={row.taxRate} className="border-b border-neutral-200">
                      <td className="py-1">{formatPercent(row.taxRate)}</td>
                      <td className="tabular py-1 text-right">{formatMoney(row.taxableAmount)}</td>
                      {intra ? (
                        <>
                          <td className="tabular py-1 text-right">{formatMoney(row.cgst)}</td>
                          <td className="tabular py-1 text-right">{formatMoney(row.sgst)}</td>
                        </>
                      ) : (
                        <td className="tabular py-1 text-right">{formatMoney(row.igst)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {order.notes && (
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Notes
                </p>
                <p className="whitespace-pre-line text-neutral-700">{order.notes}</p>
              </div>
            )}
          </div>
          <div className="[&_.text-muted-foreground]:text-neutral-600 [&_dd]:text-neutral-900 [&_dt]:text-neutral-600">
            <TotalsSummary totals={order.totals} />
          </div>
        </section>

        <footer className="flex flex-col justify-between gap-6 pt-6 sm:flex-row sm:items-end">
          <p className="max-w-sm text-[11px] text-neutral-500">
            This is a computer-generated invoice. Payment due by {formatDate(invoice.dueDate)}.
          </p>
          <div className="flex flex-col items-start gap-10 sm:items-end">
            <p>For {org.legalName ?? org.name}</p>
            <p className="border-t border-neutral-400 pt-1 text-[11px] text-neutral-600">
              Authorised signatory
            </p>
          </div>
        </footer>
      </article>

      {cancelled && (
        <div className="print:hidden">
          <Badge variant="danger">This invoice was cancelled with its order</Badge>
        </div>
      )}
    </div>
  );
}
