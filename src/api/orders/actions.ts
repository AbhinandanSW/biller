"use server";

import { revalidatePath } from "next/cache";

import { authorize } from "@/api/auth/authorize";
import { databaseErrorMessage } from "@/api/errors";
import { createAdminClient } from "@/api/supabase/admin";
import { createClient } from "@/api/supabase/server";
import { UNIQUE_VIOLATION } from "@/constants/errors";
import { FORBIDDEN_MESSAGE } from "@/constants/messages";
import { DEFAULT_UNIT } from "@/constants/orders";
import type { Permission } from "@/types/auth";
import type { Json } from "@/types/database";
import type { DatabaseError } from "@/types/error";
import type { ActionResult } from "@/types/form";
import type { EnsureInvoiceResult, OrderInput, SaveOrderResult } from "@/types/order";
import { calculateDraft, isBlankItem, positiveNumber } from "@/utils/orders/draft";
import { toOrganizationSettings } from "@/utils/organization";
import { OrderInputSchema } from "@/utils/validation/order";

function revalidateOrders(orderId?: string, customerId?: string) {
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  if (orderId) revalidatePath(`/orders/${orderId}`);
  if (customerId) revalidatePath(`/customers/${customerId}`);
}

/**
 * Creates an order or updates a draft. Totals are recalculated here with the
 * calculation engine — nothing the browser computed is trusted — then stored
 * with items and charges in one transaction by public.save_order.
 */
export async function saveOrder(
  input: OrderInput,
  options: { id?: string; confirm?: boolean } = {},
): Promise<SaveOrderResult> {
  const context = await authorize(options.id ? "orders.update" : "orders.create");
  if (!context) return { error: FORBIDDEN_MESSAGE };

  const parsed = OrderInputSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid order" };
  const order = parsed.data;

  const supabase = await createClient();
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, billing_state_code")
    .eq("organization_id", context.organization.id)
    .eq("id", order.customerId)
    .maybeSingle();
  if (customerError) return { error: databaseErrorMessage(customerError) };
  if (!customer) return { error: "Choose a customer" };

  const org = toOrganizationSettings(context.organization);
  const items = order.items.filter((item) => !isBlankItem(item));
  const charges = order.charges.filter((c) => positiveNumber(c.amount));
  const result = calculateDraft(
    { items, orderDiscount: order.orderDiscount, charges, pricesIncludeTax: org.pricesIncludeTax },
    {
      sellerStateCode: org.stateCode ?? customer.billing_state_code,
      placeOfSupplyStateCode: customer.billing_state_code,
      gstEnabled: org.gstEnabled,
      rounding: org.rounding,
    },
  );
  const itemError = Object.values(result.itemErrors)[0];
  if (itemError) return { error: itemError };
  if (result.error) return { error: result.error };
  if (!result.totals) return { error: "Add at least one item" };

  const t = result.totals;
  const lines = new Map(t.lines.map((l) => [l.productId, l]));

  const { data, error } = await createAdminClient().rpc("save_order", {
    p_actor_id: context.user.id,
    p_organization_id: context.organization.id,
    // null creates a new order (the generated types don't model SQL nulls for arguments).
    p_order_id: (options.id ?? null) as unknown as string,
    p_confirm: options.confirm ?? false,
    p_order: {
      order_date: order.date,
      customer_id: customer.id,
      supply_type: t.supplyType,
      prices_include_tax: t.pricesIncludeTax,
      order_discount_type: order.orderDiscount.type,
      order_discount_value: positiveNumber(order.orderDiscount.value),
      notes: order.notes.trim() || null,
      subtotal: t.subtotal,
      line_discount_total: t.lineDiscountTotal,
      order_discount_total: t.orderDiscountTotal,
      discount_total: t.discountTotal,
      charge_total: t.chargeTotal,
      taxable_amount: t.taxableAmount,
      cgst_total: t.cgstTotal,
      sgst_total: t.sgstTotal,
      igst_total: t.igstTotal,
      tax_total: t.taxTotal,
      rounding_adjustment: t.roundingAdjustment,
      grand_total: t.grandTotal,
      tax_summary: t.taxSummary as unknown as Json,
    },
    p_items: items.map((item) => {
      const line = lines.get(item.id)!;
      return {
        name: item.name.trim(),
        hsn_code: item.hsnCode.trim() || null,
        quantity: line.quantity,
        unit: item.unit.trim() || DEFAULT_UNIT,
        rate: line.unitPrice,
        discount_percent: positiveNumber(item.discountPercent),
        tax_rate: line.taxRate,
        gross_amount: line.grossAmount,
        line_discount: line.lineDiscount,
        order_discount_share: line.orderDiscountShare,
        taxable_amount: line.taxableAmount,
        cgst: line.cgst,
        sgst: line.sgst,
        igst: line.igst,
        tax_amount: line.taxAmount,
        line_total: line.lineTotal,
      };
    }),
    p_charges: t.charges.map((c) => ({
      label: c.label,
      amount: c.amount,
      tax_rate: c.taxRate,
      cgst: c.cgst,
      sgst: c.sgst,
      igst: c.igst,
      tax_amount: c.taxAmount,
      total: c.total,
    })),
  });
  if (error) return { error: databaseErrorMessage(error) };

  revalidateOrders(data.id, customer.id);
  return { id: data.id, number: data.order_number };
}

