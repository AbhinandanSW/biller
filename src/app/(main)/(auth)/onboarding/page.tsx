import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getMemberships, requireUser } from "@/api/auth/session";
import { AuthCard } from "@/app/components/auth/AuthCard";
import { CreateOrganizationForm } from "@/app/components/organizations/CreateOrganizationForm";
import { HOME_PATH } from "@/constants/routes";
import { firstName } from "@/utils/format";

export const metadata: Metadata = { title: "Set up your business" };

export default async function OnboardingPage() {
  const user = await requireUser();
  // One business per user until there's an organization switcher.
  if ((await getMemberships()).length > 0) redirect(HOME_PATH);

  const name = firstName(user.fullName);

  return (
    <AuthCard
      title={name ? `Welcome, ${name}` : "Welcome"}
      description="Tell us about your business. You can change this any time."
    >
      <CreateOrganizationForm />
    </AuthCard>
  );
}
