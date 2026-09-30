import { getOrder } from "@/features/orders/data";
import { pdfFileName, pdfResponse, renderOrderPdf } from "@/features/orders/pdf/render";
import { toOrganizationSettings } from "@/features/organizations/settings";
import { requireOrganization } from "@/lib/auth/session";
import { isUuid } from "@/lib/utils/ids";

/** GET /orders/{id}/pdf?type=invoice|order[&download=1] — for signed-in members. */
export async function GET(request: Request, { params }: RouteContext<"/orders/[id]/pdf">) {
  const { id } = await params;
  if (!isUuid(id)) return new Response("Not found", { status: 404 });

  const { organization } = await requireOrganization();
  const order = await getOrder(organization.id, id);
  if (!order) return new Response("Not found", { status: 404 });

  const url = new URL(request.url);
  const kind = url.searchParams.get("type") === "invoice" ? "invoice" : "order";
  if (kind === "invoice" && !order.invoice) {
    return new Response("This order hasn't been invoiced yet", { status: 404 });
  }

  const org = toOrganizationSettings(organization);
  const pdf = await renderOrderPdf(order, org, kind);
  return pdfResponse(pdf, pdfFileName(org, order, kind), url.searchParams.has("download"));
}
