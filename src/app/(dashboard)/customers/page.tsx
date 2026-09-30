import type { Metadata } from "next";

import { parsePage } from "@/components/tables/Pagination";
import { CustomerList } from "@/features/customers/components/CustomerList";
import { countCustomers, CUSTOMER_PAGE_SIZE, listCustomers } from "@/features/customers/data";
import { roleHasPermission } from "@/lib/auth/permissions";
import { requireOrganization } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Customers" };

const param = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

export default async function CustomersPage({ searchParams }: PageProps<"/customers">) {
  const params = await searchParams;
  const { organization, role } = await requireOrganization();
  const statusParam = param(params.status);
  const status = statusParam === "ARCHIVED" || statusParam === "ALL" ? statusParam : "ACTIVE";
  const page = parsePage(params.page);

  const [{ customers, total }, activeCount] = await Promise.all([
    listCustomers({ organizationId: organization.id, q: param(params.q)?.trim(), status, page }),
    countCustomers(organization.id, "ACTIVE"),
  ]);

  return (
    <CustomerList
      customers={customers}
      total={total}
      page={page}
      pageSize={CUSTOMER_PAGE_SIZE}
      activeCount={activeCount}
      searchParams={params}
      canCreate={roleHasPermission(role, "customers.create")}
    />
  );
}
