/** HTTP status for each application error code. */
export const ERROR_STATUS = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  VALIDATION_ERROR: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  CALCULATION_ERROR: 422,
  INTERNAL_ERROR: 500,
} as const;

/** Postgres unique_violation. */
export const UNIQUE_VIOLATION = "23505";
