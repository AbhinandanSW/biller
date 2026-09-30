import { formatMoney } from "@/lib/utils/format";

/**
 * Phone number for wa.me links: digits only, with India's country code added
 * to 10-digit numbers. Returns null when it doesn't look like a phone number.
 */
export function whatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
}

export interface ShareDetails {
  kind: "invoice" | "order";
  number: string;
  customerName: string;
  businessName: string;
  grandTotal: string;
  dueDate?: string | null;
  /** Omit when the PDF is attached (email) so the message doesn't need a link. */
  link?: string;
}

/** File name for a document, e.g. ABC_Distributors_INV-2026-000001.pdf (spec §111). */
export function documentFileName(businessName: string, documentNumber: string) {
  const business = businessName.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return `${business}_${documentNumber}.pdf`;
}

/** Text of the WhatsApp template (docs/whatsapp-template.md) as the customer sees it. */
export function whatsAppTemplatePreview(d: Omit<ShareDetails, "link" | "dueDate">) {
  return `Hello ${d.customerName}, please find your ${d.kind} ${d.number} for ${formatMoney(d.grandTotal)}. Thank you, ${d.businessName}.`;
}

/** Message template (spec §43, §90). */
export function shareMessage(d: ShareDetails): { subject: string; body: string } {
  const amount = formatMoney(d.grandTotal);
  if (d.kind === "invoice") {
    return {
      subject: `Invoice ${d.number} from ${d.businessName}`,
      body: [
        `Hello ${d.customerName},`,
        "",
        `Please find your invoice ${d.number} for ${amount}.`,
        d.dueDate ? `Payment is due by ${d.dueDate}.` : "",
        ...(d.link ? ["", `View or download: ${d.link}`] : ["", "The invoice is attached."]),
        "",
        "Thank you,",
        d.businessName,
      ]
        .filter((line, i, all) => line !== "" || all[i - 1] !== "")
        .join("\n"),
    };
  }
  return {
    subject: `Order ${d.number} from ${d.businessName}`,
    body: [
      `Hello ${d.customerName},`,
      "",
      `Your order ${d.number} for ${amount} has been received.`,
      ...(d.link ? ["", `View or download: ${d.link}`] : ["", "The order is attached."]),
      "",
      "Thank you,",
      d.businessName,
    ].join("\n"),
  };
}
