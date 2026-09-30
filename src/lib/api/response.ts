import { z } from "zod";

import { AppError } from "./errors";

export type ApiSuccess<T> = { success: true; data: T };
export type ApiFailure = {
  success: false;
  error: { code: string; message: string; details?: unknown };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T, init?: ResponseInit): Response {
  return Response.json({ success: true, data } satisfies ApiSuccess<T>, init);
}

/** Converts any thrown value into the standard error envelope. Never leaks internals. */
export function fail(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      {
        success: false,
        error: { code: error.code, message: error.message, details: error.details },
      } satisfies ApiFailure,
      { status: error.status },
    );
  }

  if (error instanceof z.ZodError) {
    return Response.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request",
          details: z.flattenError(error),
        },
      } satisfies ApiFailure,
      { status: 400 },
    );
  }

  console.error(error);
  return Response.json(
    {
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong" },
    } satisfies ApiFailure,
    { status: 500 },
  );
}
