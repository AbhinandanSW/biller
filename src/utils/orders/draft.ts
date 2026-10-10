import type { ChargeInput, LineInput } from "@/types/calculation";
import type {
  CalculationContext,
  DraftCalculation,
  DraftForCalculation,
  OrderItem,
} from "@/types/order";
import { calculateOrderTotals, CalculationError } from "@/utils/calculations";

const NUMBER = /^\d+(\.\d+)?$/;

/** "1,250.50 " → "1250.50": what users type, ready for the engine. */
export function cleanNumber(value: string): string {
  return value.trim().replaceAll(",", "");
}

/** The cleaned value if it is a number greater than zero, otherwise null. */
export function positiveNumber(value: string): string | null {
  const cleaned = cleanNumber(value);
  return NUMBER.test(cleaned) && Number(cleaned) > 0 ? cleaned : null;
}

/** A row the user hasn't started filling in. */
export function isBlankItem(item: OrderItem): boolean {
  return !item.name.trim() && !item.rate.trim();
}

/** Problem with one item row, or null. */
export function validateItem(item: OrderItem): string | null {
  if (!item.name.trim()) return "Enter the item name";
  const quantity = cleanNumber(item.quantity);
  if (!NUMBER.test(quantity) || Number(quantity) <= 0) return "Quantity must be more than 0";
  if (!NUMBER.test(cleanNumber(item.rate))) return "Enter a rate";
  const discount = cleanNumber(item.discountPercent);
  if (discount && (!NUMBER.test(discount) || Number(discount) > 100)) {
    return "Discount must be 0–100%";
  }
  const tax = cleanNumber(item.taxRate);
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
    const discount = positiveNumber(item.discountPercent);
    lines.push({
      // The engine calls it productId; for typed-in items it's the row id.
      productId: item.id,
      quantity: cleanNumber(item.quantity),
      basePrice: cleanNumber(item.rate),
      taxRate: cleanNumber(item.taxRate),
      discount: discount ? { type: "PERCENTAGE", value: discount } : undefined,
    });
  }

  if (lines.length === 0) return { totals: null, itemErrors, error: null };

  const charges: ChargeInput[] = draft.charges
    .filter((c) => positiveNumber(c.amount))
    .map((c) => ({
      label: c.label.trim() || "Charge",
      type: "FIXED",
      value: positiveNumber(c.amount)!,
      taxRate: NUMBER.test(cleanNumber(c.taxRate)) ? cleanNumber(c.taxRate) : null,
    }));

  const discountValue = positiveNumber(draft.orderDiscount.value);
  const orderDiscounts = discountValue
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
