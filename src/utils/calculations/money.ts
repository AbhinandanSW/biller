import Decimal from "decimal.js";

import type { DecimalInput, RoundingMode } from "@/types/calculation";

/**
 * Isolated Decimal constructor for all financial math. Never use JS numbers
 * for money arithmetic; convert inputs with `dec()` first.
 */
export const Money = Decimal.clone({ precision: 40, rounding: Decimal.ROUND_HALF_UP });
export type Dec = Decimal;

const ROUNDING: Record<RoundingMode, Decimal.Rounding> = {
  HALF_UP: Decimal.ROUND_HALF_UP,
  HALF_EVEN: Decimal.ROUND_HALF_EVEN,
};

export const ZERO = new Money(0);
export const HUNDRED = new Money(100);

export function dec(value: DecimalInput): Decimal {
  return new Money(value);
}

export function sum(values: readonly Decimal[]): Decimal {
  return values.reduce<Decimal>((acc, v) => acc.plus(v), ZERO);
}

/** Rounds to 2 decimal places (paise). */
export function round2(value: Decimal, mode: RoundingMode): Decimal {
  return value.toDecimalPlaces(2, ROUNDING[mode]);
}

/** Rounds to a whole rupee — used for invoice round-off. */
export function round0(value: Decimal, mode: RoundingMode): Decimal {
  return value.toDecimalPlaces(0, ROUNDING[mode]);
}

/** Serializes a money value for APIs and PostgreSQL numeric(…, 2) columns. */
export function toAmount(value: Decimal): string {
  return value.toFixed(2);
}

/**
 * Splits `total` (2dp) across `weights` proportionally so the parts sum to
 * exactly `total`. Uses the largest-remainder method on paise; ties go to the
 * earlier index, so the result is deterministic.
 */
export function allocate(total: Decimal, weights: readonly Decimal[]): Decimal[] {
  if (weights.length === 0) return [];
  if (total.isZero()) return weights.map(() => ZERO);

  const weightSum = sum(weights);
  if (weightSum.lte(0)) {
    throw new Error("Cannot allocate a non-zero amount across zero weights");
  }

  const totalPaise = total.times(100);
  if (!totalPaise.isInteger()) {
    throw new Error(`allocate() expects a 2dp amount, got ${total.toString()}`);
  }

  const exact = weights.map((w) => totalPaise.times(w).div(weightSum));
  const floors = exact.map((v) => v.floor());
  let remainder = totalPaise.minus(sum(floors)).toNumber();

  const order = exact
    .map((v, index) => ({ index, fraction: v.minus(v.floor()) }))
    .sort((a, b) => b.fraction.comparedTo(a.fraction) || a.index - b.index);

  for (const { index } of order) {
    if (remainder <= 0) break;
    floors[index] = floors[index].plus(1);
    remainder -= 1;
  }

  return floors.map((paise) => paise.div(100));
}
