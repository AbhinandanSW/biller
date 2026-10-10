import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/app/components/auth/AuthCard";
import { ForgotPasswordForm } from "@/app/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="We'll email you a link to choose a new one"
      footer={
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
