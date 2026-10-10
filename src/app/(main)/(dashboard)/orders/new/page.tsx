import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireOrganization } from "@/api/auth/session";
import { listCustomerOptions } from "@/api/customers/queries";
import { listKnownItems } from "@/api/orders/queries";
import { listProductOptions } from "@/api/products/queries";
import { OrderEditor } from "@/app/components/orders/OrderEditor";
import { roleHasPermission } from "@/utils/permissions";
import { searchParam } from "@/utils/search-params";

export const metadata: Metadata = { title: "New order" };

export default async function NewOrderPage({ searchParams }: PageProps<"/orders/new">) {
  const customerId = searchParam((await searchParams).customer);
  const { organization, role } = await requireOrganization();
  if (!roleHasPermission(role, "orders.create")) redirect("/orders");

  const [customers, knownItems, products] = await Promise.all([
    listCustomerOptions(organization.id),
    listKnownItems(organization.id),
    listProductOptions(organization.id),
  ]);
  const preselected = customers.find((c) => c.id === customerId)?.id ?? null;

  return (
    <OrderEditor
      customers={customers}
      knownItems={knownItems}
      products={products}
      preselectedCustomerId={preselected}
    />
  );
}
