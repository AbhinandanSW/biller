"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/api/auth/authorize";
import { sendEmail } from "@/api/messaging/email";
import { sendWhatsAppDocument } from "@/api/messaging/whatsapp";
import { createAdminClient } from "@/api/supabase/admin";
import { FORBIDDEN_MESSAGE } from "@/constants/messages";
import { DUPLICATE_SEND_WINDOW_SECONDS, MAX_SENDS_PER_HOUR } from "@/constants/orders";
import type { ActionResult } from "@/types/form";
import { formatMoney } from "@/utils/format";
import { pdfFileName, whatsAppNumber } from "@/utils/orders/share";
import { toOrganizationSettings } from "@/utils/organization";
import { SendDocumentSchema, type SendDocumentInput } from "@/utils/validation/order";

import { ensureInvoice } from "./actions";
import { renderOrderPdf } from "./pdf/render";
import { getOrder } from "./queries";

/**
 * Sends the invoice (or order) PDF to the customer by email or WhatsApp and
 * records the attempt in document_sends.
 */
export async function sendDocument(input: SendDocumentInput): Promise<ActionResult> {
  const context = await authorize("invoices.send");
  if (!context) return { error: FORBIDDEN_MESSAGE };

  const parsed = SendDocumentSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid request" };
  const send = parsed.data;
  const orgId = context.organization.id;

  let phone: string | null = null;
  if (send.channel === "WHATSAPP") {
    phone = whatsAppNumber(send.to);
    if (!phone) return { error: "Enter the number with country code, e.g. +91 98140 12345" };
  }

  if (send.kind === "invoice") {
    const invoice = await ensureInvoice(send.orderId);
    if ("error" in invoice) return invoice;
  }
  const order = await getOrder(orgId, send.orderId);
  if (!order) return { error: "This order no longer exists." };
  if (order.status === "CANCELLED") return { error: "Cancelled orders can't be sent." };
  if (send.kind === "invoice" && !order.invoice) return { error: "This order has no invoice." };

  const admin = createAdminClient();
  const recipient = phone ?? send.to;
  const since = (seconds: number) => new Date(Date.now() - seconds * 1000).toISOString();

  const [{ count: recentCount }, { count: duplicateCount }] = await Promise.all([
    admin
      .from("document_sends")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("created_at", since(3600)),
    admin
      .from("document_sends")
      .select("id", { count: "exact", head: true })
      .eq("order_id", order.id)
      .eq("channel", send.channel)
      .eq("recipient", recipient)
      .neq("status", "FAILED")
      .gte("created_at", since(DUPLICATE_SEND_WINDOW_SECONDS)),
  ]);
  if ((recentCount ?? 0) >= MAX_SENDS_PER_HOUR) {
    return { error: "Too many documents sent in the last hour. Please try again later." };
  }
  if ((duplicateCount ?? 0) > 0) {
    return {
      error: "This was just sent to the same recipient. Wait a moment before sending again.",
    };
  }

  const org = toOrganizationSettings(context.organization);
  const documentNumber = send.kind === "invoice" ? order.invoice!.number : order.number;
  const fileName = pdfFileName(org, order, send.kind);
  const businessName = org.legalName ?? org.name;

  const { data: record, error: insertError } = await admin
    .from("document_sends")
    .insert({
      organization_id: orgId,
      order_id: order.id,
      document_type: send.kind === "invoice" ? "INVOICE" : "ORDER",
      document_number: documentNumber,
      channel: send.channel,
      recipient,
      subject: send.channel === "EMAIL" ? send.subject : null,
      message: send.channel === "EMAIL" ? send.message : null,
      sent_by: context.user.id,
    })
    .select("id")
    .single();
  if (insertError) return { error: "Couldn't start sending. Please try again." };

  try {
    const pdf = await renderOrderPdf(order, org, send.kind);
    const providerId =
      send.channel === "EMAIL"
        ? await sendEmail({
            fromName: businessName,
            replyTo: org.email,
            to: send.to,
            subject: send.subject,
            text: send.message,
            attachment: { fileName, content: pdf },
          })
        : await sendWhatsAppDocument({
            to: phone!,
            pdf,
            fileName,
            bodyParameters: [
              order.customer.name,
              `${send.kind} ${documentNumber}`,
              formatMoney(order.totals.grandTotal),
              businessName,
            ],
          });

    await admin
      .from("document_sends")
      .update({ status: "SENT", provider_message_id: providerId })
      .eq("id", record.id);
    revalidatePath(`/orders/${order.id}`);
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sending failed";
    console.error("Document send failed", { sendId: record.id, channel: send.channel, message });
    await admin
      .from("document_sends")
      .update({ status: "FAILED", error: message.slice(0, 1000) })
      .eq("id", record.id);
    revalidatePath(`/orders/${order.id}`);
    return { error: message };
  }
}
