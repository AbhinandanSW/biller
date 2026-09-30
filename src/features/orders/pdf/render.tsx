import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";

import type { OrganizationSettings } from "../../organizations/OrganizationProvider";
import { documentFileName } from "../share";
import type { Order } from "../types";
import { registerPdfFonts } from "./fonts";
import { OrderPdf, type PdfKind } from "./OrderPdf";

export type { PdfKind };

export async function renderOrderPdf(order: Order, org: OrganizationSettings, kind: PdfKind) {
  registerPdfFonts();
  return renderToBuffer(<OrderPdf order={order} org={org} kind={kind} />);
}

/** e.g. ABC_Distributors_INV-2026-000001.pdf (spec §111). */
export function pdfFileName(org: OrganizationSettings, order: Order, kind: PdfKind) {
  const number = kind === "invoice" && order.invoice ? order.invoice.number : order.number;
  return documentFileName(org.name, number);
}

/** PDF response; `download` makes the browser save it instead of showing it. */
export function pdfResponse(pdf: Buffer, fileName: string, download: boolean) {
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
