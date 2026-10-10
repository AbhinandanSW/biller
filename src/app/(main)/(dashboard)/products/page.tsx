import type { Metadata } from "next";

import { requireOrganization } from "@/api/auth/session";
import { countProducts, listProducts } from "@/api/products/queries";
import { ProductList } from "@/app/components/products/ProductList";
import { PRODUCT_PAGE_SIZE } from "@/constants/pagination";
import type { ProductStatusFilter } from "@/types/product";
import { roleHasPermission } from "@/utils/permissions";
import { oneOf, parsePage, searchParam } from "@/utils/search-params";

export const metadata: Metadata = { title: "Products" };

const STATUS_FILTERS: readonly ProductStatusFilter[] = ["ACTIVE", "ARCHIVED", "ALL"];

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const params = await searchParams;
  const { organization, role } = await requireOrganization();
  const status = oneOf(params.status, STATUS_FILTERS, "ACTIVE");
  const page = parsePage(params.page);

  const [{ products, total }, activeCount] = await Promise.all([
    listProducts({
      organizationId: organization.id,
      q: searchParam(params.q)?.trim(),
      status,
      page,
    }),
    countProducts(organization.id, "ACTIVE"),
  ]);

  return (
    <ProductList
      products={products}
      total={total}
      page={page}
      pageSize={PRODUCT_PAGE_SIZE}
      activeCount={activeCount}
      searchParams={params}
      canCreate={roleHasPermission(role, "products.create")}
      canEdit={roleHasPermission(role, "products.update")}
    />
  );
}
