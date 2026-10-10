import type { Metadata } from "next";

import { requireOrganization } from "@/api/auth/session";
import { countCustomers, listCustomers } from "@/api/customers/queries";
import { CustomerList } from "@/app/components/customers/CustomerList";
import { CUSTOMER_PAGE_SIZE } from "@/constants/pagination";
import type { CustomerStatusFilter } from "@/types/customer";
import { roleHasPermission } from "@/utils/permissions";
import { oneOf, parsePage, searchParam } from "@/utils/search-params";

export const metadata: Metadata = { title: "Customers" };

const STATUS_FILTERS: readonly CustomerStatusFilter[] = ["ACTIVE", "ARCHIVED", "ALL"];

export default async function CustomersPage({ searchParams }: PageProps<"/customers">) {
  const params = await searchParams;
  const { organization, role } = await requireOrganization();
  const status = oneOf(params.status, STATUS_FILTERS, "ACTIVE");
  const page = parsePage(params.page);

  const [{ customers, total }, activeCount] = await Promise.all([
    listCustomers({
      organizationId: organization.id,
      q: searchParam(params.q)?.trim(),
      status,
      page,
    }),
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
