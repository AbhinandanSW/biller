import type { Metadata } from "next";

import { countCustomers } from "@/features/customers/data";
import { DashboardView } from "@/features/dashboard/DashboardView";
import { getDashboardStats, listTopCustomers } from "@/features/orders/data";
import { roleHasPermission } from "@/lib/auth/permissions";
import { requireOrganization } from "@/lib/auth/session";

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
      firstName={user.fullName?.split(" ")[0]}
      stats={stats}
      activeCustomers={activeCustomers}
      topCustomers={topCustomers}
      canCreateOrder={roleHasPermission(role, "orders.create")}
    />
  );
}
