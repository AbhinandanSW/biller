import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireOrganization } from "@/api/auth/session";
import { listCustomerOptions } from "@/api/customers/queries";
import { getOrder, listKnownItems } from "@/api/orders/queries";
import { OrderEditor } from "@/app/components/orders/OrderEditor";
import { buttonClassName, Card, EmptyState } from "@/app/components/ui";
import { isUuid } from "@/utils/ids";
import { roleHasPermission } from "@/utils/permissions";
import { searchParam } from "@/utils/search-params";

export const metadata: Metadata = { title: "Edit order" };

export default async function EditOrderPage({
  params,
  searchParams,
}: PageProps<"/orders/[id]/edit">) {
  const { id } = await params;
  const customerId = searchParam((await searchParams).customer);
  if (!isUuid(id)) notFound();
  const { organization, role } = await requireOrganization();
  if (!roleHasPermission(role, "orders.update")) redirect(`/orders/${id}`);

  const order = await getOrder(organization.id, id);
  if (!order) notFound();
  if (order.status !== "DRAFT") {
    return (
      <Card className="mx-auto max-w-lg">
        <EmptyState
          title="Only draft orders can be edited"
          description="Confirmed and cancelled orders are kept exactly as they were."
          action={
            <Link
              href={`/orders/${order.id}`}
              className={buttonClassName({ variant: "secondary" })}
            >
              View order
            </Link>
          }
        />
      </Card>
    );
  }

  const [customers, knownItems] = await Promise.all([
    listCustomerOptions(organization.id, order.customerId),
    listKnownItems(organization.id),
  ]);
  // A customer just added from this screen comes back as ?customer=.
  const preselected = customers.find((c) => c.id === customerId)?.id ?? null;

  return (
    <OrderEditor
      existing={order}
      customers={customers}
      knownItems={knownItems}
      preselectedCustomerId={preselected}
    />
  );
}
