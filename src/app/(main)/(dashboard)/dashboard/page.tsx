import type { Metadata } from "next";

import { requireOrganization } from "@/api/auth/session";
import { countCustomers } from "@/api/customers/queries";
import { getDashboardStats, listTopCustomers } from "@/api/dashboard/queries";
import { DashboardView } from "@/app/components/dashboard/DashboardView";
import { firstName } from "@/utils/format";
import { roleHasPermission } from "@/utils/permissions";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const { user, organization, role } = await requireOrganization();
  const [stats, activeCustomers, topCustomers] = await Promise.all([
    getDashboardStats(organization.id),
    countCustomers(organization.id, "ACTIVE"),
    listTopCustomers(organization.id),
  ]);

  return (
    <DashboardView
      firstName={firstName(user.fullName)}
      stats={stats}
      activeCustomers={activeCustomers}
      topCustomers={topCustomers}
      canCreateOrder={roleHasPermission(role, "orders.create")}
    />
  );
}
