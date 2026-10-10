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

/** Result of a server action that only reports failure. */
export interface ActionResult {
  error?: string;
}

export type LoginField = "email" | "password";
export type SignupField = "fullName" | "email" | "password";
export type ForgotPasswordField = "email";
export type ResetPasswordField = "password" | "confirmPassword";
export type CreateOrganizationField = "name" | "legalName" | "gstin" | "stateCode";
