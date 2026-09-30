import type { Metadata } from "next";

import { AuthCard } from "@/features/auth/components/AuthCard";
import { ResetPasswordForm } from "@/features/auth/components/ResetPasswordForm";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Choose a new password" };

// Reached from the reset email: /auth/confirm signs the user in first.
export default async function ResetPasswordPage() {
  const user = await requireUser();
  return (
    <AuthCard title="Choose a new password" description={user.email}>
      <ResetPasswordForm />
    </AuthCard>
  );
}
