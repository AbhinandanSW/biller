import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/PageHeader";
import { CustomerForm } from "@/features/customers/components/CustomerForm";
import { roleHasPermission } from "@/lib/auth/permissions";
import { safeNextPath } from "@/lib/auth/routes";
import { requireOrganization } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Add customer" };

export default async function NewCustomerPage({ searchParams }: PageProps<"/customers/new">) {
  const { returnTo } = await searchParams;
  const { organization, role } = await requireOrganization();
  if (!roleHasPermission(role, "customers.create")) redirect("/customers");
  // `?returnTo=` sends the user back (e.g. to the order they were writing).
  const back = typeof returnTo === "string" ? safeNextPath(returnTo) : undefined;

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
