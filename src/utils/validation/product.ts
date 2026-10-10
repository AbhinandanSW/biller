import { z } from "zod";

import { GST_RATES } from "@/constants/products";

import { moneyString, optionalText } from "./common";

// Mirrors the check constraints on public.products.
export const ProductFormSchema = z.object({
  name: z.string().trim().min(1, "Enter the product name").max(300),
  code: optionalText(40),
  description: optionalText(1000),
  hsnCode: z
    .string()
    .trim()
    .transform((v) => v || null)
    .pipe(
      z
        .string()
        .regex(/^[0-9]{4,8}$/, "HSN codes are 4 to 8 digits")
        .nullable(),
    ),
  unit: z.string().trim().min(1, "Enter the unit, e.g. pcs or kg").max(20),
  price: moneyString,
  taxRate: z.enum(GST_RATES, { error: "Select the GST rate" }),
});

export type ProductFormField = keyof z.input<typeof ProductFormSchema>;
export type ProductInput = z.output<typeof ProductFormSchema>;

export const PRODUCT_FORM_FIELDS = [
  "name",
  "code",
  "description",
  "hsnCode",
  "unit",
  "price",
  "taxRate",
] as const satisfies readonly ProductFormField[];
