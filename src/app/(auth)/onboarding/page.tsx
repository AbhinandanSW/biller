import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CreateOrganizationForm } from "@/features/organizations/components/CreateOrganizationForm";
import { AuthCard } from "@/features/auth/components/AuthCard";
import { HOME_PATH } from "@/lib/auth/routes";
import { getMemberships, requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Set up your business" };

export default async function OnboardingPage() {
  const user = await requireUser();
  // One business per user until there's an organization switcher.
  if ((await getMemberships()).length > 0) redirect(HOME_PATH);

  const firstName = user.fullName?.split(" ")[0];

  return (
    <AuthCard
      title={firstName ? `Welcome, ${firstName}` : "Welcome"}
      description="Tell us about your business. You can change this any time."
    >
      <CreateOrganizationForm />
    </AuthCard>
  );
}
