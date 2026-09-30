import { describe, expect, it } from "vitest";

import { CalculationError } from "./errors";
import { dec, sum } from "./money";
import { calculateOrderTotals } from "./order";
import type { LineInput, OrderCalculationInput, TaxSettings } from "./types";

const PUNJAB = "03";
const HARYANA = "06";

const intraState: TaxSettings = {
  gstEnabled: true,
  sellerStateCode: PUNJAB,
  placeOfSupplyStateCode: PUNJAB,
  pricesIncludeTax: false,
};
const interState: TaxSettings = { ...intraState, placeOfSupplyStateCode: HARYANA };

function line(overrides: Partial<LineInput> = {}): LineInput {
  return { productId: "p1", quantity: 1, basePrice: 1000, taxRate: 18, ...overrides };
}

function calc(overrides: Partial<OrderCalculationInput> = {}) {
  return calculateOrderTotals({ lines: [line()], tax: intraState, ...overrides });
}

describe("calculateOrderTotals — spec examples", () => {
  it("§26: 2 × ₹1,000 with ₹200 discount, intra-state 18%", () => {
    const result = calc({
      lines: [line({ quantity: 2, discount: { type: "FIXED", value: 200 } })],
    });

    expect(result).toMatchObject({
      supplyType: "INTRA_STATE",
      subtotal: "2000.00",
      discountTotal: "200.00",
      taxableAmount: "1800.00",
      cgstTotal: "162.00",
      sgstTotal: "162.00",
      igstTotal: "0.00",
      taxTotal: "324.00",
      grandTotal: "2124.00",
    });
  });

  it("§31: inter-state supply is charged IGST", () => {
    const result = calc({ lines: [line({ quantity: 10 })], tax: interState });

    expect(result).toMatchObject({
      supplyType: "INTER_STATE",
      taxableAmount: "10000.00",
      cgstTotal: "0.00",
      sgstTotal: "0.00",
      igstTotal: "1800.00",
      grandTotal: "11800.00",
    });
  });

  it("§67: order discount and a taxable charge across two products", () => {
    const result = calc({
      lines: [
        line({ productId: "a", quantity: 5, basePrice: 500 }),
        line({ productId: "b", quantity: 2, basePrice: 800 }),
      ],
      orderDiscounts: [{ type: "FIXED", value: 200 }],
      charges: [{ label: "Shipping", type: "FIXED", value: 100, taxRate: 18 }],
    });

    expect(result).toMatchObject({
      subtotal: "4100.00",
      discountTotal: "200.00",
      chargeTotal: "100.00",
      taxableAmount: "4000.00",
      cgstTotal: "360.00",
      sgstTotal: "360.00",
      // The spec shows ₹4,820, but 4,000 + 360 + 360 = 4,720.
      grandTotal: "4720.00",
    });
    // The order discount is spread across lines by value and sums exactly.
    expect(result.lines.map((l) => l.orderDiscountShare)).toEqual(["121.95", "78.05"]);
  });

  it("§111: 10 × ₹1,000, ₹500 off, Punjab → Punjab", () => {
    const result = calc({
      lines: [line({ quantity: 10 })],
      orderDiscounts: [{ type: "FIXED", value: 500 }],
    });

    expect(result).toMatchObject({
      subtotal: "10000.00",
      discountTotal: "500.00",
      taxableAmount: "9500.00",
      cgstTotal: "855.00",
      sgstTotal: "855.00",
      grandTotal: "11210.00",
    });
  });
});

