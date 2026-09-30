import "server-only";

import { createClient } from "@/lib/supabase/server";
import { containsPattern } from "@/lib/utils/ids";
import type { Database } from "@/types/database";

import type { Customer, CustomerStats } from "./types";

type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type SummaryRow = Database["public"]["Views"]["customer_summaries"]["Row"];

export const CUSTOMER_PAGE_SIZE = 25;

export function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    contactPerson: row.contact_person,
    phone: row.phone,
    email: row.email,
    gstin: row.gstin,
    billing: {
      line1: row.billing_line1,
      line2: row.billing_line2 ?? "",
      city: row.billing_city,
      stateCode: row.billing_state_code,
      pincode: row.billing_pincode ?? "",
    },
    shippingSameAsBilling: row.shipping_same_as_billing,
    shipping: row.shipping_same_as_billing
      ? null
      : {
          line1: row.shipping_line1 ?? "",
          line2: row.shipping_line2 ?? "",
          city: row.shipping_city ?? "",
          stateCode: row.shipping_state_code ?? "",
          pincode: row.shipping_pincode ?? "",
        },
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function toCustomerStats(row: SummaryRow | null | undefined): CustomerStats {
  const revenue = Number(row?.revenue ?? 0);
  const invoiced = row?.invoiced_count ?? 0;
  return {
    orderCount: row?.order_count ?? 0,
    revenue,
    outstanding: Number(row?.outstanding ?? 0),
    averageOrderValue: invoiced ? revenue / invoiced : 0,
    lastOrderDate: row?.last_order_date ?? null,
  };
}

async function summariesFor(organizationId: string, customerIds: string[]) {
  if (customerIds.length === 0) return new Map<string, CustomerStats>();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_summaries")
    .select("*")
    .eq("organization_id", organizationId)
    .in("customer_id", customerIds);
  if (error) throw error;
  return new Map(data.map((row) => [row.customer_id!, toCustomerStats(row)]));
}

export async function listCustomers({
  organizationId,
  q,
  status = "ACTIVE",
  page = 1,
}: {
  organizationId: string;
  q?: string;
  status?: "ACTIVE" | "ARCHIVED" | "ALL";
  page?: number;
}) {
  const supabase = await createClient();
  const from = (page - 1) * CUSTOMER_PAGE_SIZE;
  let query = supabase
    .from("customers")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("name")
    .order("id")
    .range(from, from + CUSTOMER_PAGE_SIZE - 1);
  if (status !== "ALL") query = query.eq("status", status);
  if (q) {
    const p = containsPattern(q);
    query = query.or(
      `name.ilike.${p},code.ilike.${p},contact_person.ilike.${p},phone.ilike.${p},email.ilike.${p},gstin.ilike.${p},billing_city.ilike.${p}`,
    );
  }
  const { data, count, error } = await query;
  if (error) throw error;

  const stats = await summariesFor(
    organizationId,
    data.map((c) => c.id),
  );
  return {
    customers: data.map((row) => ({
      ...toCustomer(row),
      stats: stats.get(row.id) ?? toCustomerStats(null),
    })),
    total: count ?? 0,
  };
}

export async function countCustomers(organizationId: string, status?: "ACTIVE") {
  const supabase = await createClient();
  let query = supabase
    .from("customers")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId);
  if (status) query = query.eq("status", status);
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

/** Active customers (plus `includeId`, e.g. an archived one already on a draft) for pickers. */
export async function listCustomerOptions(organizationId: string, includeId?: string | null) {
  const supabase = await createClient();
  let query = supabase
    .from("customers")
    .select("*")
    .eq("organization_id", organizationId)
    .order("name");
  query = includeId
    ? query.or(`status.eq.ACTIVE,id.eq.${includeId}`)
    : query.eq("status", "ACTIVE");
  const { data, error } = await query;
  if (error) throw error;
  return data.map(toCustomer);
}

export async function getCustomer(organizationId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const stats = await summariesFor(organizationId, [id]);
  return { customer: toCustomer(data), stats: stats.get(id) ?? toCustomerStats(null) };
}
