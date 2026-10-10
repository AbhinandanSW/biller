import { requireOrganization } from "@/api/auth/session";
import { orderPdfResponse } from "@/api/orders/pdf/render";
import { getOrder } from "@/api/orders/queries";
import { isUuid } from "@/utils/ids";

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

  return orderPdfResponse(order, organization, kind, url.searchParams.has("download"));
}
