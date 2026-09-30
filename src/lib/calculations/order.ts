import { calculateCharges } from "./charges";
import { calculateLineDiscount, calculateOrderDiscount } from "./discount";
import { CalculationError } from "./errors";
import { allocate, dec, round0, round2, sum, toAmount, ZERO, type Dec } from "./money";
import { resolvePrice } from "./price";
import {
  calculateTax,
  determineSupplyType,
  extractTaxableAmount,
  NO_TAX,
  parseTaxRate,
  totalTax,
  type TaxAmounts,
} from "./tax";
import type {
  OrderCalculation,
  OrderCalculationInput,
  RoundingSettings,
  SupplyType,
  TaxBreakdown,
  TaxSummaryRow,
} from "./types";

export const DEFAULT_ROUNDING: RoundingSettings = {
  mode: "HALF_UP",
  taxRounding: "PER_LINE",
  roundGrandTotal: false,
};

interface Taxable {
  taxableAmount: Dec;
  taxRate: Dec;
}

function taxBreakdown(tax: TaxAmounts): TaxBreakdown {
  return {
    cgst: toAmount(tax.cgst),
    sgst: toAmount(tax.sgst),
    igst: toAmount(tax.igst),
    taxAmount: toAmount(totalTax(tax)),
  };
}

function groupByRate(items: readonly Taxable[]): Map<string, number[]> {
  const groups = new Map<string, number[]>();
  items.forEach((item, index) => {
    const key = item.taxRate.toString();
    groups.set(key, [...(groups.get(key) ?? []), index]);
  });
  return groups;
}

/**
 * Tax for every taxable item. PER_LINE rounds each item; PER_INVOICE taxes
 * each rate group once and spreads it across the group by taxable value, so
 * item taxes still sum exactly to the group total.
 */
function calculateItemTaxes(
  items: readonly Taxable[],
  supplyType: SupplyType,
  rounding: RoundingSettings,
): TaxAmounts[] {
  if (rounding.taxRounding === "PER_LINE") {
    return items.map((item) =>
      calculateTax(item.taxableAmount, item.taxRate, supplyType, rounding.mode),
    );
  }

  const result: TaxAmounts[] = items.map(() => NO_TAX);
  for (const indexes of groupByRate(items).values()) {
    const weights = indexes.map((i) => items[i].taxableAmount);
    const groupTax = calculateTax(
      sum(weights),
      items[indexes[0]].taxRate,
      supplyType,
      rounding.mode,
    );
    const cgst = allocate(groupTax.cgst, weights);
    const sgst = allocate(groupTax.sgst, weights);
    const igst = allocate(groupTax.igst, weights);
    indexes.forEach((itemIndex, n) => {
      result[itemIndex] = { cgst: cgst[n], sgst: sgst[n], igst: igst[n] };
    });
  }
  return result;
}

function buildTaxSummary(items: readonly Taxable[], taxes: readonly TaxAmounts[]): TaxSummaryRow[] {
  return [...groupByRate(items).entries()]
    .map(([rate, indexes]) => {
      const tax: TaxAmounts = {
        cgst: sum(indexes.map((i) => taxes[i].cgst)),
        sgst: sum(indexes.map((i) => taxes[i].sgst)),
        igst: sum(indexes.map((i) => taxes[i].igst)),
      };
      return {
        rate: dec(rate),
        row: {
          taxRate: rate,
          taxableAmount: toAmount(sum(indexes.map((i) => items[i].taxableAmount))),
          ...taxBreakdown(tax),
        },
      };
    })
    .sort((a, b) => a.rate.comparedTo(b.rate))
    .map(({ row }) => row);
}

/**
 * Computes a complete, deterministic order breakdown:
 * price resolution → line discounts → order discounts → charges → GST → round-off.
 *
 * This is the single source of truth for order and invoice totals. The UI may
 * call it for previews, but the server must recompute before persisting.
 */
