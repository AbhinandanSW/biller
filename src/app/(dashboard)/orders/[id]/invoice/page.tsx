import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InvoiceView } from "@/features/orders/components/InvoiceView";
import { getOrder } from "@/features/orders/data";
import { toOrganizationSettings } from "@/features/organizations/settings";
import { requireOrganization } from "@/lib/auth/session";
import { getPublicEnv } from "@/lib/env";
import { roleHasPermission as can } from "@/lib/auth/permissions";
import { isEmailConfigured } from "@/lib/messaging/email";
import { isWhatsAppConfigured } from "@/lib/messaging/whatsapp";
import { isUuid } from "@/lib/utils/ids";

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
      shareUrl={`${getPublicEnv().NEXT_PUBLIC_APP_URL}/share/${order.shareToken}`}
      sending={
        can(role, "invoices.send")
          ? { email: isEmailConfigured(), whatsapp: isWhatsAppConfigured() }
          : null
      }
    />
  );
}