/** Runs a status-change function as the signed-in user (RLS and permission checks apply). */
async function changeStatus(
  permission: Permission,
  orderId: string,
  run: (
    supabase: Awaited<ReturnType<typeof createClient>>,
  ) => PromiseLike<{ error: DatabaseError | null }>,
): Promise<ActionResult> {
  const context = await authorize(permission);
  if (!context) return { error: FORBIDDEN_MESSAGE };
  const supabase = await createClient();
  const { error } = await run(supabase);
  if (error) return { error: databaseErrorMessage(error) };
  revalidateOrders(orderId);
  revalidatePath("/customers", "layout");
  return {};
}

export async function confirmOrder(orderId: string) {
  return changeStatus("orders.update", orderId, (s) =>
    s.rpc("confirm_order", { p_order_id: orderId }),
  );
}

export async function cancelOrder(orderId: string) {
  return changeStatus("orders.cancel", orderId, (s) =>
    s.rpc("cancel_order", { p_order_id: orderId }),
  );
}

export async function setInvoicePaid(orderId: string, paid: boolean) {
  return changeStatus("invoices.create", orderId, (s) =>
    s.rpc("set_invoice_paid", { p_order_id: orderId, p_paid: paid }),
  );
}

/**
 * Makes sure a confirmed order has an invoice, issuing the next invoice
 * number if it doesn't. Called before downloading or sharing an invoice, so
 * there's no separate "generate" step.
 */
export async function ensureInvoice(orderId: string): Promise<EnsureInvoiceResult> {
  const context = await authorize("invoices.view");
  if (!context) return { error: FORBIDDEN_MESSAGE };

  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from("invoices")
    .select("invoice_number, due_date")
    .eq("organization_id", context.organization.id)
    .eq("order_id", orderId)
    .maybeSingle();
  if (readError) return { error: databaseErrorMessage(readError) };
  if (existing) {
    return { number: existing.invoice_number, dueDate: existing.due_date, issued: false };
  }

  const { data, error } = await supabase.rpc("generate_invoice", { p_order_id: orderId });
  if (error) {
    // Someone else issued it a moment ago — use theirs.
    if (error.code === UNIQUE_VIOLATION) return ensureInvoice(orderId);
    return { error: databaseErrorMessage(error) };
  }
  revalidateOrders(orderId);
  return { number: data.invoice_number, dueDate: data.due_date, issued: true };
}
