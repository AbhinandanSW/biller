import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { requireOrganization } from "@/api/auth/session";
import { getProduct } from "@/api/products/queries";
import { PageHeader } from "@/app/components/layout/PageHeader";
import { ProductForm } from "@/app/components/products/ProductForm";
import { isUuid } from "@/utils/ids";
import { roleHasPermission } from "@/utils/permissions";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/products/[id]/edit">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { organization, role } = await requireOrganization();
  if (!roleHasPermission(role, "products.update")) redirect("/products");

  const product = await getProduct(organization.id, id);
  if (!product) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title={`Edit ${product.name}`} back={{ href: "/products", label: "Products" }} />
      <ProductForm product={product} />
    </div>
  );
}
