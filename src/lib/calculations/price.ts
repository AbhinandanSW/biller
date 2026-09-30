import { CalculationError } from "./errors";
import { dec, type Dec, type DecimalInput } from "./money";
import type { PriceRule, PriceSource, PricingContext } from "./types";

export interface PriceTarget {
  productId: string;
  variantId?: string;
  categoryId?: string;
  quantity: DecimalInput;
  basePrice: DecimalInput;
}

export interface ResolvedPrice {
  unitPrice: Dec;
  source: PriceSource;
}

function matches(rule: PriceRule, target: PriceTarget, context: PricingContext): boolean {
  const quantity = dec(target.quantity);

  if (rule.productId !== undefined && rule.productId !== target.productId) return false;
  if (rule.variantId !== undefined && rule.variantId !== target.variantId) return false;
  if (rule.categoryId !== undefined && rule.categoryId !== target.categoryId) return false;
  if (rule.customerId !== undefined && rule.customerId !== context.customerId) return false;
  if (rule.customerGroupId !== undefined && rule.customerGroupId !== context.customerGroupId)
    return false;
  if (rule.minQuantity !== undefined && quantity.lt(dec(rule.minQuantity))) return false;
  if (rule.maxQuantity !== undefined && quantity.gt(dec(rule.maxQuantity))) return false;
  if (rule.validFrom !== undefined && context.date < rule.validFrom) return false;
  if (rule.validUntil !== undefined && context.date >= rule.validUntil) return false;

  return true;
}

/**
 * Picks the applicable unit price for a line and records why it was chosen.
 * See `PriceRule` for the precedence order.
 */
export function resolvePrice(
  target: PriceTarget,
  rules: readonly PriceRule[],
  context: PricingContext,
): ResolvedPrice {
  const basePrice = dec(target.basePrice);
  if (basePrice.isNegative()) {
    throw new CalculationError("Price cannot be negative", { productId: target.productId });
  }

  const best = rules
    .filter((rule) => matches(rule, target, context))
    .map((rule) => ({ rule, price: dec(rule.price) }))
    .sort(
      (a, b) =>
        b.rule.priority - a.rule.priority ||
        a.price.comparedTo(b.price) ||
        a.rule.id.localeCompare(b.rule.id),
    )[0];

  if (!best) return { unitPrice: basePrice, source: { type: "BASE" } };

  if (best.price.isNegative()) {
    throw new CalculationError("Price rule resolves to a negative price", {
      ruleId: best.rule.id,
    });
  }

  return {
    unitPrice: best.price,
    source: { type: "RULE", ruleId: best.rule.id, ruleName: best.rule.name },
  };
}
