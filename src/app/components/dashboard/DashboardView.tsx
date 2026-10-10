import { IndianRupee, Plus, ReceiptText, TriangleAlert, Users } from "lucide-react";
import Link from "next/link";

import { StatCard } from "@/app/components/common/StatCard";
import { PageHeader } from "@/app/components/layout/PageHeader";
import { OrdersTable } from "@/app/components/orders/OrdersTable";
import {
  buttonClassName,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui";
import type { DashboardStats, TopCustomer } from "@/types/dashboard";
import { formatMoney } from "@/utils/format";

export function DashboardView({
  firstName,
  stats,
  activeCustomers,
  topCustomers,
  canCreateOrder,
}: {
  firstName?: string;
  stats: DashboardStats;
  activeCustomers: number;
  topCustomers: TopCustomer[];
  canCreateOrder: boolean;
}) {
  const monthName = new Date().toLocaleString("en-IN", { month: "long", timeZone: "Asia/Kolkata" });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <PageHeader
        title={firstName ? `Welcome, ${firstName}` : "Dashboard"}
        description="Here's how the business is doing"
        actions={
          canCreateOrder && (
            <Link href="/orders/new" className={buttonClassName()}>
              <Plus aria-hidden />
              New order
            </Link>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={`Sales in ${monthName}`}
          value={formatMoney(stats.salesThisMonth)}
          hint="Invoiced this month"
          icon={<IndianRupee />}
        />
        <StatCard
          label="Orders this month"
          value={stats.ordersThisMonth}
          hint={`${stats.draftCount} ${stats.draftCount === 1 ? "draft" : "drafts"} · ${stats.toInvoiceCount} to invoice`}
          icon={<ReceiptText />}
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(stats.outstanding)}
          hint={stats.overdueCount ? `${stats.overdueCount} overdue` : "Nothing overdue"}
          icon={<TriangleAlert />}
        />
        <StatCard label="Customers" value={activeCustomers} hint="Active" icon={<Users />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader
            title="Recent orders"
            actions={
              <Link href="/orders" className="text-label text-primary hover:underline">
                View all
              </Link>
            }
          />
          <CardContent className="px-0 pb-0">
            {stats.recent.length === 0 ? (
              <EmptyState
                title="No orders yet"
                action={
                  canCreateOrder && (
                    <Link href="/orders/new" className={buttonClassName()}>
                      <Plus aria-hidden />
                      Create your first order
                    </Link>
                  )
                }
              />
            ) : (
              <OrdersTable orders={stats.recent} showInvoice={false} label="Recent orders" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Top customers" description="By invoiced revenue" />
          <CardContent className="px-0 pb-0">
            {topCustomers.length === 0 ? (
              <EmptyState title="No sales yet" />
            ) : (
              <Table aria-label="Top customers">
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead numeric>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.map((c) => (
                    <TableRow key={c.id} className="relative">
                      <TableCell>
                        <Link
                          href={`/customers/${c.id}`}
                          className="font-medium after:absolute after:inset-0"
                        >
                          {c.name}
                        </Link>
                        <div className="text-caption text-muted-foreground">
                          {c.orderCount} orders
                          {c.outstanding > 0 && ` · ${formatMoney(c.outstanding)} due`}
                        </div>
                      </TableCell>
                      <TableCell numeric>{formatMoney(c.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
