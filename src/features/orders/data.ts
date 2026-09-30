import "server-only";

import type { OrderCalculation, TaxSummaryRow } from "@/lib/calculations";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { containsPattern } from "@/lib/utils/ids";
import type { Database } from "@/types/database";

import type { Address } from "../customers/types";
import type { Order, OrderItem, OrderRow } from "./types";

type Tables = Database["public"]["Tables"];
type OrderDbRow = Tables["orders"]["Row"] & {
  order_items: Tables["order_items"]["Row"][];
  order_charges: Tables["order_charges"]["Row"][];
  // The invoice is linked through a composite key, so PostgREST can't tell
  // it's one-to-one and returns a list (at most one element).
  invoices: Tables["invoices"]["Row"][] | Tables["invoices"]["Row"] | null;
};
type OrderListDbRow = Database["public"]["Views"]["order_list"]["Row"];

export const ORDER_PAGE_SIZE = 25;

const money = (value: number | string | null | undefined) => Number(value ?? 0).toFixed(2);
const plain = (value: number | string | null | undefined) =>
  value === null || value === undefined ? "" : String(Number(value));

function toOrder(row: OrderDbRow): Order {
  const items = [...row.order_items].sort((a, b) => a.position - b.position);
  const charges = [...row.order_charges].sort((a, b) => a.position - b.position);

  const formItems: OrderItem[] = items.map((i) => ({
    id: i.id,
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
      type: row.order_discount_type as "PERCENTAGE" | "FIXED",
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

export async function getOrder(organizationId: string, id: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), order_charges(*), invoices(*)")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toOrder(data as unknown as OrderDbRow) : null;
}

/**
 * An order and its business, looked up by share token for the public share
 * link. Uses the service role because the viewer isn't signed in — the
 * token itself is the permission.
 */
export async function getSharedOrder(token: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("*, order_items(*), order_charges(*), invoices(*), organization:organizations(*)")
    .eq("share_token", token)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { organization, ...order } = data as unknown as OrderDbRow & {
    organization: Tables["organizations"]["Row"];
  };
  return { order: toOrder(order), organization };
}

function toOrderRow(row: OrderListDbRow): OrderRow {
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
    paymentState: (row.payment_state ?? "NOT_INVOICED") as OrderRow["paymentState"],
  };
}

export const ORDER_FILTERS = {
  all: "All orders",
  draft: "Drafts",
  to_invoice: "To invoice",
  unpaid: "Unpaid",
  paid: "Paid",
  cancelled: "Cancelled",
} as const;
export type OrderFilter = keyof typeof ORDER_FILTERS;

export async function listOrders({
  organizationId,
  q,
  show = "all",
  customerId,
  page = 1,
  pageSize = ORDER_PAGE_SIZE,
}: {
  organizationId: string;
  q?: string;
  show?: OrderFilter;
  customerId?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  let query = supabase
    .from("order_list")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("order_date", { ascending: false })
    .order("order_number", { ascending: false })
    .range(from, from + pageSize - 1);

  if (customerId) query = query.eq("customer_id", customerId);
  if (show === "draft") query = query.eq("status", "DRAFT");
  if (show === "to_invoice") query = query.eq("status", "CONFIRMED").is("invoice_number", null);
  if (show === "unpaid")
    query = query.eq("status", "CONFIRMED").in("payment_state", ["UNPAID", "OVERDUE"]);
  if (show === "paid") query = query.eq("payment_state", "PAID");
  if (show === "cancelled") query = query.eq("status", "CANCELLED");
  if (q) {
    const p = containsPattern(q);
    query = query.or(
      `order_number.ilike.${p},invoice_number.ilike.${p},customer_name.ilike.${p},customer_phone.ilike.${p},customer_gstin.ilike.${p},item_names.ilike.${p}`,
    );
  }

  const { data, count, error } = await query;
  if (error) throw error;
  return { orders: data.map(toOrderRow), total: count ?? 0 };
}

export async function countOrders(organizationId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  if (error) throw error;
  return count ?? 0;
}

/** Items used on recent orders, newest first, for autocomplete and prefill. */
export async function listKnownItems(organizationId: string): Promise<OrderItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("id, name, hsn_code, unit, rate, tax_rate")
    .eq("organization_id", organizationId)
    .order("id", { ascending: false })
    .limit(500);
  if (error) throw error;
  const byName = new Map<string, OrderItem>();
  for (const i of data) {
    const key = i.name.trim().toLowerCase();
    if (!byName.has(key)) {
      byName.set(key, {
        id: i.id,
        name: i.name,
        hsnCode: i.hsn_code ?? "",
        quantity: "1",
        unit: i.unit,
        rate: plain(i.rate),
        discountPercent: "",
        taxRate: plain(i.tax_rate),
      });
    }
  }
  return [...byName.values()];
}

export interface DashboardStats {
  salesThisMonth: number;
  ordersThisMonth: number;
  outstanding: number;
  overdueCount: number;
  draftCount: number;
  toInvoiceCount: number;
  recent: OrderRow[];
}

export async function getDashboardStats(organizationId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
    .toISOString()
    .slice(0, 10);
  const base = () => supabase.from("order_list").select("*").eq("organization_id", organizationId);

  const [invoicedThisMonth, placedThisMonth, unpaid, drafts, toInvoice, recent] = await Promise.all(
    [
      base().in("invoice_status", ["ISSUED", "PAID"]).gte("invoice_date", monthStart),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "CONFIRMED")
        .gte("order_date", monthStart),
      base().eq("status", "CONFIRMED").in("payment_state", ["UNPAID", "OVERDUE"]),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "DRAFT"),
      supabase
        .from("order_list")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "CONFIRMED")
        .is("invoice_number", null),
      listOrders({ organizationId, pageSize: 6 }),
    ],
  );

  for (const result of [invoicedThisMonth, placedThisMonth, unpaid, drafts, toInvoice]) {
    if (result.error) throw result.error;
  }
  const sum = (rows: OrderListDbRow[] | null) =>
    (rows ?? []).reduce((total, row) => total + Number(row.grand_total ?? 0), 0);

  return {
    salesThisMonth: sum(invoicedThisMonth.data),
    ordersThisMonth: placedThisMonth.count ?? 0,
    outstanding: sum(unpaid.data),
    overdueCount: (unpaid.data ?? []).filter((r) => r.payment_state === "OVERDUE").length,
    draftCount: drafts.count ?? 0,
    toInvoiceCount: toInvoice.count ?? 0,
    recent: recent.orders,
  };
}

