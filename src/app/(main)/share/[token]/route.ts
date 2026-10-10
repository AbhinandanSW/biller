import { orderPdfResponse } from "@/api/orders/pdf/render";
import { getSharedOrder } from "@/api/orders/queries";
import { isUuid } from "@/utils/ids";

/**
 * GET /share/{token}[?type=order] — public link sent to customers. Shows the
 * invoice when there is one, otherwise the order confirmation.
 */
export async function GET(request: Request, { params }: RouteContext<"/share/[token]">) {
  const { token } = await params;
  if (!isUuid(token)) return new Response("Not found", { status: 404 });

  const shared = await getSharedOrder(token);
  if (!shared) return new Response("Not found", { status: 404 });
  const { order, organization } = shared;

  const url = new URL(request.url);
  const kind = order.invoice && url.searchParams.get("type") !== "order" ? "invoice" : "order";
  return orderPdfResponse(order, organization, kind, url.searchParams.has("download"));
}
