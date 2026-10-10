import { z } from "zod";

// Mirrors the Supabase Auth password policy in supabase/config.toml
// (minimum_password_length = 8, password_requirements = "letters_digits").
// Keep the production project's Auth settings in sync.
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters")
  // bcrypt, which Supabase Auth uses, ignores anything past 72 bytes.
  .max(72, "Use at most 72 characters")
  .regex(/[a-zA-Z]/, "Include at least one letter")
  .regex(/[0-9]/, "Include at least one number");

// Trim before validating so pasted addresses with stray spaces are accepted.
const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));

export const LoginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const SignupSchema = z.object({
  fullName: z.string().trim().min(1, "Enter your name").max(200),
  email,
  password: passwordSchema,
});

export const ForgotPasswordSchema = z.object({ email });

export const ResetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
