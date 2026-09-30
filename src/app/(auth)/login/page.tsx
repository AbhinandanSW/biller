import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/features/auth/components/AuthCard";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { safeNextPath } from "@/lib/auth/routes";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  link: "That link is invalid or has expired. Please try again.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const nextPath = typeof next === "string" ? safeNextPath(next) : undefined;
  const notice = typeof error === "string" ? NOTICES[error] : undefined;

  return (
    <AuthCard
      title="Sign in"
      description="Welcome back"
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={nextPath} notice={notice} />
    </AuthCard>
  );
}
