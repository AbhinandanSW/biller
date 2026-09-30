import { AppError, type ErrorCode } from "./errors";

/** The shape of errors returned by supabase-js (PostgrestError) and Postgres drivers. */
export interface DatabaseError {
  code?: string;
  message: string;
  details?: string | null;
  hint?: string | null;
}

// SQLSTATEs raised by our database functions and constraints.
// See the header of supabase/migrations/*_organizations.sql.
const SQLSTATE_TO_CODE: Record<string, ErrorCode> = {
  "28000": "UNAUTHORIZED",
  "42501": "FORBIDDEN",
  P0002: "NOT_FOUND",
  "23505": "CONFLICT",
  "22023": "VALIDATION_ERROR",
  "23514": "VALIDATION_ERROR",
  "23502": "VALIDATION_ERROR",
  "22P02": "VALIDATION_ERROR",
  // PostgREST: no rows for .single()
  PGRST116: "NOT_FOUND",
};

// Constraint and internal messages aren't meant for end users.
const GENERIC_MESSAGES: Partial<Record<string, string>> = {
  "23505": "This record already exists",
  "23514": "Some values are invalid",
  "23502": "A required value is missing",
  "22P02": "Some values are invalid",
  PGRST116: "Not found",
};

/** Converts a database error into an AppError with a safe, user-facing message. */
export function fromDatabaseError(error: DatabaseError): AppError {
  const code = error.code ? SQLSTATE_TO_CODE[error.code] : undefined;
  if (!code) {
    console.error("Unexpected database error", error);
    return new AppError("INTERNAL_ERROR", "Something went wrong");
  }
  // Messages from our own `raise exception` calls are written for users.
  const message = (error.code && GENERIC_MESSAGES[error.code]) ?? error.message;
  return new AppError(code, message);
}
