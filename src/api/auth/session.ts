import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/api/supabase/server";
import { ACTIVE_ORGANIZATION_COOKIE, ONE_YEAR_IN_SECONDS } from "@/constants/cookies";
import { LOGIN_PATH, ONBOARDING_PATH } from "@/constants/routes";
import type { CurrentUser, Membership, OrganizationContext } from "@/types/auth";

/**
 * The verified session JWT's claims, or null when signed out. With asymmetric
 * signing keys this is checked locally (no network call). Cached per request.
 */
const getClaims = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ? data.claims : null;
});

/** The signed-in user, or null. Cached per request so layouts and pages can both call it. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const claims = await getClaims();
  if (!claims) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", claims.sub)
    .maybeSingle();

  return { id: claims.sub, email: claims.email ?? "", fullName: profile?.full_name ?? null };
});

/** The signed-in user, or a redirect to login. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH);
  return user;
}

/** Organizations the signed-in user belongs to, oldest first. */
export const getMemberships = cache(async (): Promise<Membership[]> => {
  // Only needs the user id, so it doesn't wait for the profile lookup.
  const claims = await getClaims();
  if (!claims) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organization_members")
    .select("role, organization:organizations(*)")
    .eq("user_id", claims.sub)
    .order("created_at");
  if (error) throw error;

  return data.flatMap((m) =>
    m.organization ? [{ role: m.role, organization: m.organization }] : [],
  );
});

/**
 * The user and the organization they're working in: the one in the
 * active-organization cookie if they're still a member, otherwise their
 * first. Redirects to login or onboarding when there isn't one.
 */
export async function requireOrganization(): Promise<OrganizationContext> {
  const [user, memberships] = await Promise.all([requireUser(), getMemberships()]);
  if (memberships.length === 0) redirect(ONBOARDING_PATH);

  const activeId = (await cookies()).get(ACTIVE_ORGANIZATION_COOKIE)?.value;
  const active = memberships.find((m) => m.organization.id === activeId) ?? memberships[0];
  return { user, memberships, ...active };
}

/** Makes `organizationId` the one the user works in on later requests. */
export async function setActiveOrganization(organizationId: string): Promise<void> {
  (await cookies()).set(ACTIVE_ORGANIZATION_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_IN_SECONDS,
  });
}

export async function clearActiveOrganization(): Promise<void> {
  (await cookies()).delete(ACTIVE_ORGANIZATION_COOKIE);
}
