import {
  calculateOrderTotals,
  CalculationError,
  type ChargeInput,
  type LineInput,
  type OrderCalculation,
  type RoundingSettings,
} from "@/lib/calculations";

import type { Order, OrderCharge, OrderItem } from "./types";

export interface DraftForCalculation {
  items: OrderItem[];
  orderDiscount: Order["orderDiscount"];
  charges: OrderCharge[];
  pricesIncludeTax: boolean;
}

export interface CalculationContext {
  sellerStateCode: string;
  placeOfSupplyStateCode: string;
  gstEnabled: boolean;
  rounding: RoundingSettings;
}

export interface DraftCalculation {
  /** Null until at least one valid item exists. */
  totals: OrderCalculation | null;
  /** Per-item problems, keyed by item id. */
  itemErrors: Record<string, string>;
  /** Order-level problem, e.g. a discount bigger than the order. */
  error: string | null;
}

const NUMBER = /^\d+(\.\d+)?$/;
const clean = (value: string) => value.trim().replaceAll(",", "");

/** A row the user hasn't started filling in. */
export function isBlankItem(item: OrderItem): boolean {
  return !item.name.trim() && !item.rate.trim();
}

/** Problem with one item row, or null. */
export function validateItem(item: OrderItem): string | null {
  if (!item.name.trim()) return "Enter the item name";
  const quantity = clean(item.quantity);
  if (!NUMBER.test(quantity) || Number(quantity) <= 0) return "Quantity must be more than 0";
  if (!NUMBER.test(clean(item.rate))) return "Enter a rate";
  const discount = clean(item.discountPercent);
  if (discount && (!NUMBER.test(discount) || Number(discount) > 100)) {
    return "Discount must be 0–100%";
  }
  const tax = clean(item.taxRate);
  if (!NUMBER.test(tax) || Number(tax) > 100) return "GST must be 0–100%";
  return null;
}

/**
 * Runs the calculation engine on an order being edited. Blank rows are
 * ignored; invalid rows are reported and left out of the totals.
 */
export function calculateDraft(
  draft: DraftForCalculation,
  context: CalculationContext,
): DraftCalculation {
  const itemErrors: Record<string, string> = {};
  const lines: LineInput[] = [];

  for (const item of draft.items) {
    if (isBlankItem(item)) continue;
    const problem = validateItem(item);
    if (problem) {
      itemErrors[item.id] = problem;
      continue;
    }
    const discount = clean(item.discountPercent);
    lines.push({
      // The engine calls it productId; for typed-in items it's the row id.
      productId: item.id,
      quantity: clean(item.quantity),
      basePrice: clean(item.rate),
      taxRate: clean(item.taxRate),
      discount:
        discount && Number(discount) > 0 ? { type: "PERCENTAGE", value: discount } : undefined,
    });
  }

  if (lines.length === 0) return { totals: null, itemErrors, error: null };

  const charges: ChargeInput[] = draft.charges
    .filter((c) => NUMBER.test(clean(c.amount)) && Number(clean(c.amount)) > 0)
    .map((c) => ({
      label: c.label.trim() || "Charge",
      type: "FIXED",
      value: clean(c.amount),
      taxRate: NUMBER.test(clean(c.taxRate)) ? clean(c.taxRate) : null,
    }));

  const discountValue = clean(draft.orderDiscount.value);
  const orderDiscounts =
    NUMBER.test(discountValue) && Number(discountValue) > 0
      ? [{ type: draft.orderDiscount.type, value: discountValue }]
      : [];

  try {
    const totals = calculateOrderTotals({
      lines,
      orderDiscounts,
      charges,
      tax: {
        gstEnabled: context.gstEnabled,
        sellerStateCode: context.sellerStateCode,
        placeOfSupplyStateCode: context.placeOfSupplyStateCode,
        pricesIncludeTax: draft.pricesIncludeTax,
      },
      rounding: context.rounding,
    });
    return { totals, itemErrors, error: null };
  } catch (error) {
    if (error instanceof CalculationError)
      return { totals: null, itemErrors, error: error.message };
    throw error;
  }
}
