import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireOrganization } from "@/api/auth/session";
import { getCustomer } from "@/api/customers/queries";
import { listOrders } from "@/api/orders/queries";
import { CustomerDetail } from "@/app/components/customers/CustomerDetail";
import { CUSTOMER_RECENT_ORDERS } from "@/constants/pagination";
import { isUuid } from "@/utils/ids";
import { roleHasPermission } from "@/utils/permissions";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerPage({ params }: PageProps<"/customers/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { organization, role } = await requireOrganization();

  const [found, { orders, total }] = await Promise.all([
    getCustomer(organization.id, id),
    listOrders({
      organizationId: organization.id,
      customerId: id,
      pageSize: CUSTOMER_RECENT_ORDERS,
    }),
  ]);
  if (!found) notFound();

  return (
    <CustomerDetail
      customer={found.customer}
      stats={found.stats}
      orders={orders}
      orderCount={total}
      sellerStateCode={organization.state_code}
      canEdit={roleHasPermission(role, "customers.update")}
      canCreateOrder={roleHasPermission(role, "orders.create")}
    />
  );
}
