import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireOrganization } from "@/api/auth/session";
import { sendingChannels } from "@/api/messaging/channels";
import { getOrder } from "@/api/orders/queries";
import { InvoiceView } from "@/app/components/orders/InvoiceView";
import { isUuid } from "@/utils/ids";
import { toOrganizationSettings } from "@/utils/organization";
import { shareUrl } from "@/utils/routes";

export async function generateMetadata({
  params,
}: PageProps<"/orders/[id]/invoice">): Promise<Metadata> {
  const { id } = await params;
  if (!isUuid(id)) return { title: "Invoice" };
  const { organization } = await requireOrganization();
  const order = await getOrder(organization.id, id);
  return { title: order?.invoice?.number ?? "Invoice" };
}

export default async function InvoicePage({ params }: PageProps<"/orders/[id]/invoice">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const { organization, role } = await requireOrganization();
  const order = await getOrder(organization.id, id);
  if (!order?.invoice) notFound();

  return (
    <InvoiceView
      order={order}
      org={toOrganizationSettings(organization)}
      shareUrl={shareUrl(order.shareToken)}
      sending={sendingChannels(role)}
    />
  );
}
