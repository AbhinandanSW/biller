import type { OrderCalculation, TaxSummaryRow } from "@/types/calculation";
import type { Address } from "@/types/customer";
import type { Database } from "@/types/database";
import type { Order, OrderDiscountType, OrderItem, OrderRow, PaymentState } from "@/types/order";

type Tables = Database["public"]["Tables"];
type InvoiceDbRow = Tables["invoices"]["Row"];

export type OrderDbRow = Tables["orders"]["Row"] & {
  order_items: Tables["order_items"]["Row"][];
  order_charges: Tables["order_charges"]["Row"][];
  // The invoice is linked through a composite key, so PostgREST can't tell
  // it's one-to-one and returns a list (at most one element).
  invoices: InvoiceDbRow[] | InvoiceDbRow | null;
};
export type OrderListDbRow = Database["public"]["Views"]["order_list"]["Row"];

/** Columns to select for toOrder(). */
export const ORDER_SELECT = "*, order_items(*), order_charges(*), invoices(*)";

/** Numeric column → 2dp string, the engine's money format. */
const money = (value: number | string | null | undefined) => Number(value ?? 0).toFixed(2);

/** Numeric column → the shortest string for a form input ("" for null). */
export const plain = (value: number | string | null | undefined) =>
  value === null || value === undefined ? "" : String(Number(value));

export function toOrder(row: OrderDbRow): Order {
  const items = [...row.order_items].sort((a, b) => a.position - b.position);
  const charges = [...row.order_charges].sort((a, b) => a.position - b.position);

  const formItems: OrderItem[] = items.map((i) => ({
    id: i.id,
    productId: i.product_id,
    name: i.name,
    hsnCode: i.hsn_code ?? "",
    quantity: plain(i.quantity),
    unit: i.unit,
    rate: plain(i.rate),
    discountPercent: plain(i.discount_percent),
    taxRate: plain(i.tax_rate),
  }));

  // Rebuild the engine's result from the stored figures so every screen
  // renders exactly what was calculated when the order was saved.
  const totals: OrderCalculation = {
    supplyType: row.supply_type as OrderCalculation["supplyType"],
    pricesIncludeTax: row.prices_include_tax,
    subtotal: money(row.subtotal),
    lineDiscountTotal: money(row.line_discount_total),
    orderDiscountTotal: money(row.order_discount_total),
    discountTotal: money(row.discount_total),
    chargeTotal: money(row.charge_total),
    taxableAmount: money(row.taxable_amount),
    cgstTotal: money(row.cgst_total),
    sgstTotal: money(row.sgst_total),
    igstTotal: money(row.igst_total),
    taxTotal: money(row.tax_total),
    roundingAdjustment: money(row.rounding_adjustment),
    grandTotal: money(row.grand_total),
    lines: items.map((i) => ({
      productId: i.id,
      quantity: plain(i.quantity),
      unitPrice: plain(i.rate),
      priceSource: { type: "MANUAL" },
      grossAmount: money(i.gross_amount),
      lineDiscount: money(i.line_discount),
      orderDiscountShare: money(i.order_discount_share),
      discountTotal: money(Number(i.line_discount) + Number(i.order_discount_share)),
      taxRate: plain(i.tax_rate),
      taxableAmount: money(i.taxable_amount),
      cgst: money(i.cgst),
      sgst: money(i.sgst),
      igst: money(i.igst),
      taxAmount: money(i.tax_amount),
      lineTotal: money(i.line_total),
    })),
    charges: charges.map((c) => ({
      label: c.label,
      amount: money(c.amount),
      taxRate: c.tax_rate === null ? null : plain(c.tax_rate),
      cgst: money(c.cgst),
      sgst: money(c.sgst),
      igst: money(c.igst),
      taxAmount: money(c.tax_amount),
      total: money(c.total),
    })),
    taxSummary: (row.tax_summary ?? []) as unknown as TaxSummaryRow[],
  };

  const invoice = Array.isArray(row.invoices) ? (row.invoices[0] ?? null) : row.invoices;
  return {
    id: row.id,
    number: row.order_number,
    shareToken: row.share_token,
    status: row.status,
    date: row.order_date,
    customerId: row.customer_id,
    customer: {
      name: row.customer_name,
      gstin: row.customer_gstin,
      phone: row.customer_phone,
      email: row.customer_email,
      billing: row.billing_address as unknown as Address,
    },
    items: formItems,
    orderDiscount: {
      type: row.order_discount_type as OrderDiscountType,
      value: plain(row.order_discount_value),
    },
    charges: charges.map((c) => ({
      id: c.id,
      label: c.label,
      amount: plain(c.amount),
      taxRate: plain(c.tax_rate),
    })),
    notes: row.notes ?? "",
    pricesIncludeTax: row.prices_include_tax,
    supplyType: totals.supplyType,
    totals,
    invoice: invoice
      ? {
          number: invoice.invoice_number,
          date: invoice.invoice_date,
          dueDate: invoice.due_date,
          status: invoice.status,
          paidAt: invoice.paid_at,
        }
      : null,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
    cancelledAt: row.cancelled_at,
  };
}

export function toOrderRow(row: OrderListDbRow): OrderRow {
  return {
    id: row.id!,
    number: row.order_number!,
    status: row.status!,
    date: row.order_date!,
    customerId: row.customer_id!,
    customerName: row.customer_name!,
    itemCount: row.item_count ?? 0,
    grandTotal: Number(row.grand_total ?? 0),
    invoiceNumber: row.invoice_number,
    paymentState: (row.payment_state ?? "NOT_INVOICED") as PaymentState,
  };
}
