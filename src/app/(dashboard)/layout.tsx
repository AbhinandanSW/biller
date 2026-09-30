import { cookies } from "next/headers";

import { AppShell } from "@/components/layout/AppShell";
import { SIDEBAR_COOKIE } from "@/components/layout/sidebar-state";
import { OrganizationProvider } from "@/features/organizations/OrganizationProvider";
import { toOrganizationSettings } from "@/features/organizations/settings";
import { requireOrganization } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const { user, organization, role } = await requireOrganization();

  return (
    <OrganizationProvider value={toOrganizationSettings(organization)}>
      <AppShell
        organizationName={organization.name}
        user={user}
        role={role}
        sidebarCollapsed={(await cookies()).get(SIDEBAR_COOKIE)?.value === "1"}
      >
        {children}
      </AppShell>
    </OrganizationProvider>
  );
}
