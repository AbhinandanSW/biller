import { CalculationError } from "./errors";
import { dec, HUNDRED, round2, sum, ZERO, type Dec, type RoundingMode } from "./money";
import type { LineDiscount, OrderDiscount } from "./types";

function percentage(value: Dec): Dec {
  if (value.isNegative() || value.gt(HUNDRED)) {
    throw new CalculationError("Discount percentage must be between 0 and 100");
  }
  return value;
}

function nonNegative(value: Dec): Dec {
  if (value.isNegative()) throw new CalculationError("Discount cannot be negative");
  return value;
}

/** Discount amount for one line, rounded to paise. Never exceeds the line amount. */
export function calculateLineDiscount(
  discount: LineDiscount | undefined,
  lineAmount: Dec,
  quantity: Dec,
  mode: RoundingMode,
): Dec {
  if (!discount) return ZERO;

  const value = dec(discount.value);
  let amount: Dec;
  switch (discount.type) {
    case "PERCENTAGE":
      amount = round2(lineAmount.times(percentage(value)).div(HUNDRED), mode);
      break;
    case "FIXED":
      amount = round2(nonNegative(value), mode);
      break;
    case "PER_UNIT":
      amount = round2(nonNegative(value).times(quantity), mode);
      break;
  }

  if (amount.gt(lineAmount)) {
    throw new CalculationError("Discount cannot exceed the line amount", {
      discount: amount.toFixed(2),
      lineAmount: lineAmount.toFixed(2),
    });
  }
  return amount;
}

/**
 * Total of all order-level discounts against `base` (goods value after line
 * discounts). Discounts are independent — percentages don't compound.
 */
export function calculateOrderDiscount(
  discounts: readonly OrderDiscount[],
  base: Dec,
  mode: RoundingMode,
): Dec {
  const total = sum(
    discounts.map((discount) => {
      const value = dec(discount.value);
      return discount.type === "PERCENTAGE"
        ? round2(base.times(percentage(value)).div(HUNDRED), mode)
        : round2(nonNegative(value), mode);
    }),
  );

  if (total.gt(base)) {
    throw new CalculationError("Order discount cannot exceed the order amount", {
      discount: total.toFixed(2),
      orderAmount: base.toFixed(2),
    });
  }
  return total;
}
