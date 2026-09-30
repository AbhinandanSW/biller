import type { z } from "zod";

/** State returned by a server action to a form using useActionState. */
export interface FormState<TField extends string = string> {
  /** Per-field messages, shown next to each field. */
  errors?: Partial<Record<TField, string>>;
  /** Form-level error, shown above the submit button. */
  error?: string;
  /** Form-level success message. */
  message?: string;
  /**
   * Submitted values to put back in the form. React resets uncontrolled
   * inputs after an action, so without this a failed submit clears them.
   * Never include passwords.
   */
  values?: Partial<Record<TField, string>>;
}

/** First error per field, in the shape FormState expects. */
export function fieldErrors<TField extends string>(
  error: z.ZodError,
): Partial<Record<TField, string>> {
  const errors: Partial<Record<TField, string>> = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as TField | undefined;
    if (field && !errors[field]) errors[field] = issue.message;
  }
  return errors;
}

/** Reads string fields from FormData (missing fields become empty strings). */
export function formValues<TField extends string>(
  formData: FormData,
  fields: readonly TField[],
): Record<TField, string> {
  return Object.fromEntries(
    fields.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : ""];
    }),
  ) as Record<TField, string>;
}