export function calculateOrderTotals(input: OrderCalculationInput): OrderCalculation {
  if (input.lines.length === 0) {
    throw new CalculationError("An order must have at least one item");
  }

  const rounding: RoundingSettings = { ...DEFAULT_ROUNDING, ...input.rounding };
  const { mode } = rounding;
  const gstEnabled = input.tax.gstEnabled;
  const pricesIncludeTax = gstEnabled && input.tax.pricesIncludeTax;
  const supplyType = determineSupplyType(
    input.tax.sellerStateCode,
    input.tax.placeOfSupplyStateCode,
    input.tax.supplyTypeOverride,
  );
  const pricingContext = {
    customerId: input.customer?.id,
    customerGroupId: input.customer?.groupId,
    date: input.date ?? new Date(),
  };

  // 1. Price resolution and line discounts.
  const priced = input.lines.map((line) => {
    const quantity = dec(line.quantity);
    if (quantity.lte(0)) {
      throw new CalculationError("Quantity must be greater than zero", {
        productId: line.productId,
      });
    }

    const resolved =
      line.unitPriceOverride !== undefined
        ? { unitPrice: dec(line.unitPriceOverride), source: { type: "MANUAL" } as const }
        : resolvePrice(line, input.priceRules ?? [], pricingContext);
    if (resolved.unitPrice.isNegative()) {
      throw new CalculationError("Price cannot be negative", { productId: line.productId });
    }

    const grossAmount = round2(quantity.times(resolved.unitPrice), mode);
    const lineDiscount = calculateLineDiscount(line.discount, grossAmount, quantity, mode);

    return {
      line,
      quantity,
      ...resolved,
      grossAmount,
      lineDiscount,
      afterLineDiscount: grossAmount.minus(lineDiscount),
      taxRate: gstEnabled ? parseTaxRate(line.taxRate) : ZERO,
    };
  });

  const subtotal = sum(priced.map((p) => p.grossAmount));
  const lineDiscountTotal = sum(priced.map((p) => p.lineDiscount));

  // 2. Order-level discounts, spread across lines so each line's GST reflects them.
  const afterLineDiscounts = priced.map((p) => p.afterLineDiscount);
  const orderDiscountTotal = calculateOrderDiscount(
    input.orderDiscounts ?? [],
    sum(afterLineDiscounts),
    mode,
  );
  const orderDiscountShares = allocate(orderDiscountTotal, afterLineDiscounts);

  const lineTaxables: Taxable[] = priced.map((p, i) => {
    const net = p.afterLineDiscount.minus(orderDiscountShares[i]);
    return {
      taxableAmount: pricesIncludeTax ? extractTaxableAmount(net, p.taxRate, mode) : net,
      taxRate: p.taxRate,
    };
  });

  // 3. Charges. Taxable charges join the GST calculation alongside the lines.
  const charges = calculateCharges(input.charges ?? [], subtotal, mode).map((charge) => ({
    ...charge,
    taxRate: charge.taxRate && !gstEnabled ? ZERO : charge.taxRate,
  }));
  const taxableCharges = charges.flatMap((charge, index) =>
    charge.taxRate ? [{ index, taxableAmount: charge.amount, taxRate: charge.taxRate }] : [],
  );

  // 4. GST.
  const taxables = [...lineTaxables, ...taxableCharges];
  const taxes = gstEnabled
    ? calculateItemTaxes(taxables, supplyType, rounding)
    : taxables.map(() => NO_TAX);
  const lineTaxes = taxes.slice(0, lineTaxables.length);
  const chargeTaxes = new Map(
    taxableCharges.map((c, n) => [c.index, taxes[lineTaxables.length + n]]),
  );

  const lines = priced.map((p, i) => {
    const tax = lineTaxes[i];
    const { taxableAmount } = lineTaxables[i];
    return {
      productId: p.line.productId,
      variantId: p.line.variantId,
      quantity: p.quantity.toString(),
      unitPrice: p.unitPrice.toString(),
      priceSource: p.source,
      grossAmount: toAmount(p.grossAmount),
      lineDiscount: toAmount(p.lineDiscount),
      orderDiscountShare: toAmount(orderDiscountShares[i]),
      discountTotal: toAmount(p.lineDiscount.plus(orderDiscountShares[i])),
      taxRate: p.taxRate.toString(),
      taxableAmount: toAmount(taxableAmount),
      ...taxBreakdown(tax),
      lineTotal: toAmount(taxableAmount.plus(totalTax(tax))),
    };
  });

  const chargeResults = charges.map((charge, index) => {
    const tax = chargeTaxes.get(index) ?? NO_TAX;
    return {
      label: charge.label,
      amount: toAmount(charge.amount),
      taxRate: charge.taxRate ? charge.taxRate.toString() : null,
      ...taxBreakdown(tax),
      total: toAmount(charge.amount.plus(totalTax(tax))),
    };
  });

  // 5. Totals and round-off.
  const allTaxes = taxes.reduce<TaxAmounts>(
    (acc, t) => ({
      cgst: acc.cgst.plus(t.cgst),
      sgst: acc.sgst.plus(t.sgst),
      igst: acc.igst.plus(t.igst),
    }),
    NO_TAX,
  );
  // Every taxable item's total is its taxable value plus its tax; non-taxable
  // charges are added on top.
  const nonTaxableCharges = sum(charges.filter((c) => !c.taxRate).map((c) => c.amount));
  const exactTotal = sum(taxables.map((t) => t.taxableAmount))
    .plus(totalTax(allTaxes))
    .plus(nonTaxableCharges);
  const grandTotal = rounding.roundGrandTotal ? round0(exactTotal, mode) : exactTotal;

  return {
    supplyType,
    pricesIncludeTax,
    subtotal: toAmount(subtotal),
    lineDiscountTotal: toAmount(lineDiscountTotal),
    orderDiscountTotal: toAmount(orderDiscountTotal),
    discountTotal: toAmount(lineDiscountTotal.plus(orderDiscountTotal)),
    chargeTotal: toAmount(sum(charges.map((c) => c.amount))),
    taxableAmount: toAmount(sum(taxables.map((t) => t.taxableAmount))),
    cgstTotal: toAmount(allTaxes.cgst),
    sgstTotal: toAmount(allTaxes.sgst),
    igstTotal: toAmount(allTaxes.igst),
    taxTotal: toAmount(totalTax(allTaxes)),
    roundingAdjustment: toAmount(grandTotal.minus(exactTotal)),
    grandTotal: toAmount(grandTotal),
    lines,
    charges: chargeResults,
    taxSummary: gstEnabled ? buildTaxSummary(taxables, taxes) : [],
  };
}
