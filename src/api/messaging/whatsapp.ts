import "server-only";

import { getWhatsAppConfig, type WhatsAppConfig } from "@/api/env";

/**
 * WhatsApp Business Cloud API (Meta). Sending a PDF to a customer who hasn't
 * messaged you in the last 24 hours needs an approved template with a
 * DOCUMENT header; see docs/whatsapp-template.md for the one this expects.
 */

export function isWhatsAppConfigured() {
  return getWhatsAppConfig() !== null;
}

interface GraphError {
  error?: { message?: string; error_user_msg?: string; code?: number };
}

async function graph<T>(config: WhatsAppConfig, path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`https://graph.facebook.com/${config.apiVersion}/${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${config.accessToken}`, ...init.headers },
  });
  const body = (await response.json().catch(() => ({}))) as T & GraphError;
  if (!response.ok) {
    const message = body.error?.error_user_msg ?? body.error?.message ?? `HTTP ${response.status}`;
    throw new Error(`WhatsApp: ${message}`);
  }
  return body;
}

export interface WhatsAppDocument {
  /** Phone in international format, digits only (e.g. 919810012345). */
  to: string;
  pdf: Buffer;
  fileName: string;
  /** Values for the template body's {{1}}, {{2}}, … in order. */
  bodyParameters: string[];
}

/** Uploads the PDF and sends it with the invoice template. Returns the message id. */
export async function sendWhatsAppDocument(message: WhatsAppDocument): Promise<string> {
  const config = getWhatsAppConfig();
  if (!config) throw new Error("WhatsApp isn't connected");

  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("type", "application/pdf");
  form.append(
    "file",
    new Blob([new Uint8Array(message.pdf)], { type: "application/pdf" }),
    message.fileName,
  );
  const media = await graph<{ id: string }>(config, `${config.phoneNumberId}/media`, {
    method: "POST",
    body: form,
  });

  const sent = await graph<{ messages?: { id: string }[] }>(
    config,
    `${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: message.to,
        type: "template",
        template: {
          name: config.templateName,
          language: { code: config.templateLanguage },
          components: [
            {
              type: "header",
              parameters: [
                { type: "document", document: { id: media.id, filename: message.fileName } },
              ],
            },
            {
              type: "body",
              parameters: message.bodyParameters.map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
    },
  );
  return sent.messages?.[0]?.id ?? media.id;
}
