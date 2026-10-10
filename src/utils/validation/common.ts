import { z } from "zod";

/** "1,250.50" / "1250.5" → validated string for numeric(14,2). Commas are allowed. */
export const moneyString = z
  .string()
  .trim()
  .transform((v) => v.replaceAll(",", ""))
  .pipe(z.string().regex(/^\d{1,12}(\.\d{1,2})?$/, "Enter an amount like 1250 or 1250.50"));

/** Trimmed text; empty becomes null. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use at most ${max} characters`)
    .transform((v) => v || null);

/** Optional text that must match `pattern` when present. Uppercased. */
export const optionalCode = (pattern: RegExp, message: string) =>
  z
    .string()
    .trim()
    .toUpperCase()
    .transform((v) => v || null)
    .pipe(z.string().regex(pattern, message).nullable());
