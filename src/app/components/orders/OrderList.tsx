import { Plus, ShoppingCart } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/app/components/layout/PageHeader";
import { FilterSelect } from "@/app/components/tables/FilterSelect";
import { Pagination } from "@/app/components/tables/Pagination";
import { SearchInput } from "@/app/components/tables/SearchInput";
import { buttonClassName, Card, EmptyState } from "@/app/components/ui";
import type { OrderRow } from "@/types/order";

import { OrdersTable } from "./OrdersTable";

export function OrderList({
  orders,
  total,
  allCount,
  page,
  pageSize,
  filterOptions,
  searchParams,
  canCreate,
}: {
  orders: OrderRow[];
  total: number;
  allCount: number;
  page: number;
  pageSize: number;
  filterOptions: { value: string; label: string }[];
  searchParams: Record<string, string | string[] | undefined>;
  canCreate: boolean;
}) {
  const newButton = canCreate && (
    <Link href="/orders/new" className={buttonClassName()}>
      <Plus aria-hidden />
      New order
    </Link>
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Orders & invoices"
        description={`${allCount} ${allCount === 1 ? "order" : "orders"}`}
        actions={newButton}
      />

      {allCount === 0 ? (
        <Card>
          <EmptyState
            icon={<ShoppingCart />}
            title="No orders yet"
            description="Create an order, confirm it, then generate the GST invoice."
            action={newButton}
          />
        </Card>
      ) : (
        <Card>
          <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center">
            <SearchInput
              placeholder="Search order, invoice, customer or item"
              label="Search orders"
            />
            <FilterSelect param="show" label="Show" options={filterOptions} defaultValue="all" />
          </div>
          {orders.length === 0 ? (
            <EmptyState
              title="No matching orders"
              description="Try a different search or filter."
            />
          ) : (
            <>
              <OrdersTable orders={orders} />
              <div className="border-t border-border px-3">
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  total={total}
                  searchParams={searchParams}
                  pathname="/orders"
                />
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
