import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CustomerDetail } from "@/features/customers/components/CustomerDetail";
import { getCustomer } from "@/features/customers/data";
import { listOrders } from "@/features/orders/data";
import { roleHasPermission } from "@/lib/auth/permissions";
import { requireOrganization } from "@/lib/auth/session";
import { isUuid } from "@/lib/utils/ids";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerPage({ params }: PageProps<"/customers/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { organization, role } = await requireOrganization();

  const [found, { orders, total }] = await Promise.all([
    getCustomer(organization.id, id),
    listOrders({ organizationId: organization.id, customerId: id, pageSize: 10 }),
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
