import { describe, expect, it } from "vitest";

import { allocate, dec, round2 } from "./money";

const amounts = (values: ReturnType<typeof dec>[]) => values.map((v) => v.toFixed(2));

describe("allocate", () => {
  it("splits evenly and gives leftover paise to the earliest items", () => {
    expect(amounts(allocate(dec(100), [dec(1), dec(1), dec(1)]))).toEqual([
      "33.34",
      "33.33",
      "33.33",
    ]);
    expect(amounts(allocate(dec("0.01"), [dec(1), dec(1), dec(1)]))).toEqual([
      "0.01",
      "0.00",
      "0.00",
    ]);
  });

  it("gives leftover paise to the largest remainders", () => {
    expect(amounts(allocate(dec(200), [dec(2500), dec(1600)]))).toEqual(["121.95", "78.05"]);
  });

  it("gives nothing to zero-weight items", () => {
    expect(amounts(allocate(dec(10), [dec(0), dec(3), dec(1)]))).toEqual(["0.00", "7.50", "2.50"]);
  });

  it("handles zero totals and empty inputs", () => {
    expect(amounts(allocate(dec(0), [dec(0), dec(0)]))).toEqual(["0.00", "0.00"]);
    expect(allocate(dec(5), [])).toEqual([]);
  });

  it("refuses to allocate across zero weights or sub-paisa totals", () => {
    expect(() => allocate(dec(1), [dec(0)])).toThrow();
    expect(() => allocate(dec("0.001"), [dec(1)])).toThrow();
  });
});

describe("round2", () => {
  it("rounds half up or half even", () => {
    expect(round2(dec("2.345"), "HALF_UP").toFixed(2)).toBe("2.35");
    expect(round2(dec("2.345"), "HALF_EVEN").toFixed(2)).toBe("2.34");
    expect(round2(dec("-2.345"), "HALF_UP").toFixed(2)).toBe("-2.35");
  });
});
