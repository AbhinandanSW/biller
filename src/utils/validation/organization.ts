import { z } from "zod";

import { GST_STATES, PINCODE_PATTERN } from "@/constants/gst-states";
import { gstinMatchesState, isValidGstinFormat } from "@/utils/gstin";

// Mirrors the check constraints on public.organizations. The database is the
// final authority; these give users field-level errors before a round trip.

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => v || null)
    .nullable()
    .optional();

const stateCode = z.enum(GST_STATES.map((s) => s.code) as [string, ...string[]], {
  error: "Select a valid state",
});

const gstin = z
  .string()
  .trim()
  .toUpperCase()
  .refine(isValidGstinFormat, "Enter a valid 15-character GSTIN");

const documentPrefix = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9-]{1,10}$/, "Use up to 10 letters, numbers or hyphens");

const gstinInState = (v: { gstin?: string | null; stateCode?: string | null }) =>
  gstinMatchesState(v.gstin, v.stateCode);
const GSTIN_STATE_MISMATCH = {
  message: "GSTIN is registered in a different state",
  path: ["gstin"],
};

export const CreateOrganizationSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your business name").max(200),
    legalName: optionalText(200),
    gstin: gstin.nullable().optional(),
    stateCode: stateCode.nullable().optional(),
  })
  .refine(gstinInState, GSTIN_STATE_MISMATCH);

export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;

export const UpdateOrganizationSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    legalName: optionalText(200),
    gstin: gstin.nullable(),
    pan: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN")
      .nullable(),
    email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email").max(320)).nullable(),
    phone: optionalText(20),
    website: optionalText(300),
    addressLine1: optionalText(200),
    addressLine2: optionalText(200),
    city: optionalText(100),
    stateCode: stateCode.nullable(),
    pincode: z.string().trim().regex(PINCODE_PATTERN, "Enter a valid 6-digit pincode").nullable(),
    gstEnabled: z.boolean(),
    pricesIncludeTax: z.boolean(),
    defaultTaxRate: z.coerce.number().min(0).max(100),
    roundingMode: z.enum(["HALF_UP", "HALF_EVEN"]),
    taxRounding: z.enum(["PER_LINE", "PER_INVOICE"]),
    roundGrandTotal: z.boolean(),
    orderPrefix: documentPrefix,
    invoicePrefix: documentPrefix,
  })
  .partial()
  .refine(gstinInState, GSTIN_STATE_MISMATCH);

export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;

export const InviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email")),
  role: z.enum(["admin", "manager", "sales", "viewer"]),
});

export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;
