import type { ERROR_STATUS } from "@/constants/errors";

export type ErrorCode = keyof typeof ERROR_STATUS;

/** The shape of errors returned by supabase-js (PostgrestError) and Postgres drivers. */
export interface DatabaseError {
  code?: string;
  message: string;
  details?: string | null;
  hint?: string | null;
}
