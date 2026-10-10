import type { Metadata } from "next";

import { requireOrganization } from "@/api/auth/session";
import { countOrders, listOrders } from "@/api/orders/queries";
import { OrderList } from "@/app/components/orders/OrderList";
import { ORDER_FILTERS } from "@/constants/orders";
import { ORDER_PAGE_SIZE } from "@/constants/pagination";
import type { OrderFilter } from "@/types/order";
import { roleHasPermission } from "@/utils/permissions";
import { oneOf, parsePage, searchParam } from "@/utils/search-params";

export const metadata: Metadata = { title: "Orders & invoices" };

const FILTER_KEYS = Object.keys(ORDER_FILTERS) as OrderFilter[];
const FILTER_OPTIONS = Object.entries(ORDER_FILTERS).map(([value, label]) => ({ value, label }));

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const params = await searchParams;
  const { organization, role } = await requireOrganization();
  const show = oneOf(params.show, FILTER_KEYS, "all");
  const page = parsePage(params.page);

  const [{ orders, total }, allCount] = await Promise.all([
    listOrders({ organizationId: organization.id, q: searchParam(params.q)?.trim(), show, page }),
    countOrders(organization.id),
  ]);

  return (
    <OrderList
      orders={orders}
      total={total}
      allCount={allCount}
      page={page}
      pageSize={ORDER_PAGE_SIZE}
      filterOptions={FILTER_OPTIONS}
      searchParams={params}
      canCreate={roleHasPermission(role, "orders.create")}
    />
  );
}
