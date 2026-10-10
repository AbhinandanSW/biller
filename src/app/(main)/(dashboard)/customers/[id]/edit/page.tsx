import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { requireOrganization } from "@/api/auth/session";
import { getCustomer } from "@/api/customers/queries";
import { CustomerForm } from "@/app/components/customers/CustomerForm";
import { PageHeader } from "@/app/components/layout/PageHeader";
import { isUuid } from "@/utils/ids";
import { roleHasPermission } from "@/utils/permissions";

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
