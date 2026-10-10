import type { Metadata } from "next";

import { requireUser } from "@/api/auth/session";
import { AuthCard } from "@/app/components/auth/AuthCard";
import { ResetPasswordForm } from "@/app/components/auth/ResetPasswordForm";

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
