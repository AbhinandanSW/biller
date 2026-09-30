import { z } from "zod";

import { GST_STATES, isValidGstinFormat } from "@/constants/gst-states";
import { optionalText } from "@/lib/validation/common";

import type { CustomerInput } from "./types";

const stateCode = z
  .string()
  .refine((v) => GST_STATES.some((s) => s.code === v), "Select the state");

const pincode = z
  .string()
  .trim()
  .transform((v) => v || null)
  .pipe(
    z
      .string()
      .regex(/^[1-9][0-9]{5}$/, "Enter a 6-digit pincode")
      .nullable(),
  );

export const CustomerFormSchema = z
  .object({
    name: z.string().trim().min(1, "Enter the customer name").max(200),
    code: optionalText(20),
    contactPerson: optionalText(100),
    phone: z
      .string()
      .trim()
      .transform((v) => v || null)
      .pipe(
        z
          .string()
          .regex(/^[+0-9 ()-]{7,20}$/, "Enter a valid phone number")
          .nullable(),
      ),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .transform((v) => v || null)
      .pipe(z.email("Enter a valid email").nullable()),
    gstin: z
      .string()
      .trim()
      .toUpperCase()
      .transform((v) => v || null)
      .pipe(z.string().refine(isValidGstinFormat, "Enter a valid 15-character GSTIN").nullable()),
    billingLine1: z.string().trim().min(1, "Enter the address").max(200),
    billingLine2: optionalText(200),
    billingCity: z.string().trim().min(1, "Enter the city").max(100),
    billingStateCode: stateCode,
    billingPincode: pincode,
    shippingSameAsBilling: z.boolean(),
    shippingLine1: optionalText(200),
    shippingLine2: optionalText(200),
    shippingCity: optionalText(100),
    shippingStateCode: z.string(),
    shippingPincode: pincode,
    notes: optionalText(1000),
  })
  // A GSTIN is registered in one state; billing must be there for GST to be right.
  .refine((v) => !v.gstin || v.gstin.slice(0, 2) === v.billingStateCode, {
    message: "This GSTIN is registered in a different state from the billing address",
    path: ["gstin"],
  })
  .superRefine((v, ctx) => {
    if (v.shippingSameAsBilling) return;
    if (!v.shippingLine1)
      ctx.addIssue({ code: "custom", message: "Enter the address", path: ["shippingLine1"] });
    if (!v.shippingCity)
      ctx.addIssue({ code: "custom", message: "Enter the city", path: ["shippingCity"] });
    if (!GST_STATES.some((s) => s.code === v.shippingStateCode)) {
      ctx.addIssue({ code: "custom", message: "Select the state", path: ["shippingStateCode"] });
    }
  });

export type CustomerFormField = keyof z.input<typeof CustomerFormSchema>;

/** Form output → the shape the data layer stores. */
export function toCustomerInput(v: z.output<typeof CustomerFormSchema>): CustomerInput {
  return {
    name: v.name,
    code: v.code,
    contactPerson: v.contactPerson,
    phone: v.phone,
    email: v.email,
    gstin: v.gstin,
    billing: {
      line1: v.billingLine1,
      line2: v.billingLine2 ?? "",
      city: v.billingCity,
      stateCode: v.billingStateCode,
      pincode: v.billingPincode ?? "",
    },
    shippingSameAsBilling: v.shippingSameAsBilling,
    shipping: v.shippingSameAsBilling
      ? null
      : {
          line1: v.shippingLine1 ?? "",
          line2: v.shippingLine2 ?? "",
          city: v.shippingCity ?? "",
          stateCode: v.shippingStateCode,
          pincode: v.shippingPincode ?? "",
        },
    notes: v.notes,
  };
}
