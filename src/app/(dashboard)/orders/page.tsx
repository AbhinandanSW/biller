import type { Metadata } from "next";

import { parsePage } from "@/components/tables/Pagination";
import { OrderList } from "@/features/orders/components/OrderList";
import {
  countOrders,
  listOrders,
  ORDER_FILTERS,
  ORDER_PAGE_SIZE,
  type OrderFilter,
} from "@/features/orders/data";
import { roleHasPermission } from "@/lib/auth/permissions";
import { requireOrganization } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Orders & invoices" };

const param = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const params = await searchParams;
  const { organization, role } = await requireOrganization();
  const showParam = param(params.show);
  const show: OrderFilter =
    showParam && showParam in ORDER_FILTERS ? (showParam as OrderFilter) : "all";
  const page = parsePage(params.page);

  const [{ orders, total }, allCount] = await Promise.all([
    listOrders({ organizationId: organization.id, q: param(params.q)?.trim(), show, page }),
    countOrders(organization.id),
  ]);

  return (
    <OrderList
      orders={orders}
      total={total}
      allCount={allCount}
      page={page}
      pageSize={ORDER_PAGE_SIZE}
      filterOptions={Object.entries(ORDER_FILTERS).map(([value, label]) => ({ value, label }))}
      searchParams={params}
      canCreate={roleHasPermission(role, "orders.create")}
    />
  );
}
