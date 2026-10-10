import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireOrganization } from "@/api/auth/session";
import { sendingChannels } from "@/api/messaging/channels";
import { getOrder, listDocumentSends } from "@/api/orders/queries";
import { OrderDetail } from "@/app/components/orders/OrderDetail";
import { isUuid } from "@/utils/ids";
import { roleHasPermission } from "@/utils/permissions";
import { shareUrl } from "@/utils/routes";

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
  const [order, sends] = await Promise.all([
    getOrder(organization.id, id),
    listDocumentSends(organization.id, id),
  ]);
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
      shareUrl={shareUrl(order.shareToken)}
      fileBusinessName={organization.name}
      sending={sendingChannels(role)}
      sends={sends}
    />
  );
}
