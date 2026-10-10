import type Decimal from "decimal.js";

/** Anything that can be turned into a Decimal. Prefer strings from the DB (numeric columns). */
export type DecimalInput = Decimal.Value;

export type RoundingMode = "HALF_UP" | "HALF_EVEN";

export type SupplyType = "INTRA_STATE" | "INTER_STATE";

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

/**
 * A price rule applies when every condition it sets matches. Unset conditions
 * match anything. Among matching rules the highest `priority` wins; ties go to
 * the lowest price, then to the lowest `id`, so resolution is deterministic.
 */
export interface PriceRule {
  id: string;
  name: string;
  priority: number;
  price: DecimalInput;
  productId?: string;
  variantId?: string;
  categoryId?: string;
  customerId?: string;
  customerGroupId?: string;
  /** Inclusive. */
  minQuantity?: DecimalInput;
  /** Inclusive. */
  maxQuantity?: DecimalInput;
  /** Inclusive. */
  validFrom?: Date;
  /** Exclusive. */
  validUntil?: Date;
}

export interface PricingContext {
  customerId?: string;
  customerGroupId?: string;
  date: Date;
}

export type PriceSource =
  { type: "BASE" } | { type: "RULE"; ruleId: string; ruleName: string } | { type: "MANUAL" };

// ---------------------------------------------------------------------------
// Discounts & charges
// ---------------------------------------------------------------------------

export type LineDiscount =
  /** Percent of the line amount, 0–100. */
  | { type: "PERCENTAGE"; value: DecimalInput }
  /** Flat amount off the whole line. */
  | { type: "FIXED"; value: DecimalInput }
  /** Amount off each unit (value × quantity). */
  | { type: "PER_UNIT"; value: DecimalInput };

/**
 * Order-level discounts are computed against the goods value after line
 * discounts (they do not compound) and are spread across lines in proportion
 * to each line's value, so GST is charged on the discounted amount.
 */
export type OrderDiscount = {
  label?: string;
} & ({ type: "PERCENTAGE"; value: DecimalInput } | { type: "FIXED"; value: DecimalInput });

export interface ChargeInput {
  label: string;
  /** PERCENTAGE is a percent of the order subtotal (before discounts). */
  type: "FIXED" | "PERCENTAGE";
  value: DecimalInput;
  /**
   * GST rate applied to the charge (charge amounts are always tax-exclusive).
   * Omit or null for a non-taxable charge, which is added after tax.
   */
  taxRate?: DecimalInput | null;
}

// ---------------------------------------------------------------------------
// Order input
// ---------------------------------------------------------------------------

export interface LineInput {
  productId: string;
  variantId?: string;
  categoryId?: string;
  quantity: DecimalInput;
  /** Catalogue price before any price rules. */
  basePrice: DecimalInput;
  /** Manually entered price. Callers must check the user is allowed to override. */
  unitPriceOverride?: DecimalInput;
  /** GST rate in percent, e.g. 18. */
  taxRate: DecimalInput;
  discount?: LineDiscount;
}

export interface TaxSettings {
  gstEnabled: boolean;
  /** Two-digit GST state code of the seller, e.g. "03" for Punjab. */
  sellerStateCode: string;
  /** Two-digit GST state code of the place of supply (customer's billing state by default). */
  placeOfSupplyStateCode: string;
  /** Overrides the state-based decision, e.g. for SEZ supplies. */
  supplyTypeOverride?: SupplyType;
  /** When true, unit prices already include GST. */
  pricesIncludeTax: boolean;
}

export interface RoundingSettings {
  mode: RoundingMode;
  /**
   * PER_LINE: tax is computed and rounded on each line.
   * PER_INVOICE: tax is computed once per GST rate on the combined taxable
   * value, then spread back across lines.
   */
  taxRounding: "PER_LINE" | "PER_INVOICE";
  /** Round the grand total to the nearest rupee and record the round-off. */
  roundGrandTotal: boolean;
}

export interface OrderCalculationInput {
  lines: LineInput[];
  orderDiscounts?: OrderDiscount[];
  charges?: ChargeInput[];
  priceRules?: PriceRule[];
  customer?: { id?: string; groupId?: string };
  /** Pricing date, used for rule validity. Defaults to now. */
  date?: Date;
  tax: TaxSettings;
  rounding?: Partial<RoundingSettings>;
}

// ---------------------------------------------------------------------------
// Results — all money values are 2dp strings, ready for numeric(…, 2) columns.
// ---------------------------------------------------------------------------

export interface TaxBreakdown {
  cgst: string;
  sgst: string;
  igst: string;
  taxAmount: string;
}

export interface LineCalculation extends TaxBreakdown {
  productId: string;
  variantId?: string;
  quantity: string;
  /** Unit price as resolved, at full precision. */
  unitPrice: string;
  priceSource: PriceSource;
  /** quantity × unitPrice. Includes GST when prices are tax-inclusive. */
  grossAmount: string;
  lineDiscount: string;
  orderDiscountShare: string;
  discountTotal: string;
  taxRate: string;
  taxableAmount: string;
  lineTotal: string;
}

export interface ChargeCalculation extends TaxBreakdown {
  label: string;
  amount: string;
  /** null when the charge is not taxable. */
  taxRate: string | null;
  total: string;
}

export interface TaxSummaryRow {
  taxRate: string;
  taxableAmount: string;
  cgst: string;
  sgst: string;
  igst: string;
  taxAmount: string;
}

export interface OrderCalculation {
  supplyType: SupplyType;
  pricesIncludeTax: boolean;
  subtotal: string;
  lineDiscountTotal: string;
  orderDiscountTotal: string;
  discountTotal: string;
  chargeTotal: string;
  taxableAmount: string;
  cgstTotal: string;
  sgstTotal: string;
  igstTotal: string;
  taxTotal: string;
  roundingAdjustment: string;
  grandTotal: string;
  lines: LineCalculation[];
  charges: ChargeCalculation[];
  /** One row per GST rate — used for the tax summary on invoices. */
  taxSummary: TaxSummaryRow[];
}
