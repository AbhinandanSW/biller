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
  link: string;
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
        "",
        `View or download: ${d.link}`,
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
      "",
      `View or download: ${d.link}`,
      "",
      "Thank you,",
      d.businessName,
    ].join("\n"),
  };
}
