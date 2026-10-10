import "server-only";

import { createAdminClient } from "@/api/supabase/admin";
import { createClient } from "@/api/supabase/server";
import { KNOWN_ITEMS_LIMIT, SEND_HISTORY_LIMIT } from "@/constants/orders";
import { ORDER_PAGE_SIZE } from "@/constants/pagination";
import type { DocumentSend, Order, OrderFilter, OrderItem, OrderRow } from "@/types/order";
import type { Organization } from "@/types/organization";
import { containsPattern } from "@/utils/ids";

import { ORDER_SELECT, plain, toOrder, toOrderRow, type OrderDbRow } from "./mappers";

export async function getOrder(organizationId: string, id: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
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
export async function getSharedOrder(
  token: string,
): Promise<{ order: Order; organization: Organization } | null> {
  const { data, error } = await createAdminClient()
    .from("orders")
    .select(`${ORDER_SELECT}, organization:organizations(*)`)
    .eq("share_token", token)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { organization, ...order } = data as unknown as OrderDbRow & {
    organization: Organization;
  };
  return { order: toOrder(order), organization };
}

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
}): Promise<{ orders: OrderRow[]; total: number }> {
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
    .limit(KNOWN_ITEMS_LIMIT);
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
    .limit(SEND_HISTORY_LIMIT);
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