describe("calculateOrderTotals — tax-inclusive pricing", () => {
  it("§33: ₹1,180 inclusive of 18% contains ₹1,000 taxable", () => {
    const result = calc({
      lines: [line({ basePrice: 1180 })],
      tax: { ...intraState, pricesIncludeTax: true },
    });

    expect(result).toMatchObject({
      pricesIncludeTax: true,
      subtotal: "1180.00",
      taxableAmount: "1000.00",
      taxTotal: "180.00",
      grandTotal: "1180.00",
    });
  });

  it("keeps CGST = SGST even when that moves the total a paisa off the inclusive price", () => {
    const result = calc({
      lines: [line({ basePrice: 100 })],
      tax: { ...intraState, pricesIncludeTax: true },
    });

    expect(result).toMatchObject({
      taxableAmount: "84.75",
      cgstTotal: "7.63",
      sgstTotal: "7.63",
      grandTotal: "100.01",
    });

    const rounded = calc({
      lines: [line({ basePrice: 100 })],
      tax: { ...intraState, pricesIncludeTax: true },
      rounding: { roundGrandTotal: true },
    });
    expect(rounded.grandTotal).toBe("100.00");
    expect(rounded.roundingAdjustment).toBe("-0.01");
  });

  it("applies discounts to the inclusive amount before extracting tax", () => {
    const result = calc({
      lines: [line({ basePrice: 1180, discount: { type: "PERCENTAGE", value: 50 } })],
      tax: { ...intraState, pricesIncludeTax: true },
    });

    expect(result).toMatchObject({
      taxableAmount: "500.00",
      taxTotal: "90.00",
      grandTotal: "590.00",
    });
  });
});

describe("calculateOrderTotals — discounts", () => {
  it("supports percentage, fixed and per-unit line discounts", () => {
    const result = calc({
      lines: [
        line({ productId: "a", quantity: 2, discount: { type: "PERCENTAGE", value: 10 } }),
        line({ productId: "b", quantity: 2, discount: { type: "FIXED", value: 150 } }),
        line({ productId: "c", quantity: 3, discount: { type: "PER_UNIT", value: 50 } }),
      ],
    });

    expect(result.lines.map((l) => l.lineDiscount)).toEqual(["200.00", "150.00", "150.00"]);
    expect(result.lineDiscountTotal).toBe("500.00");
  });

  it("computes order percentages on the amount after line discounts, without compounding", () => {
    const result = calc({
      lines: [line({ quantity: 10, discount: { type: "FIXED", value: 1000 } })],
      orderDiscounts: [
        { type: "PERCENTAGE", value: 10 },
        { type: "PERCENTAGE", value: 5 },
      ],
    });

    // 9,000 × 10% + 9,000 × 5%
    expect(result.orderDiscountTotal).toBe("1350.00");
    expect(result.taxableAmount).toBe("7650.00");
  });

  it("rejects a line discount larger than the line", () => {
    expect(() => calc({ lines: [line({ discount: { type: "FIXED", value: 1000.01 } })] })).toThrow(
      CalculationError,
    );
    expect(() =>
      calc({ lines: [line({ quantity: 2, discount: { type: "PER_UNIT", value: 1001 } })] }),
    ).toThrow("cannot exceed");
  });

  it("rejects order discounts larger than the order", () => {
    expect(() =>
      calc({
        orderDiscounts: [
          { type: "PERCENTAGE", value: 60 },
          { type: "PERCENTAGE", value: 50 },
        ],
      }),
    ).toThrow("cannot exceed");
  });

  it("rejects percentages outside 0–100 and negative amounts", () => {
    expect(() =>
      calc({ lines: [line({ discount: { type: "PERCENTAGE", value: 101 } })] }),
    ).toThrow();
    expect(() => calc({ lines: [line({ discount: { type: "FIXED", value: -1 } })] })).toThrow();
  });

  it("allows a 100% discount", () => {
    const result = calc({ lines: [line({ discount: { type: "PERCENTAGE", value: 100 } })] });
    expect(result.grandTotal).toBe("0.00");
  });
});

describe("calculateOrderTotals — charges", () => {
  it("adds non-taxable charges after tax", () => {
    const result = calc({ charges: [{ label: "Handling", type: "FIXED", value: 50 }] });

    expect(result).toMatchObject({
      chargeTotal: "50.00",
      taxableAmount: "1000.00",
      taxTotal: "180.00",
      grandTotal: "1230.00",
    });
    expect(result.charges[0]).toMatchObject({ taxRate: null, taxAmount: "0.00", total: "50.00" });
  });

  it("computes percentage charges on the subtotal", () => {
    const result = calc({
      lines: [line({ quantity: 5, discount: { type: "FIXED", value: 1000 } })],
      charges: [{ label: "Shipping", type: "PERCENTAGE", value: 2, taxRate: 18 }],
    });

    // 2% of the 5,000 subtotal, taxed at 18%.
    expect(result.charges[0]).toMatchObject({ amount: "100.00", cgst: "9.00", total: "118.00" });
    expect(result.taxableAmount).toBe("4100.00");
  });

  it("rejects negative charges", () => {
    expect(() => calc({ charges: [{ label: "x", type: "FIXED", value: -5 }] })).toThrow();
  });
});

