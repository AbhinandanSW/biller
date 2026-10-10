import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/app/components/auth/AuthCard";
import { SignupForm } from "@/app/components/auth/SignupForm";

export const metadata: Metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <AuthCard
      title="Create your account"
      description="Manage products, customers, orders and GST invoices"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthCard>
  );
}
