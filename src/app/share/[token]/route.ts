import { getSharedOrder } from "@/features/orders/data";
import { pdfFileName, pdfResponse, renderOrderPdf } from "@/features/orders/pdf/render";
import { toOrganizationSettings } from "@/features/organizations/settings";
import { isUuid } from "@/lib/utils/ids";

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
  const org = toOrganizationSettings(organization);
  const pdf = await renderOrderPdf(order, org, kind);
  return pdfResponse(pdf, pdfFileName(org, order, kind), url.searchParams.has("download"));
}
