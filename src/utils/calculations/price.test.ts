import { describe, expect, it } from "vitest";

import type { PriceRule } from "@/types/calculation";

import { resolvePrice } from "./price";

const product = { productId: "tshirt", categoryId: "apparel", basePrice: 1000 };
const now = new Date("2026-09-28T10:00:00Z");

// §85: default ₹1,000 → group ₹950 → bulk ₹900.
const rules: PriceRule[] = [
  {
    id: "group",
    name: "Distributor price",
    priority: 10,
    price: 950,
    customerGroupId: "distributor",
  },
  {
    id: "bulk",
    name: "Distributor bulk",
    priority: 20,
    price: 900,
    customerGroupId: "distributor",
    minQuantity: 100,
  },
];

describe("resolvePrice", () => {
  it("falls back to the base price when no rule matches", () => {
    const result = resolvePrice({ ...product, quantity: 500 }, rules, { date: now });
    expect(result.unitPrice.toString()).toBe("1000");
    expect(result.source).toEqual({ type: "BASE" });
  });

  it("applies the customer group price", () => {
    const result = resolvePrice({ ...product, quantity: 50 }, rules, {
      customerGroupId: "distributor",
      date: now,
    });
    expect(result.unitPrice.toString()).toBe("950");
    expect(result.source).toMatchObject({ ruleId: "group" });
  });

  it("prefers the higher-priority quantity rule once the threshold is met", () => {
    const result = resolvePrice({ ...product, quantity: 100 }, rules, {
      customerGroupId: "distributor",
      date: now,
    });
    expect(result.unitPrice.toString()).toBe("900");
    expect(result.source).toEqual({ type: "RULE", ruleId: "bulk", ruleName: "Distributor bulk" });
  });

  it("supports quantity tiers with min and max bounds", () => {
    const tiers: PriceRule[] = [
      { id: "t1", name: "1–9", priority: 0, price: 100, maxQuantity: 9 },
      { id: "t2", name: "10–49", priority: 0, price: 95, minQuantity: 10, maxQuantity: 49 },
      { id: "t3", name: "50–99", priority: 0, price: 90, minQuantity: 50, maxQuantity: 99 },
      { id: "t4", name: "100+", priority: 0, price: 85, minQuantity: 100 },
    ];
    const priceAt = (quantity: number) =>
      resolvePrice({ ...product, quantity }, tiers, { date: now }).unitPrice.toString();

    expect([1, 9, 10, 49, 50, 99, 100, 1000].map(priceAt)).toEqual([
      "100",
      "100",
      "95",
      "95",
      "90",
      "90",
      "85",
      "85",
    ]);
  });

  it("breaks priority ties by lowest price, then by id", () => {
    const tied: PriceRule[] = [
      { id: "b", name: "B", priority: 5, price: 800 },
      { id: "a", name: "A", priority: 5, price: 800 },
      { id: "c", name: "C", priority: 5, price: 820 },
    ];
    expect(resolvePrice({ ...product, quantity: 1 }, tied, { date: now }).source).toMatchObject({
      ruleId: "a",
    });
  });

  it("matches product, variant, category and customer conditions", () => {
    const scoped: PriceRule[] = [
      { id: "other-product", name: "x", priority: 99, price: 1, productId: "mug" },
      { id: "other-variant", name: "x", priority: 99, price: 1, variantId: "xl" },
      { id: "other-customer", name: "x", priority: 99, price: 1, customerId: "c2" },
      { id: "category", name: "Apparel sale", priority: 1, price: 700, categoryId: "apparel" },
    ];
    const result = resolvePrice({ ...product, variantId: "m", quantity: 1 }, scoped, {
      customerId: "c1",
      date: now,
    });
    expect(result.source).toMatchObject({ ruleId: "category" });
  });

  it("respects the validity window (from inclusive, until exclusive)", () => {
    const sale: PriceRule[] = [
      {
        id: "sale",
        name: "Diwali sale",
        priority: 1,
        price: 799,
        validFrom: new Date("2026-10-01T00:00:00Z"),
        validUntil: new Date("2026-11-01T00:00:00Z"),
      },
    ];
    const at = (iso: string) =>
      resolvePrice({ ...product, quantity: 1 }, sale, { date: new Date(iso) }).unitPrice.toString();

    expect(at("2026-09-30T23:59:59Z")).toBe("1000");
    expect(at("2026-10-01T00:00:00Z")).toBe("799");
    expect(at("2026-10-31T23:59:59Z")).toBe("799");
    expect(at("2026-11-01T00:00:00Z")).toBe("1000");
  });

  it("rejects negative prices", () => {
    expect(() =>
      resolvePrice({ ...product, basePrice: -1, quantity: 1 }, [], { date: now }),
    ).toThrow();
    expect(() =>
      resolvePrice({ ...product, quantity: 1 }, [{ id: "r", name: "r", priority: 0, price: -5 }], {
        date: now,
      }),
    ).toThrow();
  });
});
