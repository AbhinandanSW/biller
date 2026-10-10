import type { DecimalInput, RoundingMode, SupplyType } from "@/types/calculation";

import { CalculationError } from "./errors";
import { dec, HUNDRED, round2, ZERO, type Dec } from "./money";

export interface TaxAmounts {
  cgst: Dec;
  sgst: Dec;
  igst: Dec;
}

export const NO_TAX: TaxAmounts = { cgst: ZERO, sgst: ZERO, igst: ZERO };

/**
 * Intra-state when seller and place of supply are in the same state
 * (CGST + SGST), otherwise inter-state (IGST).
 */
export function determineSupplyType(
  sellerStateCode: string,
  placeOfSupplyStateCode: string,
  override?: SupplyType,
): SupplyType {
  if (override) return override;
  return sellerStateCode.trim() === placeOfSupplyStateCode.trim() ? "INTRA_STATE" : "INTER_STATE";
}

export function parseTaxRate(rate: DecimalInput): Dec {
  const value = dec(rate);
  if (value.isNegative() || value.gt(HUNDRED)) {
    throw new CalculationError("Tax rate must be between 0 and 100", { taxRate: value.toString() });
  }
  return value;
}

/**
 * GST on a tax-exclusive taxable value. For intra-state supplies CGST and SGST
 * are each half the rate and rounded separately, so they are always equal.
 */
export function calculateTax(
  taxableAmount: Dec,
  taxRate: Dec,
  supplyType: SupplyType,
  mode: RoundingMode,
): TaxAmounts {
  if (supplyType === "INTER_STATE") {
    return {
      cgst: ZERO,
      sgst: ZERO,
      igst: round2(taxableAmount.times(taxRate).div(HUNDRED), mode),
    };
  }
  const half = round2(taxableAmount.times(taxRate).div(200), mode);
  return { cgst: half, sgst: half, igst: ZERO };
}

/** Taxable value contained in a tax-inclusive amount. */
export function extractTaxableAmount(inclusiveAmount: Dec, taxRate: Dec, mode: RoundingMode): Dec {
  return round2(inclusiveAmount.times(HUNDRED).div(HUNDRED.plus(taxRate)), mode);
}

export function totalTax(tax: TaxAmounts): Dec {
  return tax.cgst.plus(tax.sgst).plus(tax.igst);
}
