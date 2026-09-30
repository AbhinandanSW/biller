import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrderDetail } from "@/features/orders/components/OrderDetail";
import { getOrder } from "@/features/orders/data";
import { roleHasPermission } from "@/lib/auth/permissions";
import { requireOrganization } from "@/lib/auth/session";
import { getPublicEnv } from "@/lib/env";
import { isUuid } from "@/lib/utils/ids";

export async function generateMetadata({ params }: PageProps<"/orders/[id]">): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Order" };
  const { organization } = await requireOrganization();
  return { title: (await getOrder(organization.id, id))?.number ?? "Order" };
}

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { organization, role } = await requireOrganization();
  const order = await getOrder(organization.id, id);
  if (!order) notFound();

  return (
    <OrderDetail
      order={order}
      can={{
        edit: roleHasPermission(role, "orders.update"),
        cancel: roleHasPermission(role, "orders.cancel"),
        invoice: roleHasPermission(role, "invoices.create"),
      }}
      businessName={organization.legal_name ?? organization.name}
      shareUrl={`${getPublicEnv().NEXT_PUBLIC_APP_URL}/share/${order.shareToken}`}
    />
  );
}
