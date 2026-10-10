import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireOrganization } from "@/api/auth/session";
import { CustomerForm } from "@/app/components/customers/CustomerForm";
import { PageHeader } from "@/app/components/layout/PageHeader";
import { roleHasPermission } from "@/utils/permissions";
import { safeNextPath } from "@/utils/routes";
import { searchParam } from "@/utils/search-params";

export const metadata: Metadata = { title: "Add customer" };

export default async function NewCustomerPage({ searchParams }: PageProps<"/customers/new">) {
  const returnTo = searchParam((await searchParams).returnTo);
  const { organization, role } = await requireOrganization();
  if (!roleHasPermission(role, "customers.create")) redirect("/customers");
  // `?returnTo=` sends the user back (e.g. to the order they were writing).
  const back = returnTo !== undefined ? safeNextPath(returnTo) : undefined;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Add customer"
        back={{ href: back ?? "/customers", label: back ? "Back to order" : "Customers" }}
      />
      <CustomerForm defaultStateCode={organization.state_code} returnTo={back} />
    </div>
  );
}
