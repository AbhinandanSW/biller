import { cookies } from "next/headers";

import { requireOrganization } from "@/api/auth/session";
import { AppShell } from "@/app/components/layout/AppShell";
import { OrganizationProvider } from "@/app/components/providers/OrganizationProvider";
import { SIDEBAR_COOKIE } from "@/constants/cookies";
import { toOrganizationSettings } from "@/utils/organization";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const { user, organization, role } = await requireOrganization();
  const sidebarCollapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === "1";

  return (
    <OrganizationProvider value={toOrganizationSettings(organization)}>
      <AppShell
        organizationName={organization.name}
        user={user}
        role={role}
        sidebarCollapsed={sidebarCollapsed}
      >
        {children}
      </AppShell>
    </OrganizationProvider>
  );
}
