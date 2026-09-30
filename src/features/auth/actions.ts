"use server";

import type { AuthError } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getPublicEnv } from "@/lib/env";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";
import { ACTIVE_ORGANIZATION_COOKIE } from "@/lib/auth/session";
import { LOGIN_PATH, ONBOARDING_PATH, safeNextPath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/server";
import {
  ForgotPasswordSchema,
  LoginSchema,
  ResetPasswordSchema,
  SignupSchema,
} from "@/lib/validation/auth";

// Supabase Auth error codes → messages for users. Anything else gets a
// generic message so internals never leak into the UI.
const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: "Incorrect email or password.",
  email_not_confirmed: "Confirm your email first — check your inbox for the link.",
  user_already_exists: "An account with this email already exists. Sign in instead.",
  email_exists: "An account with this email already exists. Sign in instead.",
  weak_password: "Choose a stronger password.",
  same_password: "Choose a password different from your current one.",
  over_email_send_rate_limit: "Too many emails sent. Please wait a few minutes and try again.",
  over_request_rate_limit: "Too many attempts. Please wait a few minutes and try again.",
};

function authErrorMessage(error: AuthError): string {
  const message = error.code ? AUTH_MESSAGES[error.code] : undefined;
  if (!message) console.error("Unexpected auth error", { code: error.code, status: error.status });
  return message ?? "Something went wrong. Please try again.";
}

/** Link back to /auth/confirm, which finishes the flow and continues to `next`. */
function confirmUrl(next: string) {
  return `${getPublicEnv().NEXT_PUBLIC_APP_URL}/auth/confirm?next=${encodeURIComponent(next)}`;
}

export type LoginField = "email" | "password";

export async function login(
  _: FormState<LoginField>,
  formData: FormData,
): Promise<FormState<LoginField>> {
  const values = formValues(formData, ["email", "password"] as const);
  const parsed = LoginSchema.safeParse(values);
  if (!parsed.success) {
    return { errors: fieldErrors<LoginField>(parsed.error), values: { email: values.email } };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: authErrorMessage(error), values: { email: values.email } };

  redirect(safeNextPath(formData.get("next") as string | null));
}

export type SignupField = "fullName" | "email" | "password";

export async function signup(
  _: FormState<SignupField>,
  formData: FormData,
): Promise<FormState<SignupField>> {
  const values = formValues(formData, ["fullName", "email", "password"] as const);
  const kept = { fullName: values.fullName, email: values.email };
  const parsed = SignupSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors<SignupField>(parsed.error), values: kept };

  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: confirmUrl(ONBOARDING_PATH) },
  });
  if (error) return { error: authErrorMessage(error), values: kept };

  // With email confirmation off (local dev) the user is signed in straight away.
  if (data.session) redirect(ONBOARDING_PATH);

  return {
    message: `We've sent a confirmation link to ${email}. Open it to finish creating your account.`,
  };
}

export type ForgotPasswordField = "email";

export async function requestPasswordReset(
  _: FormState<ForgotPasswordField>,
  formData: FormData,
): Promise<FormState<ForgotPasswordField>> {
  const values = formValues(formData, ["email"] as const);
  const parsed = ForgotPasswordSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors<ForgotPasswordField>(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: confirmUrl("/reset-password"),
  });
  // Rate limits are worth reporting; other errors aren't, so the response
  // never reveals whether an account exists.
  if (error?.code?.startsWith("over_")) return { error: authErrorMessage(error), values };

  return {
    message: `If an account exists for ${parsed.data.email}, we've emailed a link to reset the password.`,
  };
}

export type ResetPasswordField = "password" | "confirmPassword";

export async function updatePassword(
  _: FormState<ResetPasswordField>,
  formData: FormData,
): Promise<FormState<ResetPasswordField>> {
  const parsed = ResetPasswordSchema.safeParse(
    formValues(formData, ["password", "confirmPassword"] as const),
  );
  if (!parsed.success) return { errors: fieldErrors<ResetPasswordField>(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: authErrorMessage(error) };

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  (await cookies()).delete(ACTIVE_ORGANIZATION_COOKIE);
  redirect(LOGIN_PATH);
}
