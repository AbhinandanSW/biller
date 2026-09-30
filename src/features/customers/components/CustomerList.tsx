import { Plus, Users } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/PageHeader";
import { FilterSelect } from "@/components/tables/FilterSelect";
import { Pagination } from "@/components/tables/Pagination";
import { SearchInput } from "@/components/tables/SearchInput";
import {
  Badge,
  buttonClassName,
  Card,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { formatMoney } from "@/lib/utils/format";

import { stateName } from "../format";
import type { Customer, CustomerStats } from "../types";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "ALL", label: "All" },
];

export function CustomerList({
  customers,
  total,
  page,
  pageSize,
  activeCount,
  searchParams,
  canCreate,
}: {
  customers: (Customer & { stats: CustomerStats })[];
  total: number;
  page: number;
  pageSize: number;
  activeCount: number;
  searchParams: Record<string, string | string[] | undefined>;
  canCreate: boolean;
}) {
  const addButton = canCreate && (
    <Link href="/customers/new" className={buttonClassName()}>
      <Plus aria-hidden />
      Add customer
    </Link>
  );
  const filtered = Boolean(searchParams.q || searchParams.status);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Customers"
        description={`${activeCount} active ${activeCount === 1 ? "customer" : "customers"}`}
        actions={addButton}
      />

      {total === 0 && !filtered ? (
        <Card>
          <EmptyState
            icon={<Users />}
            title="No customers yet"
            description="Add the businesses you sell to. Their billing state decides whether orders get CGST + SGST or IGST."
            action={addButton}
          />
        </Card>
      ) : (
        <Card>
          <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center">
            <SearchInput placeholder="Search name, phone, GSTIN, city" label="Search customers" />
            <FilterSelect
              param="status"
              label="Status"
              options={STATUS_OPTIONS}
              defaultValue="ACTIVE"
            />
          </div>

          {customers.length === 0 ? (
            <EmptyState title="No matching customers" description="Try a different search." />
          ) : (
            <>
              <Table aria-label="Customers">
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead className="hidden lg:table-cell">State</TableHead>
                    <TableHead numeric className="hidden sm:table-cell">
                      Orders
                    </TableHead>
                    <TableHead numeric>Revenue</TableHead>
                    <TableHead numeric className="hidden sm:table-cell">
                      Outstanding
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => (
                    <TableRow key={c.id} className="relative">
                      <TableCell>
                        <Link
                          href={`/customers/${c.id}`}
                          className="font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
                        >
                          {c.name}
                        </Link>
                        <div className="flex flex-wrap items-center gap-1.5 text-caption text-muted-foreground">
                          {[c.code, c.contactPerson].filter(Boolean).join(" · ") || c.billing.city}
                          {c.status === "ARCHIVED" && <Badge>Archived</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {c.phone ?? "—"}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {stateName(c.billing.stateCode)}
                      </TableCell>
                      <TableCell numeric className="hidden sm:table-cell">
                        {c.stats.orderCount}
                      </TableCell>
                      <TableCell numeric>{formatMoney(c.stats.revenue)}</TableCell>
                      <TableCell
                        numeric
                        className={
                          c.stats.outstanding
                            ? "hidden text-warning sm:table-cell"
                            : "hidden text-muted-foreground sm:table-cell"
                        }
                      >
                        {formatMoney(c.stats.outstanding)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t border-border px-3">
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  searchParams={searchParams}
                  pathname="/customers"
                />
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
