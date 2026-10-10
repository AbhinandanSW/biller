import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireOrganization } from "@/api/auth/session";
import { PageHeader } from "@/app/components/layout/PageHeader";
import { ProductForm } from "@/app/components/products/ProductForm";
import { roleHasPermission } from "@/utils/permissions";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  const { role } = await requireOrganization();
  if (!roleHasPermission(role, "products.create")) redirect("/products");

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="Add product" back={{ href: "/products", label: "Products" }} />
      <ProductForm />
    </div>
  );
}