describe("calculateOrderTotals — rounding", () => {
  it("rounds line amounts to paise", () => {
    expect(calc({ lines: [line({ basePrice: "1234.567" })] }).lines[0].grossAmount).toBe("1234.57");
  });

  it("does not suffer from floating-point error", () => {
    const result = calc({ lines: [line({ basePrice: 0.1, quantity: 3, taxRate: 0 })] });
    expect(result.grandTotal).toBe("0.30");
  });

  it("supports decimal quantities", () => {
    expect(calc({ lines: [line({ quantity: "2.5", basePrice: 40 })] }).subtotal).toBe("100.00");
  });

  it("rounds the grand total to the nearest rupee when enabled", () => {
    const result = calc({
      lines: [line({ basePrice: "99.40", taxRate: 0 })],
      rounding: { roundGrandTotal: true },
    });
    expect(result).toMatchObject({ roundingAdjustment: "-0.40", grandTotal: "99.00" });
  });

  it("taxes per line or per invoice", () => {
    const lines = ["a", "b", "c"].map((id) => line({ productId: id, basePrice: "10.25" }));

    const perLine = calc({ lines, rounding: { taxRounding: "PER_LINE" } });
    expect(perLine.cgstTotal).toBe("2.76"); // 3 × round(0.9225)

    const perInvoice = calc({ lines, rounding: { taxRounding: "PER_INVOICE" } });
    expect(perInvoice.cgstTotal).toBe("2.77"); // round(30.75 × 9%)
    expect(perInvoice.lines.map((l) => l.cgst)).toEqual(["0.93", "0.92", "0.92"]);
  });

  it("supports banker's rounding", () => {
    // 0.125 → 0.12 with HALF_EVEN, 0.13 with HALF_UP.
    const input = { lines: [line({ basePrice: "0.125", taxRate: 0 })] };
    expect(calc({ ...input, rounding: { mode: "HALF_EVEN" } }).grandTotal).toBe("0.12");
    expect(calc({ ...input, rounding: { mode: "HALF_UP" } }).grandTotal).toBe("0.13");
  });
});

describe("calculateOrderTotals — GST configuration", () => {
  it("charges no tax when GST is disabled", () => {
    const result = calc({ tax: { ...intraState, gstEnabled: false, pricesIncludeTax: true } });
    expect(result).toMatchObject({ taxTotal: "0.00", grandTotal: "1000.00", taxSummary: [] });
  });

  it("honours a supply type override", () => {
    const result = calc({ tax: { ...intraState, supplyTypeOverride: "INTER_STATE" } });
    expect(result.igstTotal).toBe("180.00");
  });

  it("groups the tax summary by rate", () => {
    const result = calc({
      lines: [
        line({ productId: "a", taxRate: 18 }),
        line({ productId: "b", taxRate: 5 }),
        line({ productId: "c", taxRate: 18 }),
      ],
      charges: [{ label: "Shipping", type: "FIXED", value: 100, taxRate: 18 }],
    });

    expect(result.taxSummary).toEqual([
      {
        taxRate: "5",
        taxableAmount: "1000.00",
        cgst: "25.00",
        sgst: "25.00",
        igst: "0.00",
        taxAmount: "50.00",
      },
      {
        taxRate: "18",
        taxableAmount: "2100.00",
        cgst: "189.00",
        sgst: "189.00",
        igst: "0.00",
        taxAmount: "378.00",
      },
    ]);
  });

  it("rejects invalid tax rates", () => {
    expect(() => calc({ lines: [line({ taxRate: -1 })] })).toThrow("Tax rate");
  });
});

