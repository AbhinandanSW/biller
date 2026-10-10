import { z } from "zod";

import { MAX_ORDER_CHARGES, MAX_ORDER_ITEMS } from "@/constants/orders";

const text = (max: number) => z.string().max(max);

// Shape and size checks only — the calculation engine validates the numbers.
export const OrderInputSchema = z.object({
  customerId: z.uuid("Choose a customer"),
  date: z.iso.date("Enter the order date"),
  items: z
    .array(
      z.object({
        id: text(64),
        productId: z.uuid().nullable(),
        name: text(300),
        hsnCode: z
          .string()
          .trim()
          .regex(/^[0-9]{0,8}$/, "HSN codes are up to 8 digits"),
        quantity: text(20),
        unit: text(20),
        rate: text(20),
        discountPercent: text(10),
        taxRate: text(10),
      }),
    )
    .max(MAX_ORDER_ITEMS, `An order can have at most ${MAX_ORDER_ITEMS} items`),
  orderDiscount: z.object({ type: z.enum(["PERCENTAGE", "FIXED"]), value: text(20) }),
  charges: z
    .array(z.object({ id: text(64), label: text(100), amount: text(20), taxRate: text(10) }))
    .max(MAX_ORDER_CHARGES),
  notes: text(2000),
});

const documentKind = z.enum(["invoice", "order"]);

export const SendDocumentSchema = z.discriminatedUnion("channel", [
  z.object({
    channel: z.literal("EMAIL"),
    orderId: z.uuid(),
    kind: documentKind,
    to: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address")),
    subject: z.string().trim().min(1, "Enter a subject").max(300),
    message: z.string().trim().min(1, "Write a message").max(5000),
  }),
  z.object({
    channel: z.literal("WHATSAPP"),
    orderId: z.uuid(),
    kind: documentKind,
    to: z.string().trim().min(7, "Enter a WhatsApp number").max(20),
  }),
]);

export type SendDocumentInput = z.input<typeof SendDocumentSchema>;
