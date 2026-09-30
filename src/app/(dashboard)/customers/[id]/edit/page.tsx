import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { CustomerForm } from "@/features/customers/components/CustomerForm";
import { getCustomer } from "@/features/customers/data";
import { roleHasPermission } from "@/lib/auth/permissions";
import { requireOrganization } from "@/lib/auth/session";
import { isUuid } from "@/lib/utils/ids";

export const metadata: Metadata = { title: "Edit customer" };

export default async function EditCustomerPage({ params }: PageProps<"/customers/[id]/edit">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { organization, role } = await requireOrganization();
  if (!roleHasPermission(role, "customers.update")) redirect(`/customers/${id}`);

  const found = await getCustomer(organization.id, id);
  if (!found) notFound();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title={`Edit ${found.customer.name}`}
        back={{ href: `/customers/${id}`, label: found.customer.name }}
      />
      <CustomerForm customer={found.customer} />
    </div>
  );
}
