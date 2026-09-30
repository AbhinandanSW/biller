/** UUIDs only — anything else can't be a valid id and should 404. */
export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/**
 * `%q%` pattern for PostgREST ilike filters. Escapes LIKE wildcards and
 * strips characters that would break PostgREST's or=(...) syntax.
 */
export function containsPattern(q: string): string {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`).replace(/[,()]/g, " ")}%`;
}
