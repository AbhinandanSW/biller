import "server-only";

import { createClient } from "@/api/supabase/server";
import { CUSTOMER_PAGE_SIZE } from "@/constants/pagination";
import type {
  Customer,
  CustomerStats,
  CustomerStatus,
  CustomerStatusFilter,
  CustomerWithStats,
} from "@/types/customer";
import { containsPattern } from "@/utils/ids";

import { toCustomer, toCustomerStats } from "./mappers";

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
  status?: CustomerStatusFilter;
  page?: number;
}): Promise<{ customers: CustomerWithStats[]; total: number }> {
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

export async function countCustomers(organizationId: string, status?: CustomerStatus) {
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
export async function listCustomerOptions(
  organizationId: string,
  includeId?: string | null,
): Promise<Customer[]> {
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

export async function getCustomer(
  organizationId: string,
  id: string,
): Promise<{ customer: Customer; stats: CustomerStats } | null> {
  const supabase = await createClient();
  const [{ data, error }, stats] = await Promise.all([
    supabase
      .from("customers")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("id", id)
      .maybeSingle(),
    summariesFor(organizationId, [id]),
  ]);
  if (error) throw error;
  if (!data) return null;
  return { customer: toCustomer(data), stats: stats.get(id) ?? toCustomerStats(null) };
}
