import { Package, Plus } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/app/components/layout/PageHeader";
import { FilterSelect } from "@/app/components/tables/FilterSelect";
import { Pagination } from "@/app/components/tables/Pagination";
import { SearchInput } from "@/app/components/tables/SearchInput";
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
} from "@/app/components/ui";
import type { Product } from "@/types/product";
import { formatMoney, formatPercent } from "@/utils/format";

import { ProductThumb } from "./ProductThumb";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "ALL", label: "All" },
];

export function ProductList({
  products,
  total,
  page,
  pageSize,
  activeCount,
  searchParams,
  canCreate,
  canEdit,
}: {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  activeCount: number;
  searchParams: Record<string, string | string[] | undefined>;
  canCreate: boolean;
  canEdit: boolean;
}) {
  const addButton = canCreate && (
    <Link href="/products/new" className={buttonClassName()}>
      <Plus aria-hidden />
      Add product
    </Link>
  );
  const filtered = Boolean(searchParams.q || searchParams.status);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title="Products"
        description={`${activeCount} active ${activeCount === 1 ? "product" : "products"}`}
        actions={addButton}
      />

      {total === 0 && !filtered ? (
        <Card>
          <EmptyState
            icon={<Package />}
            title="No products yet"
            description="Add what you sell with its price and GST rate, then pick it on orders instead of typing it each time."
            action={addButton}
          />
        </Card>
      ) : (
        <Card>
          <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center">
            <SearchInput placeholder="Search name, code, HSN" label="Search products" />
            <FilterSelect
              param="status"
              label="Status"
              options={STATUS_OPTIONS}
              defaultValue="ACTIVE"
            />
          </div>

          {products.length === 0 ? (
            <EmptyState title="No matching products" description="Try a different search." />
          ) : (
            <>
              <Table aria-label="Products">
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="hidden md:table-cell">HSN</TableHead>
                    <TableHead className="hidden sm:table-cell">Unit</TableHead>
                    <TableHead numeric>Price</TableHead>
                    <TableHead numeric className="hidden sm:table-cell">
                      GST
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id} className="relative">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProductThumb src={p.imageUrl} />
                          <div className="min-w-0">
                            {canEdit ? (
                              <Link
                                href={`/products/${p.id}/edit`}
                                className="font-medium after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
                              >
                                {p.name}
                              </Link>
                            ) : (
                              <span className="font-medium">{p.name}</span>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5 text-caption text-muted-foreground">
                              {p.code && <span className="font-mono">{p.code}</span>}
                              {p.status === "ARCHIVED" && <Badge>Archived</Badge>}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden font-mono text-muted-foreground md:table-cell">
                        {p.hsnCode ?? "—"}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {p.unit}
                      </TableCell>
                      <TableCell numeric>{formatMoney(p.price)}</TableCell>
                      <TableCell numeric className="hidden text-muted-foreground sm:table-cell">
                        {formatPercent(p.taxRate)}
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
                  pathname="/products"
                />
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
