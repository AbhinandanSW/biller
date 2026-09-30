import { CalculationError } from "./errors";
import { dec, HUNDRED, round2, type Dec, type RoundingMode } from "./money";
import { parseTaxRate } from "./tax";
import type { ChargeInput } from "./types";

export interface ResolvedCharge {
  label: string;
  amount: Dec;
  taxRate: Dec | null;
}

/** Resolves each charge to a rounded, tax-exclusive amount. */
export function calculateCharges(
  charges: readonly ChargeInput[],
  subtotal: Dec,
  mode: RoundingMode,
): ResolvedCharge[] {
  return charges.map((charge) => {
    const value = dec(charge.value);
    if (value.isNegative()) {
      throw new CalculationError("Charge cannot be negative", { label: charge.label });
    }
    const amount =
      charge.type === "PERCENTAGE"
        ? round2(subtotal.times(value).div(HUNDRED), mode)
        : round2(value, mode);

    return {
      label: charge.label,
      amount,
      taxRate: charge.taxRate == null ? null : parseTaxRate(charge.taxRate),
    };
  });
}
