import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { getEmailConfig, type EmailConfig } from "@/api/env";

let transporter: { config: EmailConfig; transport: Transporter } | null = null;

function getTransport(config: EmailConfig) {
  if (!transporter || transporter.config !== config) {
    transporter = {
      config,
      transport: nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.user ? { user: config.user, pass: config.password } : undefined,
      }),
    };
  }
  return transporter.transport;
}

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );

/** Plain text → simple HTML paragraphs (text is escaped). */
function textToHtml(text: string) {
  return text
    .split(/\n{2,}/)
    .map(
      (paragraph) =>
        `<p style="margin:0 0 12px">${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
}

export interface OutgoingEmail {
  /** Shown as the sender, e.g. the business name. The address comes from config. */
  fromName: string;
  replyTo?: string | null;
  to: string;
  subject: string;
  text: string;
  attachment: { fileName: string; content: Buffer };
}

export function isEmailConfigured() {
  return getEmailConfig() !== null;
}

/** Sends one email with a PDF attached. Returns the provider's message id. */
export async function sendEmail(email: OutgoingEmail): Promise<string> {
  const config = getEmailConfig();
  if (!config) throw new Error("Email sending isn't set up");

  const info = await getTransport(config).sendMail({
    from: { name: email.fromName, address: config.fromAddress },
    replyTo: email.replyTo ?? undefined,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#15171b">${textToHtml(email.text)}</div>`,
    attachments: [
      {
        filename: email.attachment.fileName,
        content: email.attachment.content,
        contentType: "application/pdf",
      },
    ],
  });
  return info.messageId;
}