describe("calculateOrderTotals — validation", () => {
  it("requires at least one item", () => {
    expect(() => calc({ lines: [] })).toThrow("at least one item");
  });

  it("requires a positive quantity", () => {
    expect(() => calc({ lines: [line({ quantity: 0 })] })).toThrow("Quantity");
    expect(() => calc({ lines: [line({ quantity: -1 })] })).toThrow("Quantity");
  });

  it("rejects negative prices", () => {
    expect(() => calc({ lines: [line({ basePrice: -1 })] })).toThrow("negative");
    expect(() => calc({ lines: [line({ unitPriceOverride: -1 })] })).toThrow("negative");
  });

  it("raises errors with the CALCULATION_ERROR code", () => {
    try {
      calc({ lines: [] });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(CalculationError);
      expect((error as CalculationError).code).toBe("CALCULATION_ERROR");
      expect((error as CalculationError).status).toBe(422);
    }
  });
});

describe("calculateOrderTotals — pricing", () => {
  it("records a manual price override", () => {
    const result = calc({ lines: [line({ unitPriceOverride: 875 })] });
    expect(result.lines[0]).toMatchObject({ unitPrice: "875", priceSource: { type: "MANUAL" } });
  });

  it("applies price rules and records which one", () => {
    const result = calc({
      customer: { groupId: "distributor" },
      lines: [line({ quantity: 100 })],
      priceRules: [
        {
          id: "r1",
          name: "Distributor Bulk Price",
          priority: 10,
          price: 850,
          customerGroupId: "distributor",
          minQuantity: 100,
        },
      ],
    });
    expect(result.lines[0]).toMatchObject({
      unitPrice: "850",
      grossAmount: "85000.00",
      priceSource: { type: "RULE", ruleId: "r1", ruleName: "Distributor Bulk Price" },
    });
  });
});

describe("calculateOrderTotals — invariants", () => {
  // Small seeded PRNG so failures are reproducible.
  function mulberry32(seed: number) {
    return () => {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  it("totals always reconcile across 500 random orders", () => {
    const random = mulberry32(42);
    const pick = <T>(items: readonly T[]) => items[Math.floor(random() * items.length)];
    const rates = [0, 5, 12, 18, 28];

    for (let n = 0; n < 500; n++) {
      const lines = Array.from({ length: 1 + Math.floor(random() * 6) }, (_, i) =>
        line({
          productId: `p${i}`,
          quantity: (1 + Math.floor(random() * 50)).toString(),
          basePrice: (random() * 5000).toFixed(3),
          taxRate: pick(rates),
          discount:
            random() < 0.3 ? { type: "PERCENTAGE", value: Math.floor(random() * 30) } : undefined,
        }),
      );
      const input: OrderCalculationInput = {
        lines,
        orderDiscounts:
          random() < 0.5 ? [{ type: "PERCENTAGE", value: Math.floor(random() * 20) }] : [],
        charges:
          random() < 0.5 ? [{ label: "Shipping", type: "FIXED", value: 99, taxRate: 18 }] : [],
        tax: { ...pick([intraState, interState]), pricesIncludeTax: random() < 0.3 },
        rounding: {
          taxRounding: pick(["PER_LINE", "PER_INVOICE"] as const),
          roundGrandTotal: random() < 0.5,
        },
      };
      const result = calculateOrderTotals(input);
      const d = (values: string[]) => sum(values.map(dec));

      // Line and charge totals plus round-off make up the grand total.
      expect(
        d([...result.lines.map((l) => l.lineTotal), ...result.charges.map((c) => c.total)])
          .plus(dec(result.roundingAdjustment))
          .toFixed(2),
      ).toBe(result.grandTotal);

      // Header totals equal the sum of their parts.
      expect(
        d(result.lines.map((l) => l.cgst))
          .plus(d(result.charges.map((c) => c.cgst)))
          .toFixed(2),
      ).toBe(result.cgstTotal);
      expect(d(result.taxSummary.map((r) => r.taxableAmount)).toFixed(2)).toBe(
        result.taxableAmount,
      );
      expect(d(result.lines.map((l) => l.orderDiscountShare)).toFixed(2)).toBe(
        result.orderDiscountTotal,
      );

      // Intra-state tax is always split evenly; nothing is negative.
      if (result.supplyType === "INTRA_STATE") expect(result.cgstTotal).toBe(result.sgstTotal);
      else expect(result.cgstTotal).toBe("0.00");
      for (const l of result.lines) expect(dec(l.taxableAmount).gte(0)).toBe(true);
      expect(dec(result.roundingAdjustment).abs().lte("0.5")).toBe(true);
    }
  });
});