export async function listTopCustomers(organizationId: string, limit = 5) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_summaries")
    .select("*")
    .eq("organization_id", organizationId)
    .gt("revenue", 0)
    .order("revenue", { ascending: false })
    .limit(limit);
  if (error) throw error;
  if (data.length === 0) return [];

  const { data: customers, error: namesError } = await supabase
    .from("customers")
    .select("id, name")
    .in(
      "id",
      data.map((row) => row.customer_id!),
    );
  if (namesError) throw namesError;
  const names = new Map(customers.map((c) => [c.id, c.name]));

  return data.map((row) => ({
    id: row.customer_id!,
    name: names.get(row.customer_id!) ?? "—",
    revenue: Number(row.revenue ?? 0),
    outstanding: Number(row.outstanding ?? 0),
    orderCount: row.order_count ?? 0,
  }));
}

export interface DocumentSend {
  id: string;
  channel: "EMAIL" | "WHATSAPP";
  documentType: "INVOICE" | "ORDER";
  documentNumber: string;
  recipient: string;
  status: "SENDING" | "SENT" | "FAILED";
  error: string | null;
  sentByName: string | null;
  createdAt: string;
}

/** What was sent for an order, newest first. */
export async function listDocumentSends(
  organizationId: string,
  orderId: string,
): Promise<DocumentSend[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_sends")
    .select(
      "id, channel, document_type, document_number, recipient, status, error, sent_by, created_at",
    )
    .eq("organization_id", organizationId)
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;

  const senderIds = [
    ...new Set(data.map((row) => row.sent_by).filter((id): id is string => Boolean(id))),
  ];
  const names = new Map<string, string | null>();
  if (senderIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", senderIds);
    for (const p of profiles ?? []) names.set(p.id, p.full_name ?? p.email);
  }

  return data.map((row) => ({
    id: row.id,
    channel: row.channel,
    documentType: row.document_type as DocumentSend["documentType"],
    documentNumber: row.document_number,
    recipient: row.recipient,
    status: row.status,
    error: row.error,
    sentByName: row.sent_by ? (names.get(row.sent_by) ?? null) : null,
    createdAt: row.created_at,
  }));
}
