/** Raw value of one `searchParams` entry, as Next.js passes it to pages. */
type SearchParamValue = string | string[] | undefined;

/** The value of a single-valued search param; repeated or missing params are ignored. */
export function searchParam(value: SearchParamValue): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** `?page=` as a positive integer, defaulting to 1. */
export function parsePage(value: SearchParamValue): number {
  const page = Number(searchParam(value) ?? 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

/** `value` if it is one of `options`, otherwise `fallback`. */
export function oneOf<T extends string>(
  value: SearchParamValue,
  options: readonly T[],
  fallback: T,
): T {
  const v = searchParam(value);
  return v && (options as readonly string[]).includes(v) ? (v as T) : fallback;
}
