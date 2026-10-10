import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  if (!result.success) {
    throw new Error(`Invalid server environment variables.\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

const blankToUndefined = (value: string | undefined) => (value?.trim() ? value.trim() : undefined);

const emailSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().positive(),
  secure: z.enum(["true", "false"]).transform((v) => v === "true"),
  user: z.string().optional(),
  password: z.string().optional(),
  fromAddress: z.email(),
});

export type EmailConfig = z.infer<typeof emailSchema>;

/** SMTP settings, or null when email sending isn't set up. */
export function getEmailConfig(): EmailConfig | null {
  const result = emailSchema.safeParse({
    host: blankToUndefined(process.env.SMTP_HOST),
    port: blankToUndefined(process.env.SMTP_PORT),
    secure: blankToUndefined(process.env.SMTP_SECURE) ?? "false",
    user: blankToUndefined(process.env.SMTP_USER),
    password: blankToUndefined(process.env.SMTP_PASSWORD),
    fromAddress: blankToUndefined(process.env.EMAIL_FROM_ADDRESS),
  });
  return result.success ? result.data : null;
}

const whatsAppSchema = z.object({
  accessToken: z.string().min(1),
  phoneNumberId: z.string().regex(/^\d+$/),
  templateName: z.string().min(1),
  templateLanguage: z.string().min(2),
  apiVersion: z.string().regex(/^v\d+\.\d+$/),
});

export type WhatsAppConfig = z.infer<typeof whatsAppSchema>;

/** WhatsApp Cloud API settings, or null when it isn't connected. */
export function getWhatsAppConfig(): WhatsAppConfig | null {
  const result = whatsAppSchema.safeParse({
    accessToken: blankToUndefined(process.env.WHATSAPP_ACCESS_TOKEN),
    phoneNumberId: blankToUndefined(process.env.WHATSAPP_PHONE_NUMBER_ID),
    templateName: blankToUndefined(process.env.WHATSAPP_TEMPLATE_NAME) ?? "invoice_document",
    templateLanguage: blankToUndefined(process.env.WHATSAPP_TEMPLATE_LANGUAGE) ?? "en",
    apiVersion: blankToUndefined(process.env.WHATSAPP_API_VERSION) ?? "v23.0",
  });
  return result.success ? result.data : null;
}
