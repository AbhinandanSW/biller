import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";

import type { DocumentKind, Order } from "@/types/order";
import type { Organization, OrganizationSettings } from "@/types/organization";
import { pdfFileName } from "@/utils/orders/share";
import { toOrganizationSettings } from "@/utils/organization";

import { registerPdfFonts } from "./fonts";
import { OrderPdf } from "./OrderPdf";

export async function renderOrderPdf(order: Order, org: OrganizationSettings, kind: DocumentKind) {
  registerPdfFonts();
  return renderToBuffer(<OrderPdf order={order} org={org} kind={kind} />);
}

/** PDF response; `download` makes the browser save it instead of showing it. */
function pdfResponse(pdf: Buffer, fileName: string, download: boolean) {
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

/** Renders an order or its invoice and returns it as a PDF response. */
export async function orderPdfResponse(
  order: Order,
  organization: Organization,
  kind: DocumentKind,
  download: boolean,
): Promise<Response> {
  const org = toOrganizationSettings(organization);
  const pdf = await renderOrderPdf(order, org, kind);
  return pdfResponse(pdf, pdfFileName(org, order, kind), download);
}
