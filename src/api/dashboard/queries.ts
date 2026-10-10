import "server-only";

import type { OrderListDbRow } from "@/api/orders/mappers";
import { listOrders } from "@/api/orders/queries";
import { createClient } from "@/api/supabase/server";
import { DASHBOARD_RECENT_ORDERS, DASHBOARD_TOP_CUSTOMERS } from "@/constants/pagination";
import type { DashboardStats, TopCustomer } from "@/types/dashboard";

/** First day of the current month (UTC), yyyy-mm-dd. */
function startOfMonth(now = new Date()) {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString().slice(0, 10);
}

const sumGrandTotals = (rows: OrderListDbRow[] | null) =>
  (rows ?? []).reduce((total, row) => total + Number(row.grand_total ?? 0), 0);

export async function getDashboardStats(organizationId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const monthStart = startOfMonth();
  const orderList = () =>
    supabase.from("order_list").select("*").eq("organization_id", organizationId);
  const countOrders = () =>
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId);

  const [invoicedThisMonth, placedThisMonth, unpaid, drafts, toInvoice, recent] = await Promise.all(
    [
      orderList().in("invoice_status", ["ISSUED", "PAID"]).gte("invoice_date", monthStart),
      countOrders().eq("status", "CONFIRMED").gte("order_date", monthStart),
      orderList().eq("status", "CONFIRMED").in("payment_state", ["UNPAID", "OVERDUE"]),
      countOrders().eq("status", "DRAFT"),
      supabase
        .from("order_list")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", organizationId)
        .eq("status", "CONFIRMED")
        .is("invoice_number", null),
      listOrders({ organizationId, pageSize: DASHBOARD_RECENT_ORDERS }),
    ],
  );

  for (const result of [invoicedThisMonth, placedThisMonth, unpaid, drafts, toInvoice]) {
    if (result.error) throw result.error;
  }

  return {
    salesThisMonth: sumGrandTotals(invoicedThisMonth.data),
    ordersThisMonth: placedThisMonth.count ?? 0,
    outstanding: sumGrandTotals(unpaid.data),
    overdueCount: (unpaid.data ?? []).filter((r) => r.payment_state === "OVERDUE").length,
    draftCount: drafts.count ?? 0,
    toInvoiceCount: toInvoice.count ?? 0,
    recent: recent.orders,
  };
}

export async function listTopCustomers(
  organizationId: string,
  limit = DASHBOARD_TOP_CUSTOMERS,
): Promise<TopCustomer[]> {
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
