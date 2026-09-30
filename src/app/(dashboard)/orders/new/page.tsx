import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { listCustomerOptions } from "@/features/customers/data";
import { OrderEditor } from "@/features/orders/components/OrderEditor";
import { listKnownItems } from "@/features/orders/data";
import { roleHasPermission } from "@/lib/auth/permissions";
import { requireOrganization } from "@/lib/auth/session";

export const metadata: Metadata = { title: "New order" };

export default async function NewOrderPage({ searchParams }: PageProps<"/orders/new">) {
  const { customer } = await searchParams;
  const { organization, role } = await requireOrganization();
  if (!roleHasPermission(role, "orders.create")) redirect("/orders");

  const [customers, knownItems] = await Promise.all([
    listCustomerOptions(organization.id),
    listKnownItems(organization.id),
  ]);
  const preselected =
    typeof customer === "string" && customers.some((c) => c.id === customer) ? customer : null;

  return (
    <OrderEditor
      customers={customers}
      knownItems={knownItems}
      preselectedCustomerId={preselected}
    />
  );
}
