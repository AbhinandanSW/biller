import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/app/components/auth/AuthCard";
import { LoginForm } from "@/app/components/auth/LoginForm";
import { safeNextPath } from "@/utils/routes";
import { searchParam } from "@/utils/search-params";

export const metadata: Metadata = { title: "Sign in" };

const NOTICES: Record<string, string> = {
  link: "That link is invalid or has expired. Please try again.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = searchParam(params.next);
  const error = searchParam(params.error);

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
      <LoginForm
        next={next ? safeNextPath(next) : undefined}
        notice={error ? NOTICES[error] : undefined}
      />
    </AuthCard>
  );
}
