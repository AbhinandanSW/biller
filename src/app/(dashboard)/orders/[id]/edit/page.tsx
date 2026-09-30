import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { buttonClassName, Card, EmptyState } from "@/components/ui";
import { listCustomerOptions } from "@/features/customers/data";
import { OrderEditor } from "@/features/orders/components/OrderEditor";
import { getOrder, listKnownItems } from "@/features/orders/data";
import { roleHasPermission } from "@/lib/auth/permissions";
import { requireOrganization } from "@/lib/auth/session";
import { isUuid } from "@/lib/utils/ids";

export const metadata: Metadata = { title: "Edit order" };

export default async function EditOrderPage({
  params,
  searchParams,
}: PageProps<"/orders/[id]/edit">) {
  const { id } = await params;
  const { customer } = await searchParams;
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
  const preselected =
    typeof customer === "string" && customers.some((c) => c.id === customer) ? customer : null;

  return (
    <OrderEditor
      existing={order}
      customers={customers}
      knownItems={knownItems}
      preselectedCustomerId={preselected}
    />
  );
}
